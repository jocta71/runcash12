import time
import random
import re
import schedule
import json
import os
import platform
from datetime import datetime
import logging
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
from supabase import create_client
from flask import Flask, Response, request, jsonify
from flask_cors import CORS
import threading
import queue
import sys
import uuid
import hashlib
import requests

from config import CASINO_URL, SUPABASE_URL, SUPABASE_KEY, roleta_permitida_por_id, SCRAPE_INTERVAL_MINUTES, logger, MAX_CICLOS
from strategy_analyzer import StrategyAnalyzer

# Variáveis globais para controle de saúde do scraper
ultima_atividade_scraper = time.time()
contagem_erros_consecutivos = 0
MAX_ERROS_CONSECUTIVOS = 5
driver_global = None

# Configuração de nível de log mais restrito
logger.setLevel(logging.INFO)  # Pode mudar para logging.WARNING para ainda menos logs

# Verificar se estamos em ambiente de produção (Render, etc.)
IS_PRODUCTION = os.environ.get('RENDER', False) or os.environ.get('PRODUCTION', False)

# Criar a aplicação Flask
app = Flask(__name__)

# Configurar CORS - permitir requisições de qualquer origem em produção,
# ou apenas do localhost em desenvolvimento
if IS_PRODUCTION:
    # Em produção, permitir requisições apenas do domínio do frontend na Vercel
    # e outros domínios permitidos
    cors_origins = [
        "https://runcashnew-frontend-nu.vercel.app",    # URL atual do frontend na Vercel
        "https://runcashnew.vercel.app",               # URL anterior do frontend na Vercel
        "https://runcashnew-git-master-jocta71.vercel.app",
        "https://www.runcashnew.com",                  # Se você tiver um domínio personalizado
        "http://localhost:5173",                       # Para desenvolvimento local
        "http://localhost:3000"                        # Alternativa para desenvolvimento
    ]
    CORS(app, resources={
        r"/*": {"origins": cors_origins, "supports_credentials": True}
    })
    logger.info(f"CORS configurado para origens específicas: {cors_origins}")
else:
    # Em desenvolvimento, permitir todas as origens
    CORS(app)
    logger.info("CORS configurado para permitir todas as origens (modo desenvolvimento)")

# Inicialização do cliente Supabase
# Garantir que a URL do Supabase esteja corretamente formatada
supabase_url = SUPABASE_URL
if supabase_url.startswith('@'):
    supabase_url = supabase_url[1:]
if not supabase_url.startswith('http'):
    supabase_url = f"https://{supabase_url}"

try:
    supabase = create_client(supabase_url, SUPABASE_KEY)
    logger.info(f"Cliente Supabase inicializado com sucesso: {supabase_url}")
except Exception as e:
    logger.error(f"Erro ao inicializar cliente Supabase: {str(e)}")
    logger.error(f"URL: {supabase_url}")
    logger.error(f"Key: {SUPABASE_KEY[:10]}...")

# Criando a classe EventManager para gerenciar eventos SSE
class EventManager:
    def __init__(self):
        self.clients = []
        self.event_queue = queue.Queue()
        
    def register_client(self, client_queue):
        self.clients.append(client_queue)
        logger.info(f"Novo cliente SSE registrado. Total: {len(self.clients)}")
        
    def unregister_client(self, client_queue):
        if client_queue in self.clients:
            self.clients.remove(client_queue)
            logger.info(f"Cliente SSE desconectado. Restantes: {len(self.clients)}")
    
    def notify_clients(self, event_data):
        # Adicionar evento à fila
        self.event_queue.put(event_data)
        logger.info(f"Evento adicionado à fila: {event_data.get('type')} - Roleta: {event_data.get('roleta_nome')} - Número: {event_data.get('numero')}")
        
        # Enviar para todos os clientes
        clients_notified = 0
        for client_queue in self.clients[:]:  # Copia para evitar problemas se a lista mudar
            try:
                client_queue.put(event_data)
                clients_notified += 1
            except Exception as e:
                logger.error(f"Erro ao enviar evento para cliente: {str(e)}")
                # Cliente com problema, remover
                self.unregister_client(client_queue)
        
        logger.info(f"Evento enviado para {clients_notified} clientes de {len(self.clients)} conectados")

# Instanciando o gerenciador de eventos
event_manager = EventManager()

@app.route('/events')
def sse():
    """Endpoint SSE para transmitir eventos de novos números de roletas em tempo real"""
    def generate():
        client_queue = queue.Queue()
        event_manager.register_client(client_queue)
        
        # Enviar um evento inicial
        initial_msg = json.dumps({"type": "connected", "message": "Conexão SSE estabelecida"})
        yield f'data: {initial_msg}\n\n'
        
        # Verificar se há eventos na fila do gerenciador para enviar imediatamente
        if not event_manager.event_queue.empty():
            try:
                # Enviar até 5 eventos recentes da fila, se houver
                for _ in range(5):
                    try:
                        event_data = event_manager.event_queue.get_nowait()
                        yield f'data: {json.dumps(event_data)}\n\n'
                        logger.info(f"Evento recente enviado para novo cliente: {event_data.get('type')}")
                    except queue.Empty:
                        break
            except Exception as e:
                logger.error(f"Erro ao enviar eventos recentes: {str(e)}")
        
        # Enviar evento de teste para confirmar a conexão
        test_event = {
            "type": "test_connection",
            "message": "Testando conexão SSE",
            "timestamp": time.time()
        }
        yield f'data: {json.dumps(test_event)}\n\n'
        
        try:
            while True:
                # Aguardar eventos na fila do cliente
                try:
                    event_data = client_queue.get(timeout=20)  # Reduzido para 20s para mais heartbeats
                    event_json = json.dumps(event_data)
                    logger.info(f"Enviando evento para cliente: {event_data.get('type')}")
                    yield f'data: {event_json}\n\n'
                except queue.Empty:
                    # Enviar heartbeat para manter a conexão viva
                    logger.debug("Enviando ping SSE para manter a conexão")
                    yield 'event: ping\ndata: {}\n\n'
        except GeneratorExit:
            # Cliente desconectou
            event_manager.unregister_client(client_queue)
            logger.info("Cliente desconectado do SSE")
    
    return Response(generate(), mimetype='text/event-stream', 
                   headers={'Cache-Control': 'no-cache', 'Connection': 'keep-alive'})

# Endpoint de verificação de saúde para o Render
@app.route('/health')
def health_check():
    """Endpoint de verificação de saúde para monitoramento"""
    driver_status = "N/A"
    if hasattr(sys, 'scraper_thread_running'):
        driver_status = "Running" if sys.scraper_thread_running else "Not running"
    
    status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "scraper": driver_status,
        "clients_connected": len(event_manager.clients)
    }
    return jsonify(status)

@app.route('/api/test/event', methods=['POST'])
def generate_test_event():
    """Endpoint para gerar eventos de teste manualmente"""
    try:
        # Verificar autenticação (apenas para uso de desenvolvimento)
        if not IS_PRODUCTION or request.headers.get('X-API-Key') == os.environ.get('API_KEY'):
            data = request.json if request.is_json else {}
            
            # Usar os dados enviados ou gerar aleatórios
            roleta_nome = data.get('roleta', 'Roulette Live')
            numero = data.get('numero', random.randint(0, 36))
            roleta_id = data.get('roleta_id', '7x0b1tgh7agmf6hv')
            
            logger.info(f"[TESTE] Gerando evento manual para {roleta_nome} com número {numero}")
            
            # Criar o evento
            event_data = {
                "type": "new_number",
                "roleta": roleta_nome,
                "numero": numero,
                "timestamp": time.time(),
                "simulado": True,
                "manual": True,
                "test": True
            }
            
            # Inserir no Supabase
            try:
                inserir_novo_numero(roleta_id, roleta_nome, numero)
                logger.info(f"[TESTE] Número {numero} inserido no Supabase para {roleta_nome}")
            except Exception as e:
                logger.error(f"[TESTE] Erro ao inserir número simulado no Supabase: {str(e)}")
            
            # Verificar se há clientes conectados
            if len(event_manager.clients) > 0:
                logger.info(f"[TESTE] Notificando {len(event_manager.clients)} clientes sobre novo número")
                
                # Notificar clientes diretamente
                for client_queue in event_manager.clients[:]:
                    try:
                        client_queue.put(event_data)
                        logger.info(f"[TESTE] Evento enviado para um cliente")
                    except Exception as e:
                        logger.error(f"[TESTE] Erro ao enviar evento para cliente: {str(e)}")
                        # Cliente com problema, remover
                        event_manager.unregister_client(client_queue)
                
                # Também notificar via gerenciador de eventos (redundante, mas para garantir)
                event_manager.notify_clients(event_data)
            else:
                logger.warning("[TESTE] Nenhum cliente conectado para receber o evento")
            
            return jsonify({"success": True, "message": "Evento simulado enviado", "data": event_data})
        else:
            return jsonify({"success": False, "message": "Não autorizado"}), 401
    except Exception as e:
        logger.error(f"Erro ao gerar evento de teste: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

# Endpoint para ver as roletas ativas atualmente
@app.route('/api/roletas')
def listar_roletas():
    try:
        # Usar a abordagem de consultar a tabela roletas em vez de roleta_numeros
        # Isso evita o problema de GROUP BY com o campo timestamp
        response = supabase.table("roletas").select("nome").execute()
        roletas = []
        if response.data:
            # Extrair nomes de roletas da tabela roletas
            roletas = [item['nome'] for item in response.data]
        
        return jsonify({
            "status": "success",
            "count": len(roletas),
            "roletas": roletas
        })
    except Exception as e:
        logger.error(f"Erro ao listar roletas: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# Dicionário global para manter os analisadores de cada mesa
analisadores_mesas = {}

def configurar_driver():
    """Configura o driver do Selenium com opções para ambiente de cloud"""
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")  # Versão mais recente do modo headless
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    
    # Configurações adicionais específicas para o Render e ambientes cloud
    if IS_PRODUCTION:
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-setuid-sandbox")
        chrome_options.add_argument("--remote-debugging-port=9222")
        chrome_options.add_argument("--disable-software-rasterizer")
        chrome_options.add_argument("--disable-features=VizDisplayCompositor")
        chrome_options.add_argument("--ignore-certificate-errors")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36")
        
        # Caminhos possíveis para o Chrome/Chromium no Render
        chrome_paths = [
            "/usr/bin/chromium-browser",
            "/usr/bin/chromium",
            "/usr/bin/google-chrome",
            "/usr/bin/chrome",
        ]
        
        # Tentar cada caminho possível
        for chrome_path in chrome_paths:
            try:
                if os.path.exists(chrome_path):
                    logger.info(f"Chrome encontrado em: {chrome_path}")
                    service = Service(chrome_path)
                    driver = webdriver.Chrome(service=service, options=chrome_options)
                    logger.info("Driver do Chrome inicializado com caminho explícito em produção")
                    return driver
            except Exception as e:
                logger.warning(f"Erro ao inicializar Chrome com {chrome_path}: {str(e)}")
    
    # Método padrão para desenvolvimento local ou fallback
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        logger.info("Driver do Chrome inicializado com ChromeDriverManager")
        return driver
    except Exception as e:
        logger.error(f"Erro ao configurar o driver com ChromeDriverManager: {str(e)}")
        # Tentar ainda outro método em último caso
        try:
            driver = webdriver.Chrome(options=chrome_options)
            logger.info("Driver do Chrome inicializado com método de fallback")
            return driver
        except Exception as final_e:
            logger.critical(f"Falha em todos os métodos de inicialização do Chrome: {str(final_e)}")
            raise

def extrair_numeros_js(driver, elemento_roleta):
    """
    Extrai apenas o número mais recente (no topo) da roleta usando MutationObserver 
    para ser mais eficiente e evitar polling constante.
    """
    global ultima_atividade_scraper
    
    try:
        # Usar MutationObserver via JavaScript para detectar mudanças na DOM
        observer_script = """
        return new Promise((resolve) => {
            const targetNode = arguments[0];
            let lastNumber = null;
            
            // Verificar número atual usando os seletores conhecidos
            const checkCurrentNumber = () => {
                // Método 1: Spans dentro do elemento de informações
                const spans = targetNode.querySelectorAll(".cy-live-casino-grid-item-infobar-draws span");
                if (spans && spans.length > 0) {
                    const num = spans[0].textContent.trim();
                    if (num) return num;
                }
                
                // Método 2: Divs dentro do elemento de informações
                const divs = targetNode.querySelectorAll(".cy-live-casino-grid-item-infobar-draws div");
                if (divs && divs.length > 0) {
                    const num = divs[0].textContent.trim();
                    if (num) return num;
                }
                
                // Método 3: Extrair do texto completo usando regex
                const infoBar = targetNode.querySelector(".cy-live-casino-grid-item-infobar");
                if (infoBar) {
                    const texto = infoBar.textContent;
                    const match = texto.match(/\\b([0-9]|[1-2][0-9]|3[0-6])\\b/);
                    if (match) return match[0];
                }
                
                return null;
            };
            
            // Verificar número atual imediatamente
            lastNumber = checkCurrentNumber();
            if (lastNumber) {
                return resolve([lastNumber]);
            }
            
            // Configurar observer apenas se não encontrou número imediatamente
            const observer = new MutationObserver((mutations) => {
                const currentNumber = checkCurrentNumber();
                if (currentNumber && currentNumber !== lastNumber) {
                    lastNumber = currentNumber;
                    observer.disconnect();
                    resolve([currentNumber]);
                }
            });
            
            // 8 segundos de timeout - tempo suficiente para a atualização, sem ser muito longo
            setTimeout(() => {
                observer.disconnect();
                // Verificar uma última vez antes de desistir
                const finalCheck = checkCurrentNumber();
                if (finalCheck) {
                    resolve([finalCheck]);
                } else {
                    resolve([]);
                }
            }, 8000);
            
            // Iniciar observação com configuração ampla para capturar todas as mudanças
            observer.observe(targetNode, { 
                childList: true, 
                subtree: true,
                characterData: true,
                attributes: true
            });
        });
        """
        
        # Executar o script e obter resultado
        numeros = driver.execute_script(observer_script, elemento_roleta)
        
        # Atualizar timestamp de última atividade se encontrou números
        if numeros and len(numeros) > 0:
            ultima_atividade_scraper = time.time()
            logger.info(f"Números extraídos com MutationObserver: {numeros}")
            return numeros
            
        return []
    
    except Exception as e:
        logger.warning(f"Erro ao extrair números: {str(e)}")
        return []

def extrair_id_roleta(elemento_roleta):
    """Extrai o ID único da roleta a partir das classes do elemento"""
    try:
        classes = elemento_roleta.get_attribute("class")
        
        # Padrão 1: cy-live-casino-grid-item-123456
        match = re.search(r'cy-live-casino-grid-item-(\d+)', classes)
        if match:
            id_roleta = match.group(1)
            # Log em debug em vez de info para reduzir ruído
            logger.debug(f"ID da roleta extraído: {id_roleta}")
            return id_roleta
        
        # ID padrão usando o texto do título se não encontrar ID específico
        titulo = elemento_roleta.find_element(By.CSS_SELECTOR, ".cy-live-casino-grid-item-title").text
        id_hash = f"unknown-{hash(titulo) % 10000}"
        return id_hash
    
    except Exception as e:
        logger.warning(f"Erro ao extrair ID da roleta: {str(e)}")
        return "unknown"

def obter_ultimos_numeros(roleta_id, limite=10):
    """
    Obtém os últimos números para uma roleta específica
    """
    try:
        # Gerar o mesmo UUID determinístico baseado no ID da roleta
        roleta_id_hash = hashlib.md5(str(roleta_id).encode()).hexdigest()
        roleta_uuid = str(uuid.UUID(roleta_id_hash))
        
        # URL da API REST do Supabase
        url = f"{supabase_url}/rest/v1/roleta_numeros"
        
        # Log em debug em vez de info para reduzir ruído
        logger.debug(f"Consultando números para roleta {roleta_id}")
        
        response = supabase.table("roleta_numeros") \
            .select("numero") \
            .filter("roleta_id", "eq", roleta_uuid) \
            .order("timestamp", desc=True) \
            .limit(limite) \
            .execute()
        
        if response.data:
            # Extrair apenas os números e converter para lista
            numeros = [item['numero'] for item in response.data]
            logger.debug(f"Obtidos {len(numeros)} números para a roleta ID {roleta_id}")
            return numeros
        else:
            logger.debug(f"Nenhum número encontrado para a roleta ID {roleta_id}")
            return []
    except Exception as e:
        logger.error(f"Erro ao obter números da roleta {roleta_id}: {str(e)}")
        return []

def garantir_roleta_existe(roleta_id, roleta_nome):
    """
    Verifica se a roleta existe na tabela roletas, 
    e a insere caso não exista
    """
    try:
        # Gerar o mesmo UUID determinístico baseado no ID da roleta
        roleta_id_hash = hashlib.md5(str(roleta_id).encode()).hexdigest()
        roleta_uuid = str(uuid.UUID(roleta_id_hash))
        
        # Determinar o tipo de roleta com base no nome
        tipo_roleta = "ao_vivo"  # Valor padrão
        if "auto" in roleta_nome.lower() or "speed" in roleta_nome.lower():
            tipo_roleta = "automatica"
        elif "lightning" in roleta_nome.lower():
            tipo_roleta = "especial"
        
        # Preparar dados para inserção
        dados_roleta = {
            "id": roleta_uuid,
            "nome": roleta_nome,
            "tipo": tipo_roleta,
            "provedor": "Evolution Gaming",  # Valor padrão
            "ativa": True
        }
        
        # Inserir ou atualizar na tabela roletas diretamente, sem verificação prévia
        result = supabase.table("roletas").upsert(dados_roleta).execute()
        
        return roleta_uuid
    except Exception as e:
        logger.error(f"Erro ao verificar/inserir roleta {roleta_nome}: {str(e)}")
        return None

def inserir_numero_direto_api(roleta_id, roleta_nome, numero, timestamp):
    """
    Alternativa para inserir um novo número diretamente via API REST,
    evitando problemas potenciais com GROUP BY
    """
    try:
        # Removendo a restrição de roletas funcionando para permitir atualização de todas as roletas
        # Anteriormente, só "Auto-Roulette VIP" recebia atualizações
        
        # Validar o número
        if isinstance(numero, str):
            numero_int = int(re.sub(r'[^\d]', '', numero))
        else:
            numero_int = int(numero)
        
        if not (0 <= numero_int <= 36):
            logger.warning(f"Número inválido para inserção: {numero}")
            return False
        
        # Garantir que a roleta existe na tabela roletas
        roleta_uuid = garantir_roleta_existe(roleta_id, roleta_nome)
        if not roleta_uuid:
            logger.error(f"Não foi possível garantir a existência da roleta {roleta_nome} (ID: {roleta_id})")
            return False
        
        # Preparar dados para inserção
        data = {
            "roleta_id": roleta_uuid,
            "roleta_nome": roleta_nome,
            "numero": numero_int,
            "timestamp": timestamp
        }
        
        # Log em debug em vez de info para reduzir ruído
        logger.debug(f"Inserindo número {numero_int} para roleta {roleta_nome} (ID: {roleta_uuid})")
        
        # Inserir via HTTP direto
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        
        url = f"{supabase_url}/rest/v1/roleta_numeros"
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code >= 200 and response.status_code < 300:
            logger.info(f"NOVO NÚMERO: {numero_int} para {roleta_nome}")
            
            # Notificar clientes SSE sobre o novo número
            event_data = {
                "type": "new_number",
                "roleta_id": roleta_uuid,
                "roleta_nome": roleta_nome, 
                "numero": numero_int,
                "timestamp": timestamp
            }
            event_manager.notify_clients(event_data)
            
            # Melhorar o log para facilitar a depuração
            logger.info(f"NOVO NÚMERO INSERIDO E NOTIFICADO: {numero_int} para {roleta_nome} (ID: {roleta_uuid})")
            print(f"{datetime.now().strftime('%H:%M:%S')} - NOVO NÚMERO: {numero_int} para {roleta_nome}")
            
            return True
        else:
            logger.error(f"Erro HTTP {response.status_code} ao inserir número {numero_int}: {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Erro ao inserir número {numero} para a roleta {roleta_nome}: {str(e)}")
        return False

# Substituir a função inserir_novo_numero pela versão alternativa
inserir_novo_numero = inserir_numero_direto_api

def processar_novos_numeros(roleta_id, roleta_nome, numeros_novos):
    """
    Processa novos números detectados para uma roleta
    """
    if not numeros_novos:
        return False
    
    # Obter números existentes para verificar duplicidade
    numeros_existentes = obter_ultimos_numeros(roleta_id, limite=100)
    
    # Verificar cada número novo
    numeros_adicionados = False
    for num_str in numeros_novos:
        try:
            # Validar o número
            if isinstance(num_str, str):
                num_limpo = re.sub(r'[^\d]', '', num_str)
                if not num_limpo:
                    continue
                num = int(num_limpo)
            else:
                num = int(num_str)
            
            # Verificar duplicidade (apenas com os mais recentes para performance)
            if not numeros_existentes or num != numeros_existentes[0]:
                if inserir_novo_numero(roleta_id, roleta_nome, num, datetime.now().isoformat()):
                    numeros_adicionados = True
                    # Atualizar a lista de números existentes
                    numeros_existentes.insert(0, num)
            else:
                logger.debug(f"Número {num} já existente para a roleta {roleta_nome}")
        except Exception as e:
            logger.warning(f"Erro ao processar número {num_str}: {str(e)}")
    
    return numeros_adicionados

def atualizar_dados_estrategia(roleta_id, roleta_nome, dados_estrategia):
    """
    Atualiza os dados de estratégia para uma roleta
    """
    try:
        # Verificamos se existe uma tabela auxiliar para dados de estratégia
        # Se não existe, podemos considerar criar uma no futuro
        logger.debug(f"Dados de estratégia processados para {roleta_nome}")
        # Por enquanto, apenas retornamos True pois não estamos armazenando esses dados
        return True
    except Exception as e:
        logger.error(f"Erro ao atualizar dados de estratégia para {roleta_nome}: {str(e)}")
        return False

def scrape_roletas(driver=None):
    """Função principal que realiza o scraping das roletas"""
    global ultima_atividade_scraper
    global contagem_erros_consecutivos
    global driver_global
    
    try:
        # Inicializar driver se não fornecido
        driver_interno = driver
        if driver_interno is None:
            try:
                driver_interno = executar_com_retry(configurar_driver, max_tentativas=3, delay_inicial=5)
                driver_global = driver_interno
            except Exception as e:
                logger.error(f"Erro ao configurar driver: {str(e)}")
                return None
        
        # Navegar para o site com retry
        def navegar_para_casino():
            logger.info(f"Navegando para: {CASINO_URL}")
            driver_interno.get(CASINO_URL)
            # Aguardar carregamento da página (5-10 segundos)
            time.sleep(random.uniform(5, 10))
            return True
            
        executar_com_retry(navegar_para_casino, max_tentativas=3, delay_inicial=5)
        
        # Iniciar ciclo de scraping
        ciclo = 1
        erros_ciclo = 0
        max_erros_ciclo = 3
        tempo_ultima_verificacao_saude = time.time()
        
        while ciclo <= MAX_CICLOS or MAX_CICLOS == 0:
            try:
                # Verificar saúde do scraper a cada 5 minutos
                if time.time() - tempo_ultima_verificacao_saude > 300:  # 5 minutos
                    logger.debug("Realizando verificação de saúde do scraper...")
                    driver_interno = verificar_saude_scraper(driver_interno)
                    tempo_ultima_verificacao_saude = time.time()
                
                logger.debug(f"Iniciando ciclo {ciclo} de scraping")
                
                # Encontrar todas as roletas na página com retry
                def encontrar_roletas():
                    elementos = driver_interno.find_elements(By.CSS_SELECTOR, ".cy-live-casino-grid-item")
                    logger.debug(f"Encontradas {len(elementos)} roletas na página")
                    return elementos
                
                elementos_roletas = executar_com_retry(encontrar_roletas, max_tentativas=3, delay_inicial=2)
                
                # Lista para armazenar roletas permitidas encontradas neste ciclo
                roletas_permitidas = []
                
                # Processar cada roleta
                for elemento_roleta in elementos_roletas:
                    try:
                        # Extrair ID da roleta primeiro para filtrar rapidamente
                        id_roleta = extrair_id_roleta(elemento_roleta)
                        
                        # Verificar se a roleta está na lista de permitidas
                        if not roleta_permitida_por_id(id_roleta):
                            logger.debug(f"Roleta com ID {id_roleta} ignorada (não permitida)")
                            continue
                        
                        # Extrair título da roleta apenas para roletas permitidas
                        titulo_elemento = elemento_roleta.find_element(By.CSS_SELECTOR, ".cy-live-casino-grid-item-title")
                        titulo_roleta = titulo_elemento.text.strip()
                        
                        roletas_permitidas.append(titulo_roleta)
                        logger.info(f"PROCESSANDO: {titulo_roleta} (ID: {id_roleta})")
                        
                        # Inicializar analisador para a roleta se não existir
                        if titulo_roleta not in analisadores_mesas:
                            analisadores_mesas[titulo_roleta] = StrategyAnalyzer(titulo_roleta)
                            # Carregar números existentes no analisador
                            numeros_existentes = obter_ultimos_numeros(id_roleta)
                            if numeros_existentes:
                                analisadores_mesas[titulo_roleta].add_numbers(numeros_existentes)
                                logger.debug(f"Carregados {len(numeros_existentes)} números para {titulo_roleta}")
                        
                        # Extrair números da roleta - usando a nova função otimizada
                        numeros = extrair_numeros_js(driver_interno, elemento_roleta)
                        
                        # Processar novos números
                        if processar_novos_numeros(id_roleta, titulo_roleta, numeros):
                            logger.info(f"EXTRAÍDO: {numeros} para {titulo_roleta}")
                            # Atualizar timestamp de atividade
                            ultima_atividade_scraper = time.time()
                            contagem_erros_consecutivos = 0
                        
                        # Adicionar números ao analisador
                        if analisadores_mesas[titulo_roleta].add_numbers(numeros):
                            logger.debug(f"Números adicionados ao analisador para {titulo_roleta}")
                    
                    except Exception as e:
                        logger.error(f"Erro ao processar roleta: {str(e)}")
                        erros_ciclo += 1
                
                # Registrar as roletas permitidas encontradas neste ciclo
                if roletas_permitidas:
                    logger.debug(f"Roletas ativas: {', '.join(roletas_permitidas)}")
                else:
                    logger.warning("Nenhuma roleta permitida encontrada neste ciclo")
                    # Se não encontrou roletas em 3 ciclos consecutivos, tentar recarregar a página
                    if erros_ciclo >= max_erros_ciclo:
                        logger.warning(f"Muitos erros consecutivos. Recarregando página...")
                        executar_com_retry(navegar_para_casino, max_tentativas=3, delay_inicial=5)
                        erros_ciclo = 0
                
                # Pausa entre ciclos (entre 2 e 3 segundos)
                pausa = random.uniform(2, 3)
                time.sleep(pausa)
                
                # Incrementar ciclo apenas se MAX_CICLOS não for 0 (infinito)
                if MAX_CICLOS != 0:
                    ciclo += 1
                else:
                    # Mostrar resumo a cada 10 ciclos
                    if ciclo % 10 == 0:
                        logger.info(f"CICLO {ciclo} COMPLETO - Sistema saudável")
                    ciclo += 1
                    
                # Resetar contador de erros se o ciclo foi bem-sucedido
                erros_ciclo = 0
                
            except Exception as e:
                logger.error(f"Erro no ciclo {ciclo} de scraping: {str(e)}")
                erros_ciclo += 1
                contagem_erros_consecutivos += 1
                
                # Se muitos erros consecutivos, tentar reiniciar o driver
                if erros_ciclo >= max_erros_ciclo or contagem_erros_consecutivos >= MAX_ERROS_CONSECUTIVOS:
                    logger.warning(f"Muitos erros consecutivos. Reiniciando driver...")
                    try:
                        if driver_interno:
                            driver_interno.quit()
                        driver_interno = executar_com_retry(configurar_driver, max_tentativas=3, delay_inicial=5)
                        driver_global = driver_interno
                        executar_com_retry(navegar_para_casino, max_tentativas=3, delay_inicial=5)
                        erros_ciclo = 0
                        contagem_erros_consecutivos = 0
                    except Exception as restart_e:
                        logger.critical(f"Falha ao reiniciar driver após erros: {str(restart_e)}")
                        # Pausa mais longa antes de tentar novamente
                        time.sleep(30)
    
    except Exception as e:
        logger.error(f"Erro no processo de scraping: {str(e)}")
    
    finally:
        # Fechar o driver apenas se foi criado internamente
        if driver is None and 'driver_interno' in locals() and driver_interno:
            try:
                driver_interno.quit()
                logger.info("Driver fechado com sucesso")
            except Exception as e:
                logger.error(f"Erro ao fechar driver: {str(e)}")

# Função para simular dados quando o scraper não funcionar
def simulate_roulette_data():
    """Simula dados de roleta para testes quando o scraper não funciona"""
    logger.info("Iniciando simulação de dados de roleta para testes")
    
    # IDs e nomes de roletas comuns para simulação
    roletas_simuladas = [
        {"id": "vctlz3AoNaGCzxJi", "nome": "Auto-Roulette"},
        {"id": "LightningTable01", "nome": "Lightning Roulette"},
        {"id": "7x0b1tgh7agmf6hv", "nome": "Roulette Live"}
    ]
    
    # Gerar um evento inicial para confirmar que o simulador está funcionando
    try:
        roleta = roletas_simuladas[0]
        numero = random.randint(0, 36)
        logger.info(f"[SIMULAÇÃO] Gerando evento inicial com número {numero} para {roleta['nome']}")
        
        # Criar evento e notificar clientes
        event_data = {
            "type": "new_number",
            "roleta": roleta['nome'],
            "numero": numero,
            "timestamp": time.time(),
            "simulado": True,
            "startup": True
        }
        
        # Notificar clientes de forma mais direta
        for client_queue in event_manager.clients[:]:
            try:
                client_queue.put(event_data)
                logger.info(f"[SIMULAÇÃO] Evento inicial enviado para um cliente")
            except Exception as e:
                logger.error(f"[SIMULAÇÃO] Erro ao enviar evento inicial para cliente: {str(e)}")
        
        logger.info(f"[SIMULAÇÃO] Evento inicial enviado para {len(event_manager.clients)} clientes")
    except Exception as e:
        logger.error(f"[SIMULAÇÃO] Erro ao gerar evento inicial: {str(e)}")
    
    # Pequena pausa antes de iniciar o ciclo principal
    time.sleep(1)  # Reduzido de 5 para 1 segundo
    
    # Ciclo principal de simulação
    while True:
        try:
            # Selecionar uma roleta aleatória
            roleta = random.choice(roletas_simuladas)
            roleta_id = roleta["id"]
            roleta_nome = roleta["nome"]
            
            # Gerar número aleatório (0-36)
            numero = random.randint(0, 36)
            
            # Registrar log
            logger.info(f"[SIMULAÇÃO] Novo número: {numero} para {roleta_nome} (ID: {roleta_id})")
            
            # Inserir no Supabase
            try:
                inserir_novo_numero(roleta_id, roleta_nome, numero, datetime.now().isoformat())
                logger.info(f"[SIMULAÇÃO] Número {numero} inserido no Supabase para {roleta_nome}")
            except Exception as e:
                logger.error(f"[SIMULAÇÃO] Erro ao inserir número simulado: {str(e)}")
            
            # Notificar clientes
            event_data = {
                "type": "new_number",
                "roleta": roleta_nome,
                "numero": numero,
                "timestamp": time.time(),
                "simulado": True
            }
            
            # Verificar se há clientes conectados
            if len(event_manager.clients) > 0:
                logger.info(f"[SIMULAÇÃO] Notificando {len(event_manager.clients)} clientes sobre novo número")
                event_manager.notify_clients(event_data)
            else:
                logger.warning("[SIMULAÇÃO] Nenhum cliente conectado para receber o evento")
            
            # Intervalo ULTRA RÁPIDO (1-3 segundos)
            intervalo = random.randint(1, 3)
            logger.info(f"[SIMULAÇÃO] Aguardando {intervalo} segundos até o próximo número")
            time.sleep(intervalo)
            
        except Exception as e:
            logger.error(f"[SIMULAÇÃO] Erro ao simular dados: {str(e)}")
            time.sleep(5)  # Reduzido de 10 para 5 segundos

@app.route('/api/start-simulator', methods=['GET'])
def start_simulator():
    """Endpoint para iniciar manualmente o simulador de dados, para fins de diagnóstico"""
    try:
        # Verificar se já existe um simulador ativo
        if hasattr(sys, 'simulator_thread_running') and sys.simulator_thread_running:
            logger.info("Simulador já está ativo, gerando um novo evento de teste")
            
            # Gerar um evento de teste mesmo assim
            roleta_nome = "Lightning Roulette"
            numero = random.randint(0, 36)
            roleta_id = "LightningTable01"
            
            # Criar o evento
            event_data = {
                "type": "new_number",
                "roleta": roleta_nome,
                "numero": numero,
                "timestamp": time.time(),
                "simulado": True,
                "manual_trigger": True
            }
            
            # Notificar clientes
            if len(event_manager.clients) > 0:
                logger.info(f"[TESTE MANUAL] Notificando {len(event_manager.clients)} clientes sobre novo número")
                
                # Notificar diretamente
                for client_queue in event_manager.clients[:]:
                    try:
                        client_queue.put(event_data)
                        logger.info(f"[TESTE MANUAL] Evento enviado para um cliente")
                    except Exception as e:
                        logger.error(f"[TESTE MANUAL] Erro ao enviar evento para cliente: {str(e)}")
                
                # Também via gerenciador
                event_manager.notify_clients(event_data)
                
                return jsonify({
                    "success": True, 
                    "message": "Evento de teste enviado para o simulador existente",
                    "clients": len(event_manager.clients),
                    "data": event_data
                })
            else:
                return jsonify({
                    "success": False,
                    "message": "Simulador ativo mas não há clientes conectados",
                    "clients": 0
                })
        
        # Iniciar novo simulador se não existir
        simulator_thread = threading.Thread(target=simulate_roulette_data)
        simulator_thread.daemon = True
        simulator_thread.start()
        
        # Marcar como iniciado
        sys.simulator_thread_running = True
        logger.info("Simulador iniciado manualmente via endpoint")
        
        return jsonify({
            "success": True,
            "message": "Simulador iniciado com sucesso",
            "clients": len(event_manager.clients)
        })
    
    except Exception as e:
        logger.error(f"Erro ao iniciar simulador manualmente: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Erro: {str(e)}"
        }), 500

# Função para forçar um evento único simulado
@app.route('/api/force-event', methods=['GET'])
def force_event():
    """Endpoint para forçar a geração de um evento simulado imediatamente"""
    try:
        # Selecionar roleta e número aleatório
        roletas_simuladas = [
            {"id": "vctlz3AoNaGCzxJi", "nome": "Auto-Roulette"},
            {"id": "LightningTable01", "nome": "Lightning Roulette"},
            {"id": "7x0b1tgh7agmf6hv", "nome": "Roulette Live"}
        ]
        
        roleta = random.choice(roletas_simuladas)
        roleta_id = roleta["id"]
        roleta_nome = roleta["nome"]
        numero = random.randint(0, 36)
        
        # Criar evento
        event_data = {
            "type": "new_number",
            "roleta": roleta_nome,
            "numero": numero,
            "timestamp": time.time(),
            "simulado": True,
            "forced": True
        }
        
        # Inserir no Supabase
        try:
            inserir_novo_numero(roleta_id, roleta_nome, numero, datetime.now().isoformat())
            logger.info(f"[EVENTO FORÇADO] Número {numero} inserido no Supabase para {roleta_nome}")
        except Exception as e:
            logger.error(f"[EVENTO FORÇADO] Erro ao inserir no Supabase: {str(e)}")
        
        # Verificar clientes conectados
        if len(event_manager.clients) > 0:
            # Envio direto para garantir a entrega
            for client_queue in event_manager.clients[:]:
                try:
                    client_queue.put(event_data)
                    logger.info(f"[EVENTO FORÇADO] Enviado para um cliente")
                except Exception as e:
                    logger.error(f"[EVENTO FORÇADO] Erro ao enviar: {str(e)}")
            
            # Envio via gerenciador
            event_manager.notify_clients(event_data)
            
            return jsonify({
                "success": True,
                "message": f"Evento forçado: {numero} em {roleta_nome}",
                "clients": len(event_manager.clients),
                "data": event_data
            })
        else:
            return jsonify({
                "success": False,
                "message": "Evento gerado mas não há clientes conectados",
                "data": event_data,
                "clients": 0
            })
    
    except Exception as e:
        logger.error(f"Erro ao forçar evento: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Erro: {str(e)}"
        }), 500

@app.route('/api/status', methods=['GET'])
def get_status():
    """Endpoint para verificar o status do simulador e do sistema SSE"""
    try:
        status = {
            "timestamp": datetime.now().isoformat(),
            "simulator_running": hasattr(sys, 'simulator_thread_running') and sys.simulator_thread_running,
            "scraper_running": hasattr(sys, 'scraper_thread_running') and sys.scraper_thread_running,
            "clients_connected": len(event_manager.clients),
            "environment": {
                "production": IS_PRODUCTION,
                "simulate_data": os.environ.get('SIMULATE_DATA') == 'true',
                "disable_scraper": os.environ.get('DISABLE_SCRAPER') == 'true',
            },
            "queue_size": event_manager.event_queue.qsize() if hasattr(event_manager.event_queue, 'qsize') else -1
        }
        
        return jsonify(status)
    except Exception as e:
        logger.error(f"Erro ao obter status: {str(e)}")
        return jsonify({
            "error": str(e)
        }), 500

# Função para verificar a saúde do scraper e reiniciar se necessário
def verificar_saude_scraper(driver):
    """Verifica se o scraper está saudável e o reinicia se necessário"""
    global ultima_atividade_scraper
    global contagem_erros_consecutivos
    global driver_global
    
    try:
        # Se não houve atividade nos últimos 15 minutos (900 segundos), reiniciar driver
        if time.time() - ultima_atividade_scraper > 900:
            logger.warning("Sem atividade do scraper por 15 minutos. Reiniciando driver...")
            try:
                if driver:
                    driver.quit()
                driver_global = configurar_driver()
                driver_global.get(CASINO_URL)
                ultima_atividade_scraper = time.time()
                contagem_erros_consecutivos = 0
                logger.info("Driver reiniciado com sucesso após inatividade")
                return driver_global
            except Exception as e:
                logger.error(f"Falha ao reiniciar driver após inatividade: {str(e)}")
                contagem_erros_consecutivos += 1
                
        return driver
    except Exception as e:
        logger.error(f"Erro ao verificar saúde do scraper: {str(e)}")
        contagem_erros_consecutivos += 1
        return driver

# Função de execução com retry e backoff exponencial
def executar_com_retry(func, max_tentativas=3, delay_inicial=5, args=None, kwargs=None):
    """Executa uma função com retry e backoff exponencial"""
    if args is None:
        args = []
    if kwargs is None:
        kwargs = {}
        
    ultima_excecao = None
    for tentativa in range(1, max_tentativas + 1):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            ultima_excecao = e
            delay = delay_inicial * (2 ** (tentativa - 1))  # Backoff exponencial
            logger.warning(f"Tentativa {tentativa} falhou: {str(e)}. Tentando novamente em {delay}s")
            time.sleep(delay)
    
    # Se todas as tentativas falharem
    logger.error(f"Todas as {max_tentativas} tentativas falharam: {str(ultima_excecao)}")
    raise ultima_excecao

def main():
    """Função principal"""
    global driver_global
    
    try:
        # Verificar se a tabela roleta_numeros existe
        try:
            supabase.table("roleta_numeros").select("count").limit(1).execute()
            logger.info("Tabela roleta_numeros verificada com sucesso")
        except Exception as e:
            logger.error(f"Erro ao verificar tabela roleta_numeros: {str(e)}")
            logger.warning("A tabela pode não existir ou há um problema de conexão")
        
        # Se estivermos em produção e a simulação estiver ativada
        if IS_PRODUCTION and os.environ.get('SIMULATE_DATA') == 'true':
            logger.info("Modo de simulação de dados ativado")
            simulate_roulette_data()
            return
        
        # Se estivermos em produção e em ambiente cloud como o Render, 
        # pode ser necessário desabilitar o scraping com Selenium
        if IS_PRODUCTION and os.environ.get('DISABLE_SCRAPER') == 'true':
            logger.warning("Scraper desabilitado em ambiente de produção por configuração")
            return
        
        # Iniciar thread de monitoramento do scraper
        def monitor_scraper_health():
            """Thread para monitorar a saúde do scraper e reiniciá-lo se necessário"""
            global ultima_atividade_scraper
            
            logger.info("Iniciando thread de monitoramento do scraper")
            
            while True:
                try:
                    # Verificar se o scraper está inativo por muito tempo
                    if time.time() - ultima_atividade_scraper > 1800:  # 30 minutos
                        logger.warning("Scraper inativo por 30 minutos. Tentando reiniciar...")
                        
                        # Tentar reiniciar o driver global
                        if driver_global:
                            try:
                                driver_global.quit()
                            except:
                                pass
                        
                        # Iniciar um novo processo de scraping
                        scraper_thread = threading.Thread(target=scrape_roletas)
                        scraper_thread.daemon = True
                        scraper_thread.start()
                        logger.info("Novo thread de scraping iniciado após inatividade")
                        
                        # Atualizar timestamp para evitar múltiplas reinicializações
                        ultima_atividade_scraper = time.time()
                    
                    # Verificar a cada 5 minutos
                    time.sleep(300)
                    
                except Exception as e:
                    logger.error(f"Erro no thread de monitoramento: {str(e)}")
                    time.sleep(60)  # Pausa curta antes de tentar novamente
        
        # Iniciar o thread de monitoramento
        monitor_thread = threading.Thread(target=monitor_scraper_health)
        monitor_thread.daemon = True
        monitor_thread.start()
        logger.info("Thread de monitoramento iniciado")
            
        # Iniciar o scraping
        scrape_roletas()
        
    except Exception as e:
        logger.error(f"Erro na função principal: {str(e)}")

if __name__ == "__main__":
    # Marcar a thread do scraper como iniciada
    sys.scraper_thread_running = False
    sys.simulator_thread_running = False
    
    # Forçar simulação se estiver configurada
    simulate_data = os.environ.get('SIMULATE_DATA') == 'true'
    disable_scraper = os.environ.get('DISABLE_SCRAPER') == 'true'
    is_dev = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"Configuração: SIMULATE_DATA={simulate_data}, DISABLE_SCRAPER={disable_scraper}, DEV={is_dev}")
    
    # Iniciar o simulador em thread separado se estiver configurado
    if simulate_data and not is_dev:
        logger.info("Iniciando simulador de dados em thread separada (SIMULATE_DATA=true)")
        try:
            # Iniciar o simulador diretamente
            simulator_thread = threading.Thread(target=simulate_roulette_data)
            simulator_thread.daemon = True
            simulator_thread.start()
            sys.simulator_thread_running = True
            logger.info("Thread do simulador iniciada com sucesso")
        except Exception as e:
            logger.error(f"Erro ao iniciar simulador: {str(e)}")
    
    # Iniciar o scraper se não estiver desabilitado e não estiver em modo de simulação
    if not disable_scraper and not simulate_data and not is_dev:
        logger.info("Iniciando scraper em thread separada")
        try:
            scraper_thread = threading.Thread(target=main)
            scraper_thread.daemon = True
            scraper_thread.start()
            sys.scraper_thread_running = True
            logger.info("Thread do scraper iniciada com sucesso")
        except Exception as e:
            logger.error(f"Erro ao iniciar scraper: {str(e)}")
    
    # Inicializar um simulador de backup (10s) caso nenhum outro método tenha sido iniciado
    if not sys.simulator_thread_running and not sys.scraper_thread_running:
        logger.info("Iniciando simulador de backup após 10 segundos")
        
        def start_delayed_simulator():
            logger.info("Aguardando 10 segundos para iniciar simulador de backup...")
            time.sleep(10)
            logger.info("Iniciando simulador de backup")
            sys.simulator_thread_running = True
            simulate_roulette_data()
        
        backup_thread = threading.Thread(target=start_delayed_simulator)
        backup_thread.daemon = True
        backup_thread.start()
    
    # Iniciar o servidor Flask
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Iniciando servidor Flask na porta {port}")
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
