#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Scraper roletas MongoDB - Versão Minimalista
"""

import time
import random
import re
import os
import logging
import hashlib
from datetime import datetime
import threading
import queue
import sys

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager

from config import CASINO_URL, roleta_permitida_por_id, MAX_CICLOS, MAX_ERROS_CONSECUTIVOS
from event_manager import event_manager

# Importar funções para processar estratégias
try:
    from run_real_scraper import generate_display_suggestion, process_new_number
except ImportError:
    # Fallback simples caso o módulo não esteja disponível
    def generate_display_suggestion(estado, terminais):
        if estado == "NEUTRAL":
            return "AGUARDANDO GATILHO"
        elif estado == "TRIGGER" and terminais:
            return f"APOSTAR EM: {','.join(map(str, terminais))}"
        elif estado == "POST_GALE_NEUTRAL" and terminais:
            return f"GALE EM: {','.join(map(str, terminais))}"
        elif estado == "MORTO":
            return "AGUARDANDO PRÓXIMO CICLO"
        return ""

# Configurar logging minimalista - apenas erros críticos
logging.basicConfig(level=logging.CRITICAL)
logger = logging.getLogger('runcash')
logger.setLevel(logging.CRITICAL)

# Remover todos os handlers existentes
for handler in logger.handlers[:]:
    logger.removeHandler(handler)

# Variáveis de controle
ultima_atividade = time.time()
erros_consecutivos = 0
driver_global = None

# Ambiente
IS_PRODUCTION = os.environ.get('PRODUCTION', False)

# Variáveis de controle para evitar duplicações
ultimo_numero_por_roleta = {}
ultimo_timestamp_por_roleta = {}
# Dicionário para armazenar a assinatura visual única de cada atualização de roleta
assinaturas_roletas = {}
# Histórico de números por roleta para deduplicação rigorosa
historico_numeros_por_roleta = {}  # {id_roleta: [(numero, timestamp), ...]}
max_historico_por_roleta = 24      # Quantidade de números a manter no histórico
# Histórico da sequência completa de números por roleta
sequencias_por_roleta = {}  # {id_roleta: [num1, num2, num3, num4, num5]}

# Variáveis de controle adicionais para o scraping
roletas_verificadas = {}  # Timestamp da última verificação para cada roleta
roletas_com_ruido = {}    # Contador de ruído para cada roleta
limite_ignorar_roleta = 5  # Após quantos erros consecutivos ignoramos uma roleta por um tempo

# Intervalo mínimo para verificar a mesma roleta novamente (em segundos)
# Agora usaremos um sistema adaptativo que ajusta o intervalo com base na atividade
intervalo_base_verificacao = 5  # Intervalo base inicial
# Dicionário para armazenar intervalos adaptativos por roleta
intervalos_adaptativos = {}  # {id_roleta: intervalo_atual}
# Fator de ajuste para aumentar/diminuir o intervalo
fator_ajuste_intervalo = 1.5
# Intervalo mínimo e máximo
intervalo_min_absoluto = 3
intervalo_max_verificacao = 30
# Período em que consideramos uma roleta "ativa" após um novo número (em segundos)
periodo_roleta_ativa = 45
# Timestamps da última vez que cada roleta teve um novo número
ultima_atividade_roleta = {}  # {id_roleta: timestamp}
# Período de "castigo" para roletas com muito ruído (em segundos)
periodo_castigo_roleta = 120

def cfg_driver():
    """Driver minimalista"""
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1920,1080")
    
    # Método rápido
    try:
        service = Service(ChromeDriverManager().install())
        return webdriver.Chrome(service=service, options=opts)
    except:
        try:
            return webdriver.Chrome(options=opts)
        except Exception as e:
            print(f"Erro: {str(e)}")
            raise

def ext_numeros(driver, elemento):
    """Extrai números com abordagem adaptada à estrutura real das divs de roleta"""
    global ultima_atividade
    
    try:
        # Esperar um pouco antes de tentar extrair números para garantir que a página carregou
        time.sleep(0.5)
        
        script = """
        return new Promise((resolve) => {
            const targetNode = arguments[0];
            
            // Função simples para extrair número de qualquer elemento
            const extractNumberFromElement = (elem) => {
                if (!elem) return null;
                const text = elem.textContent.trim();
                if (/^\\d+$/.test(text) && parseInt(text) >= 0 && parseInt(text) <= 36) {
                    return parseInt(text);
                }
                return null;
            };
            
            // Tentar múltiplos seletores conhecidos para encontrar números
            const findNumberElements = () => {
                // Tentativa 1: Seletores específicos conhecidos
                let elements = targetNode.querySelectorAll(".sc-bCYfCC.diKCfb, .sc-bCYfCC.fXLilg");
                
                // Tentativa 2: Se não encontrou, tentar outros seletores comuns para números
                if (!elements || elements.length === 0) {
                    elements = targetNode.querySelectorAll("[class*='number'], [class*='roulette-num'], [class*='num-'], [class*='ball'], div[class*='recent']");
                }
                
                // Tentativa 3: Buscar quaisquer divs com números de 0-36
                if (!elements || elements.length === 0) {
                    const allDivs = targetNode.querySelectorAll("div");
                    elements = Array.from(allDivs).filter(div => {
                        const text = div.textContent.trim();
                        return /^\\d+$/.test(text) && parseInt(text) >= 0 && parseInt(text) <= 36;
                    });
                }
                
                return elements;
            };
            
            // Buscar números várias vezes para garantir dados estáveis
            const tryExtractNumber = () => {
                const elements = findNumberElements();
                
                if (elements && elements.length > 0) {
                    // Extrair o primeiro número (o mais recente)
                    const firstNumber = extractNumberFromElement(elements[0]);
                    
                    // Extrair a sequência completa de números
                    const sequence = [];
                    for (let i = 0; i < Math.min(elements.length, 5); i++) {
                        const num = extractNumberFromElement(elements[i]);
                        if (num !== null) sequence.push(num);
                    }
                    
                    return { number: firstNumber, sequence };
                }
                
                return { number: null, sequence: [] };
            };
            
            // Tentar algumas vezes para garantir estabilidade
            let attempts = 0;
            const maxAttempts = 3;
            const checkInterval = setInterval(() => {
                attempts++;
                const result = tryExtractNumber();
                
                if (result.number !== null) {
                    clearInterval(checkInterval);
                    resolve(result);
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    resolve({ number: null, sequence: [] });
                }
            }, 500);
        });
        """
        
        result = driver.execute_script(script, elemento)
        if result and result.get('number') is not None:
            ultima_atividade = time.time()
            return result.get('number'), result.get('sequence')
        return None, []
    
    except Exception as e:
        # Logar exceção para debug
        print(f"Erro ao extrair números: {str(e)}")
        return None, []

def ext_id(elemento):
    """ID minimalista"""
    try:
        classes = elemento.get_attribute("class")
        
        match = re.search(r'cy-live-casino-grid-item-(\d+)', classes)
        if match:
            return match.group(1)
        
        try:
            titulo = elemento.find_element(By.CSS_SELECTOR, ".cy-live-casino-grid-item-title").text
            return hashlib.md5(titulo.encode()).hexdigest()[:8]
        except:
            pass
            
        html = elemento.get_attribute("outerHTML")
        return hashlib.md5(html.encode()).hexdigest()[:10]
    
    except:
        return "unknown"

def cor_numero(num):
    """Cor do número"""
    if num == 0:
        return 'verde'
    
    vermelhos = {1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36}
    return 'vermelho' if num in vermelhos else 'preto'

def novo_numero(db, id_roleta, roleta_nome, numero, numero_hook=None):
    """Minimalista para novo número"""
    try:
        if isinstance(numero, str):
            num_int = int(re.sub(r'[^\d]', '', numero))
        else:
            num_int = int(numero)
        
        if not (0 <= num_int <= 36):
            return False
        
        cor = cor_numero(num_int)
        ts = datetime.now().isoformat()
        
        db.garantir_roleta_existe(id_roleta, roleta_nome)
        db.inserir_numero(id_roleta, roleta_nome, num_int, cor, ts)
        
        # Saída com nome completo e cor por extenso
        print(f"{roleta_nome}:{num_int}:{cor}")
        
        event_data = {
            "type": "new_number",
            "roleta_id": id_roleta,
            "roleta_nome": roleta_nome, 
            "numero": num_int,
            "timestamp": ts
        }
        event_manager.notify_clients(event_data, silent=True)
        
        # Chamar o hook personalizado se fornecido
        if numero_hook:
            try:
                numero_hook(id_roleta, roleta_nome, num_int)
            except Exception as e:
                print(f"[DEBUG] Erro ao executar hook personalizado: {str(e)}")
        
        # NOVO: Processar o número com o StrategyAnalyzer
        try:
            # Importamos o módulo apenas quando necessário para evitar dependência cíclica
            from run_real_scraper import process_new_number
            
            # Processar o número com o analisador de estratégia
            print(f"[DEBUG] Processando número {num_int} com o analisador de estratégia para {roleta_nome}")
            status = process_new_number(db, id_roleta, roleta_nome, num_int)
            
            if status:
                print(f"[DEBUG] Resultado da estratégia: {status['estado']}")
                print(f"[DEBUG] Terminais: {status['terminais_gatilho'][:3] if status['terminais_gatilho'] else []}")
                print(f"[DEBUG] Vitórias/Derrotas: {status['vitorias']}/{status['derrotas']}")
                
                # Notificar clientes sobre a atualização da estratégia
                strategy_event = {
                    "type": "strategy_update",
                    "roleta_id": id_roleta,
                    "roleta_nome": roleta_nome,
                    "estado": status["estado"],
                    "numero_gatilho": status["numero_gatilho"],
                    "terminais_gatilho": status["terminais_gatilho"][:3] if status["terminais_gatilho"] else [],
                    "vitorias": status["vitorias"],
                    "derrotas": status["derrotas"],
                    "sugestao_display": status.get("sugestao_display", "") or generate_display_suggestion(status["estado"], status["terminais_gatilho"])
                }
                print(f"[DEBUG] Enviando evento de estratégia: {strategy_event}")
                
                # Tentar varias vezes em caso de falha
                max_attempts = 3
                for attempt in range(max_attempts):
                    try:
                        event_manager.notify_clients(strategy_event, silent=True)
                        print(f"[DEBUG] Evento de estratégia enviado com sucesso (tentativa {attempt+1})")
                        break
                    except Exception as notify_error:
                        print(f"[DEBUG] Erro ao notificar clientes (tentativa {attempt+1}): {str(notify_error)}")
                        if attempt == max_attempts - 1:
                            print(f"[ERROR] Falha ao enviar evento de estratégia após {max_attempts} tentativas")
                        else:
                            time.sleep(0.5)  # Pequena pausa antes de tentar novamente
            else:
                print(f"[DEBUG] Nenhum status de estratégia retornado para {roleta_nome}")
        except ImportError as ie:
            print(f"[DEBUG] Erro ao importar módulo de análise: {str(ie)}")
        except Exception as e:
            print(f"[DEBUG] Erro ao processar número com analisador de estratégia: {str(e)}")
            import traceback
            traceback.print_exc()
            
            # Tentar fazer um fallback muito simples para garantir que ALGUMA estratégia seja enviada
            try:
                fallback_event = {
                    "type": "strategy_update",
                    "roleta_id": id_roleta,
                    "roleta_nome": roleta_nome,
                    "estado": "NEUTRAL",
                    "numero_gatilho": num_int,
                    "terminais_gatilho": [num_int % 10],
                    "vitorias": 0,
                    "derrotas": 0,
                    "sugestao_display": "AGUARDANDO GATILHO"
                }
                print(f"[DEBUG] Tentando enviar evento de fallback: {fallback_event}")
                event_manager.notify_clients(fallback_event, silent=True)
            except Exception as fallback_error:
                print(f"[DEBUG] Erro ao enviar evento de fallback: {str(fallback_error)}")
        
        return True
    except:
        return False

def processar_numeros(db, id_roleta, roleta_nome, numeros_novos, numero_hook=None):
    """Processamento de números com controle rigoroso de duplicações usando comparação de sequências"""
    global ultimo_numero_por_roleta, ultimo_timestamp_por_roleta, assinaturas_roletas, historico_numeros_por_roleta, sequencias_por_roleta
    global ultima_atividade_roleta, intervalos_adaptativos
    
    if not numeros_novos or len(numeros_novos) == 0:
        return False
    
    # Obter os últimos números do banco de dados
    existentes = []
    try:
        if hasattr(db, 'obter_numeros_recentes'):
            nums = db.obter_numeros_recentes(id_roleta, limite=10)
            existentes = [n.get('numero') for n in nums]
    except Exception as e:
        print(f"Erro ao obter números recentes: {str(e)}")
    
    # Tempo mínimo entre atualizações da mesma roleta (em segundos)
    # Usado apenas como medida de segurança, não como critério principal
    min_tempo_entre_atualizacoes = 5
    tempo_atual = time.time()
    
    # Inicializar o histórico para esta roleta se ainda não existir
    if id_roleta not in historico_numeros_por_roleta:
        historico_numeros_por_roleta[id_roleta] = []
    
    # Inicializar a sequência para esta roleta se ainda não existir
    if id_roleta not in sequencias_por_roleta:
        sequencias_por_roleta[id_roleta] = []
    
    ok = False
    for num_str in numeros_novos:
        try:
            # Verificação para caso num_str seja uma lista
            if isinstance(num_str, list):
                # Se for uma lista, pegamos o primeiro elemento se existir
                if num_str and len(num_str) > 0:
                    num_str = num_str[0]
                else:
                    print(f"Ignorando número inválido (lista vazia) para roleta {roleta_nome}")
                    continue
            
            if isinstance(num_str, str):
                n = int(re.sub(r'[^\d]', '', num_str))
            else:
                n = int(num_str)
            
            # Verificar se o número está no intervalo válido
            if not 0 <= n <= 36:
                print(f"Ignorando número inválido: {n}")
                continue
            
            # VERIFICAÇÃO 1: Criar uma assinatura para esta detecção
            # Combinação de roleta + número + timestamp arredondado para intervalos de 3 segundos
            timestamp_arredondado = int(tempo_atual / 3) * 3
            assinatura_atual = f"{id_roleta}_{n}_{timestamp_arredondado}"
            
            # Se já vimos esta assinatura muito recentemente, ignorar
            if assinatura_atual in assinaturas_roletas:
                ultimo_uso = assinaturas_roletas[assinatura_atual]
                if tempo_atual - ultimo_uso < min_tempo_entre_atualizacoes:
                    print(f"[DUPLICADO-ASSINATURA] Ignorando assinatura duplicada para {roleta_nome}: {n} (já vista há {tempo_atual - ultimo_uso:.1f}s)")
                    continue
            
            # VERIFICAÇÃO 2: Verificar se é o mesmo número que o último registrado para esta roleta
            ultimo_numero = ultimo_numero_por_roleta.get(id_roleta)
            ultimo_timestamp = ultimo_timestamp_por_roleta.get(id_roleta, 0)
            
            # Se for o mesmo número E tiver passado muito pouco tempo, ignorar
            # (isso é apenas uma salvaguarda contra duplicações extremamente rápidas)
            if (ultimo_numero == n and 
                (tempo_atual - ultimo_timestamp) < min_tempo_entre_atualizacoes):
                print(f"[DUPLICADO-ULTIMO] Ignorando número repetido {n} para {roleta_nome} (extremamente recente: {tempo_atual - ultimo_timestamp:.1f}s)")
                continue
            
            # VERIFICAÇÃO 3: Verificar a sequência atual de números da roleta
            sequencia_atual = sequencias_por_roleta.get(id_roleta, [])
            
            # Se há uma sequência anterior E este número já está no topo da sequência, é duplicado
            if sequencia_atual and n == sequencia_atual[0]:
                print(f"[DUPLICADO-SEQUENCIA] Ignorando número {n} para {roleta_nome} (já está no topo da sequência atual)")
                continue
            
            # VERIFICAÇÃO 4: Se for o mesmo número que o último do banco de dados, requer mais cuidado
            if existentes and n == existentes[0]:
                # Verificar se esse mesmo número foi extraído muito recentemente
                if (tempo_atual - ultimo_timestamp) < min_tempo_entre_atualizacoes:
                    print(f"[DUPLICADO-DB] Ignorando número duplicado {n} para {roleta_nome} (já existe no DB, muito recente)")
                    continue
                # Se passou tempo suficiente, pode ser um sorteio legítimo do mesmo número
                print(f"[REPETIDO-VÁLIDO] Aceitando número repetido {n} para {roleta_nome} (tempo suficiente: {tempo_atual - ultimo_timestamp:.1f}s)")
            
            # VERIFICAÇÃO FINAL: Verificar os números mais recentes no BD para esta roleta
            if existentes and n in existentes[:3] and tempo_atual - ultimo_timestamp < 10:
                # É muito improvável que o mesmo número apareça entre os últimos 3 em menos de 10 segundos
                print(f"[DUPLICADO-RECENTE] Ignorando número {n} para {roleta_nome} (já está entre os 3 últimos no DB em menos de 10s)")
                continue
            
            # Se chegou até aqui, o número é considerado novo
            if novo_numero(db, id_roleta, roleta_nome, n, numero_hook):
                print(f"[ACEITO] Número {n} para {roleta_nome} aceito como novo")
                
                # Atualizar o cache local
                ultimo_numero_por_roleta[id_roleta] = n
                ultimo_timestamp_por_roleta[id_roleta] = tempo_atual
                # Registrar a assinatura desta atualização
                assinaturas_roletas[assinatura_atual] = tempo_atual
                
                # Adicionar ao histórico de números
                historico_numeros_por_roleta[id_roleta].append((n, tempo_atual))
                # Manter apenas os últimos números no histórico
                if len(historico_numeros_por_roleta[id_roleta]) > max_historico_por_roleta:
                    historico_numeros_por_roleta[id_roleta] = historico_numeros_por_roleta[id_roleta][-max_historico_por_roleta:]
                
                # Atualizar a sequência da roleta (colocar o novo número no topo)
                sequencias_por_roleta[id_roleta] = [n] + sequencia_atual
                # Manter apenas os últimos 5 números na sequência
                if len(sequencias_por_roleta[id_roleta]) > 5:
                    sequencias_por_roleta[id_roleta] = sequencias_por_roleta[id_roleta][:5]
                
                # Limitar o tamanho do dicionário de assinaturas (evitar vazamento de memória)
                if len(assinaturas_roletas) > 1000:
                    # Remover as assinaturas mais antigas
                    assinaturas_antigas = sorted(
                        assinaturas_roletas.items(),
                        key=lambda x: x[1]
                    )[:500]  # Manter apenas as 500 mais recentes
                    for assinatura, _ in assinaturas_antigas:
                        if assinatura in assinaturas_roletas:
                            del assinaturas_roletas[assinatura]
                
                # NOVO: Atualizar o sistema adaptativo quando um novo número é aceito
                ultima_atividade_roleta[id_roleta] = tempo_atual
                # Reduzir o intervalo para esta roleta, pois está ativa
                if id_roleta in intervalos_adaptativos:
                    intervalos_adaptativos[id_roleta] = max(
                        intervalo_min_absoluto,
                        intervalos_adaptativos[id_roleta] / fator_ajuste_intervalo
                    )
                else:
                    intervalos_adaptativos[id_roleta] = intervalo_min_absoluto
                
                ok = True
            
        except Exception as e:
            print(f"Erro ao processar número para {roleta_nome}: {str(e)}")
    
    return ok

def check_saude(driver):
    """Check mínimo"""
    global ultima_atividade, erros_consecutivos, driver_global
    
    if time.time() - ultima_atividade > 900:
        try:
            if driver:
                driver.quit()
            driver_global = cfg_driver()
            driver_global.get(CASINO_URL)
            ultima_atividade = time.time()
            erros_consecutivos = 0
            return driver_global
        except:
            erros_consecutivos += 1
    return driver

def retry(func, max_tries=3, delay=5, args=None, kwargs=None):
    """Retry minimalista"""
    if args is None: args = []
    if kwargs is None: kwargs = {}
    
    for t in range(max_tries):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            if t == max_tries - 1:
                raise e
            time.sleep(delay * (2 ** t))

def monitor_roleta_thread(drv, db, id_roleta, titulo, elem, numero_hook):
    """
    Função executada em uma thread separada para monitorar uma roleta específica.
    Verifica continuamente por novos números e os processa quando encontrados.
    """
    global ultima_atividade, roletas_com_ruido, ultima_atividade_roleta
    global intervalos_adaptativos
    
    try:
        # Inicializar intervalo adaptativo para esta roleta
        intervalo_atual = intervalos_adaptativos.get(id_roleta, intervalo_min_absoluto)
        
        # Loop de monitoramento contínuo
        while True:
            try:
                tempo_atual = time.time()
                
                # Extrair números
                numero, sequencia = ext_numeros(drv, elem)
                
                # Se não encontrou números, isso pode ser ruído
                if numero is None:
                    # Incrementar contador de ruído
                    if id_roleta not in roletas_com_ruido:
                        roletas_com_ruido[id_roleta] = {'contador': 1, 'ultimo_erro': tempo_atual, 'nome': titulo}
                    else:
                        roletas_com_ruido[id_roleta]['contador'] += 1
                        roletas_com_ruido[id_roleta]['ultimo_erro'] = tempo_atual
                    
                    if roletas_com_ruido[id_roleta]['contador'] >= limite_ignorar_roleta:
                        print(f"[THREAD] Roleta {titulo} ({id_roleta[:5]}) marcada como ruidosa (contador: {roletas_com_ruido[id_roleta]['contador']})")
                    time.sleep(intervalo_atual)
                    continue
                
                # Se encontrou números, reduzir o contador de ruído (se existir)
                if id_roleta in roletas_com_ruido and roletas_com_ruido[id_roleta]['contador'] > 0:
                    roletas_com_ruido[id_roleta]['contador'] = max(0, roletas_com_ruido[id_roleta]['contador'] - 1)
                    if roletas_com_ruido[id_roleta]['contador'] == 0:
                        print(f"[THREAD] Roleta {titulo} ({id_roleta[:5]}) não é mais considerada ruidosa")
                
                # Processar os números encontrados
                sucesso = processar_numeros(db, id_roleta, titulo, [numero], numero_hook)
                
                # Atualizar timestamp de atividade apenas se processou números
                if sucesso:
                    ultima_atividade = tempo_atual
                    ultima_atividade_roleta[id_roleta] = tempo_atual
                    # Reduzir o intervalo para esta roleta, pois está ativa
                    intervalo_atual = max(
                        intervalo_min_absoluto * 0.5,  # Permitir intervalos ainda menores para threads
                        intervalo_atual * 0.8
                    )
                else:
                    # Aumentar gradualmente o intervalo se não estiver encontrando números
                    intervalo_atual = min(
                        intervalo_max_verificacao,
                        intervalo_atual * 1.05
                    )
                
                # Atualizar o intervalo adaptativo global
                intervalos_adaptativos[id_roleta] = intervalo_atual
                
                # Pausa adaptativa entre verificações
                time.sleep(intervalo_atual)
                
            except Exception as e:
                print(f"[THREAD] Erro ao processar roleta {titulo} ({id_roleta[:5]}): {str(e)}")
                time.sleep(intervalo_atual)
    
    except Exception as e:
        print(f"[THREAD] Erro fatal na thread de monitoramento para {titulo} ({id_roleta[:5]}): {str(e)}")

def scrape_roletas_sequencial(db, driver=None, numero_hook=None):
    """
    Implementação sequencial do scraping (sem threads).
    """
    global ultima_atividade, erros_consecutivos, driver_global
    
    try:
        drv = driver
        if drv is None:
            drv = retry(cfg_driver)
            driver_global = drv
        
        def navegar():
            drv.get(CASINO_URL)
            # Tempo para garantir carregamento completo
            time.sleep(8)
            return True
            
        retry(navegar)
        
        ciclo = 1
        erros = 0
        max_erros = 3
        ultimo_check = time.time()
        
        # IDs das roletas monitoradas
        ids = os.environ.get('ALLOWED_ROULETTES', '').split(',')
        if ids and ids[0].strip():
            print(f"Monitorando sequencial: {','.join([i[:5] for i in ids if i.strip()])}")
        
        print("[SEQUENCIAL] Iniciando monitoramento sequencial de roletas.")
        
        while ciclo <= MAX_CICLOS or MAX_CICLOS == 0:
            try:
                # Verificar saúde do driver periodicamente
                if time.time() - ultimo_check > 300:
                    drv = check_saude(drv)
                    ultimo_check = time.time()
                
                def find_elements():
                    return drv.find_elements(By.CSS_SELECTOR, ".cy-live-casino-grid-item")
                
                # Buscar todas as roletas na página
                elementos = retry(find_elements)
                tempo_atual = time.time()
                
                # Para cada elemento de roleta encontrado, processar sequencialmente
                for elem in elementos:
                    try:
                        id_roleta = ext_id(elem)
                        
                        # Verificar se a roleta está permitida
                        if not roleta_permitida_por_id(id_roleta):
                            continue
                        
                        # Extrair o nome da roleta
                        titulo = elem.find_element(By.CSS_SELECTOR, ".cy-live-casino-grid-item-title").text.strip()
                        
                        # Extrair números
                        numero, sequencia = ext_numeros(drv, elem)
                        
                        # Se encontrou um número, processá-lo
                        if numero is not None:
                            # Processar o número encontrado
                            processar_numeros(db, id_roleta, titulo, [numero], numero_hook)
                        
                    except Exception as e:
                        print(f"[SEQUENCIAL] Erro ao processar roleta: {str(e)}")
                
                # Ajustar o intervalo entre ciclos
                time.sleep(5)
                ciclo += 1
                erros = 0
                
            except Exception as e:
                print(f"[SEQUENCIAL] Erro no ciclo de scraping: {str(e)}")
                erros += 1
                erros_consecutivos += 1
                
                if erros >= max_erros or erros_consecutivos >= MAX_ERROS_CONSECUTIVOS:
                    try:
                        print(f"[SEQUENCIAL] Reiniciando driver após {erros_consecutivos} erros consecutivos")
                        if drv:
                            drv.quit()
                        drv = retry(cfg_driver)
                        driver_global = drv
                        retry(navegar)
                        erros = 0
                        erros_consecutivos = 0
                    except Exception as e:
                        print(f"[SEQUENCIAL] Erro ao reiniciar driver: {str(e)}")
                        time.sleep(30)
    
    except Exception as e:
        print(f"[SEQUENCIAL] Erro fatal no scraping: {str(e)}")
    
    finally:
        if driver is None and 'drv' in locals() and drv:
            try:
                drv.quit()
            except:
                pass

def scrape_roletas(db, driver=None, numero_hook=None):
    """
    Wrapper para a implementação não-paralela de scraping.
    """
    # Usar a versão não-paralela em vez da versão com threads
    return scrape_roletas_sequencial(db, driver, numero_hook)

def simulate_roulette_data(db):
    """Simulador minimalista"""
    roletas = [
        {"id": "vctlz3AoNaGCzxJi", "nome": "Auto-Roulette"},
        {"id": "LightningTable01", "nome": "Lightning Roulette"},
        {"id": "7x0b1tgh7agmf6hv", "nome": "Roulette Live"}
    ]
    
    print(f"Simulando: {','.join([r['nome'] for r in roletas])}")
    
    while True:
        try:
            roleta = random.choice(roletas)
            rid = roleta["id"]
            nome = roleta["nome"]
            
            num = random.randint(0, 36)
            cor = cor_numero(num)
            
            # Saída com nome completo e cor por extenso
            print(f"{nome}:{num}:{cor}")
            
            db.garantir_roleta_existe(rid, nome)
            ts = datetime.now().isoformat()
            db.inserir_numero(rid, nome, num, cor, ts)
            
            event_data = {
                "type": "new_number",
                "roleta_id": rid,
                "roleta_nome": nome,
                "numero": num,
                "timestamp": ts,
                "simulado": True
            }
            event_manager.notify_clients(event_data, silent=True)
            
            time.sleep(random.randint(1, 3))
            
        except:
            time.sleep(5)

# Patch minimalista
if hasattr(event_manager, 'notify_clients') and 'silent' not in event_manager.notify_clients.__code__.co_varnames:
    def notify_clients_patched(event_data, silent=True):
        event_manager.event_queue.put(event_data)
        for client_queue in event_manager.clients[:]:
            try:
                client_queue.put(event_data)
            except:
                event_manager.unregister_client(client_queue)
    
    event_manager.notify_clients = notify_clients_patched

# Exports
__all__ = ['scrape_roletas', 'simulate_roulette_data', 'check_saude', 'cfg_driver'] 