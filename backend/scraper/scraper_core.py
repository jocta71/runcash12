#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Módulo principal do scraper de roletas
"""

import time
import random
import re
import hashlib
import uuid
import logging
import os
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager

# Importações locais
from config import CASINO_URL, roleta_permitida_por_id, logger, MAX_CICLOS
from event_manager import event_manager

# Variáveis globais para controle de saúde do scraper
ultima_atividade_scraper = time.time()
contagem_erros_consecutivos = 0
MAX_ERROS_CONSECUTIVOS = 5
driver_global = None

# Verificar se estamos em ambiente de produção
IS_PRODUCTION = os.environ.get('RENDER', False) or os.environ.get('PRODUCTION', False)

def configurar_driver() -> webdriver.Chrome:
    """
    Configura o driver do Selenium com opções adequadas
    
    Returns:
        webdriver.Chrome: Driver configurado
    """
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

def extrair_numeros_js(driver: webdriver.Chrome, elemento_roleta) -> List[str]:
    """
    Extrai números da roleta usando JavaScript e MutationObserver
    
    Args:
        driver (webdriver.Chrome): Driver do Selenium
        elemento_roleta: Elemento da roleta no DOM
        
    Returns:
        List[str]: Lista com os números extraídos
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

def extrair_id_roleta(elemento_roleta) -> str:
    """
    Extrai o ID único da roleta a partir das classes do elemento
    
    Args:
        elemento_roleta: Elemento da roleta no DOM
        
    Returns:
        str: ID da roleta
    """
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

def gerar_roleta_uuid(roleta_id: str) -> str:
    """
    Gera um UUID determinístico baseado no ID da roleta
    
    Args:
        roleta_id (str): ID original da roleta
        
    Returns:
        str: UUID gerado
    """
    # Gerar o mesmo UUID determinístico baseado no ID da roleta
    roleta_id_hash = hashlib.md5(str(roleta_id).encode()).hexdigest()
    return str(uuid.UUID(roleta_id_hash))

def determinar_cor_numero(numero: int) -> str:
    """
    Determina a cor do número baseado nas regras da roleta europeia
    
    Args:
        numero (int): Número da roleta
        
    Returns:
        str: Cor do número (verde, vermelho ou preto)
    """
    # Exceções específicas para a roleta europeia - verificar se estão corretas
    # Números vermelhos: 1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
    numeros_vermelhos = {1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36}
    
    if numero == 0:
        return 'verde'
    return 'vermelho' if numero in numeros_vermelhos else 'preto'

def inserir_novo_numero(data_source, roleta_id: str, roleta_nome: str, numero: int, timestamp: str = None) -> bool:
    """
    Insere um novo número na fonte de dados e notifica clientes
    
    Args:
        data_source: Fonte de dados (MongoDB, Supabase, etc.)
        roleta_id (str): ID da roleta
        roleta_nome (str): Nome da roleta
        numero (int): Número sorteado
        timestamp (str, optional): Timestamp. Defaults to None (usa timestamp atual).
        
    Returns:
        bool: True se inserido com sucesso, False caso contrário
    """
    try:
        # Validar o número
        if isinstance(numero, str):
            numero_int = int(re.sub(r'[^\d]', '', numero))
        else:
            numero_int = int(numero)
        
        if not (0 <= numero_int <= 36):
            logger.warning(f"Número inválido para inserção: {numero}")
            return False
        
        # Garantir que a roleta existe
        roleta_uuid = gerar_roleta_uuid(roleta_id)
        
        # Determinar a cor do número
        cor = determinar_cor_numero(numero_int)
        
        # Se timestamp não for fornecido, usar o atual
        if timestamp is None:
            timestamp = datetime.now().isoformat()
            
        # Inserir na fonte de dados (implementação específica será fornecida)
        sucesso = data_source.inserir_numero(
            roleta_id=roleta_uuid,
            roleta_nome=roleta_nome,
            numero=numero_int,
            cor=cor,
            timestamp=timestamp
        )
        
        if sucesso:
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
            
            print(f"{datetime.now().strftime('%H:%M:%S')} - NOVO NÚMERO: {numero_int} para {roleta_nome}")
            
            return True
        else:
            logger.error(f"Erro ao inserir número {numero_int} para {roleta_nome}")
            return False
            
    except Exception as e:
        logger.error(f"Erro ao inserir número {numero} para a roleta {roleta_nome}: {str(e)}")
        return False

def processar_novos_numeros(data_source, roleta_id: str, roleta_nome: str, numeros_novos: List[str]) -> bool:
    """
    Processa novos números detectados para uma roleta
    
    Args:
        data_source: Fonte de dados (MongoDB, Supabase, etc.)
        roleta_id (str): ID da roleta
        roleta_nome (str): Nome da roleta
        numeros_novos (List[str]): Lista de novos números
        
    Returns:
        bool: True se algum número foi processado, False caso contrário
    """
    if not numeros_novos:
        return False
    
    # Obter números existentes para verificar duplicidade
    numeros_existentes = data_source.obter_ultimos_numeros(roleta_id, limite=10)
    
    # Verificar cada número novo
    numeros_adicionados = False
    for num_str in numeros_novos:
        try:
            # Validar o número
            if isinstance(num_str, list):
                # Se for uma lista, pegamos o primeiro elemento se existir
                if num_str and len(num_str) > 0:
                    num_str = num_str[0]
                else:
                    logger.warning(f"Número vazio ou inválido (lista vazia) para a roleta {roleta_nome}")
                    continue
                    
            if isinstance(num_str, str):
                num_limpo = re.sub(r'[^\d]', '', num_str)
                if not num_limpo:
                    continue
                num = int(num_limpo)
            else:
                num = int(num_str)
            
            # Verificar duplicidade
            if not numeros_existentes or num != numeros_existentes[0]:
                if inserir_novo_numero(data_source, roleta_id, roleta_nome, num, datetime.now().isoformat()):
                    numeros_adicionados = True
                    # Atualizar a lista de números existentes
                    numeros_existentes.insert(0, num)
            else:
                logger.debug(f"Número {num} já existente para a roleta {roleta_nome}")
        except Exception as e:
            logger.warning(f"Erro ao processar número {num_str}: {str(e)}")
    
    return numeros_adicionados

def executar_com_retry(func, max_tentativas=3, delay_inicial=5, args=None, kwargs=None):
    """
    Executa uma função com retry e backoff exponencial
    
    Args:
        func: Função a ser executada
        max_tentativas (int, optional): Número máximo de tentativas. Defaults to 3.
        delay_inicial (int, optional): Atraso inicial entre tentativas. Defaults to 5.
        args: Argumentos posicionais para a função
        kwargs: Argumentos nomeados para a função
        
    Returns:
        Resultado da função
        
    Raises:
        Exception: A última exceção encontrada após todas as tentativas
    """
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

def verificar_saude_scraper(driver: Optional[webdriver.Chrome]) -> webdriver.Chrome:
    """
    Verifica se o scraper está saudável e o reinicia se necessário
    
    Args:
        driver (Optional[webdriver.Chrome]): Driver atual ou None
        
    Returns:
        webdriver.Chrome: Driver atual ou novo
    """
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

def scrape_roletas(data_source, driver: Optional[webdriver.Chrome] = None) -> None:
    """
    Função principal que realiza o scraping das roletas
    
    Args:
        data_source: Fonte de dados (MongoDB, Supabase, etc.)
        driver (Optional[webdriver.Chrome], optional): Driver do Selenium. Defaults to None.
    """
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
                        
                        # Garantir que a roleta existe na fonte de dados
                        data_source.garantir_roleta_existe(id_roleta, titulo_roleta)
                        
                        # Extrair números da roleta - usando a função otimizada
                        numeros = extrair_numeros_js(driver_interno, elemento_roleta)
                        
                        # Processar novos números
                        if processar_novos_numeros(data_source, id_roleta, titulo_roleta, numeros):
                            logger.info(f"EXTRAÍDO: {numeros} para {titulo_roleta}")
                            # Atualizar timestamp de atividade
                            ultima_atividade_scraper = time.time()
                            contagem_erros_consecutivos = 0
                    
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

def simulate_roulette_data(data_source) -> None:
    """
    Simula dados de roleta para testes quando o scraper não funciona
    
    Args:
        data_source: Fonte de dados (MongoDB, Supabase, etc.)
    """
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
        
        # Garantir que a roleta existe
        data_source.garantir_roleta_existe(roleta['id'], roleta['nome'])
        
        # Criar evento e notificar clientes
        event_data = {
            "type": "new_number",
            "roleta": roleta['nome'],
            "numero": numero,
            "timestamp": time.time(),
            "simulado": True,
            "startup": True
        }
        
        # Inserir na fonte de dados
        inserir_novo_numero(data_source, roleta['id'], roleta['nome'], numero, datetime.now().isoformat())
        
        # Notificar clientes de forma mais direta
        event_manager.notify_clients(event_data)
        
        logger.info(f"[SIMULAÇÃO] Evento inicial enviado para {len(event_manager.clients)} clientes")
    except Exception as e:
        logger.error(f"[SIMULAÇÃO] Erro ao gerar evento inicial: {str(e)}")
    
    # Pequena pausa antes de iniciar o ciclo principal
    time.sleep(1)
    
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
            
            # Garantir que a roleta existe
            data_source.garantir_roleta_existe(roleta_id, roleta_nome)
            
            # Inserir na fonte de dados
            inserir_novo_numero(data_source, roleta_id, roleta_nome, numero, datetime.now().isoformat())
            
            # Intervalo rápido (1-3 segundos)
            intervalo = random.randint(1, 3)
            logger.info(f"[SIMULAÇÃO] Aguardando {intervalo} segundos até o próximo número")
            time.sleep(intervalo)
            
        except Exception as e:
            logger.error(f"[SIMULAÇÃO] Erro ao simular dados: {str(e)}")
            time.sleep(5)

# Interface para fontes de dados
class DataSourceInterface:
    """Interface para fontes de dados (MongoDB, Supabase, etc.)"""
    
    def garantir_roleta_existe(self, roleta_id: str, roleta_nome: str) -> str:
        """
        Verifica se a roleta existe, e a insere caso não exista
        
        Args:
            roleta_id (str): ID da roleta
            roleta_nome (str): Nome da roleta
            
        Returns:
            str: ID da roleta no formato usado pela fonte de dados
        """
        raise NotImplementedError("Método não implementado")
    
    def obter_ultimos_numeros(self, roleta_id: str, limite: int = 10) -> List[int]:
        """
        Obtém os últimos números para uma roleta específica
        
        Args:
            roleta_id (str): ID da roleta
            limite (int, optional): Limite de números. Defaults to 10.
            
        Returns:
            List[int]: Lista dos últimos números
        """
        raise NotImplementedError("Método não implementado")
    
    def inserir_numero(self, roleta_id: str, roleta_nome: str, numero: int, cor: str, timestamp: str) -> bool:
        """
        Insere um novo número para uma roleta
        
        Args:
            roleta_id (str): ID da roleta
            roleta_nome (str): Nome da roleta
            numero (int): Número sorteado
            cor (str): Cor do número
            timestamp (str): Timestamp do evento
            
        Returns:
            bool: True se inserido com sucesso, False caso contrário
        """
        raise NotImplementedError("Método não implementado") 