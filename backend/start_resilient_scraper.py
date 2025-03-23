#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Inicializador resiliente para o scraper - garante que o scraper continuará
funcionando mesmo após falhas graves que possam encerrar o processo.
"""

import os
import sys
import time
import signal
import subprocess
import datetime
import atexit

# Configurações
MAX_RESTARTS = 20  # Máximo de reinicializações em um período
RESTART_PERIOD = 86400  # Período para contar reinicializações (24 horas)
MIN_RUNTIME = 60  # Tempo mínimo de execução considerado saudável (segundos)
COOLDOWN_TIME = 30  # Tempo de espera entre reinicializações (segundos)

# Variáveis globais
start_time = time.time()
last_restarts = []  # Lista de timestamps das últimas reinicializações
current_process = None
forced_exit = False


def log(message):
    """Registra mensagens com timestamp"""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")
    sys.stdout.flush()  # Garantir que a mensagem seja exibida imediatamente


def cleanup():
    """Limpa recursos ao encerrar"""
    global current_process, forced_exit
    
    if not forced_exit and current_process and current_process.poll() is None:
        log("Encerrando processo do scraper...")
        try:
            current_process.terminate()
            time.sleep(2)
            if current_process.poll() is None:
                current_process.kill()
        except:
            pass


def signal_handler(sig, frame):
    """Lida com sinais de interrupção"""
    global forced_exit
    log(f"Sinal recebido: {sig}. Encerrando...")
    forced_exit = True
    cleanup()
    sys.exit(0)


def check_excessive_restarts():
    """Verifica se houve muitas reinicializações em um curto período"""
    global last_restarts
    
    # Remover reinicializações antigas
    current_time = time.time()
    last_restarts = [t for t in last_restarts if current_time - t <= RESTART_PERIOD]
    
    # Verificar se excedemos o limite
    if len(last_restarts) >= MAX_RESTARTS:
        log(f"ALERTA: {len(last_restarts)} reinicializações nas últimas {RESTART_PERIOD/3600:.1f} horas!")
        log("Pode haver um problema grave que está impedindo o scraper de funcionar corretamente.")
        log(f"Aguardando {COOLDOWN_TIME*2} segundos antes de tentar novamente...")
        time.sleep(COOLDOWN_TIME * 2)
        
        # Limpar metade das reinicializações mais antigas para permitir nova tentativa
        last_restarts = last_restarts[len(last_restarts)//2:]


def start_scraper():
    """Inicia o scraper como um processo separado"""
    global current_process
    
    # Registrar esta reinicialização
    last_restarts.append(time.time())
    
    # Verificar reinicializações excessivas
    check_excessive_restarts()
    
    # Construir comando para iniciar o scraper
    python_executable = sys.executable
    script_path = os.path.join(os.path.dirname(__file__), "scraper", "scraper_mongodb.py")
    
    # Garantir que o caminho exista
    if not os.path.exists(script_path):
        log(f"ERRO: Script do scraper não encontrado em: {script_path}")
        return None
    
    log(f"Iniciando scraper: {python_executable} {script_path}")
    
    try:
        # Iniciar scraper como processo separado
        current_process = subprocess.Popen(
            [python_executable, script_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        log(f"Scraper iniciado com PID: {current_process.pid}")
        return current_process
    except Exception as e:
        log(f"ERRO ao iniciar scraper: {str(e)}")
        return None


def monitor_scraper():
    """Monitora o scraper e o reinicia se necessário"""
    global current_process
    
    log("=== Iniciando monitor de resiliência do scraper ===")
    log("Este monitor garantirá que o scraper continue funcionando 24/7")
    log("Pressione Ctrl+C para encerrar\n")
    
    # Registrar handlers para sinais
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Registrar função de limpeza para ser executada ao sair
    atexit.register(cleanup)
    
    while not forced_exit:
        process_start_time = time.time()
        
        # Iniciar o scraper
        current_process = start_scraper()
        
        if current_process is None:
            log("Falha ao iniciar o scraper. Tentando novamente em 30s...")
            time.sleep(30)
            continue
        
        # Loop de monitoramento - encaminhar a saída e verificar se o processo ainda está vivo
        while current_process.poll() is None and not forced_exit:
            try:
                # Ler e encaminhar a saída do scraper
                output_line = current_process.stdout.readline()
                if output_line:
                    print(output_line.strip())
                    sys.stdout.flush()
                else:
                    # Se não há saída, aguardar um pouco
                    time.sleep(0.1)
                
            except Exception as e:
                log(f"Erro ao ler saída do scraper: {str(e)}")
                time.sleep(1)
        
        # Verificar código de saída
        if current_process.returncode is not None:
            log(f"Scraper encerrado com código: {current_process.returncode}")
        
        # Calcular tempo de execução
        runtime = time.time() - process_start_time
        
        if runtime < MIN_RUNTIME:
            log(f"ALERTA: Scraper executou por apenas {runtime:.1f} segundos!")
            log(f"Aguardando {COOLDOWN_TIME}s antes de reiniciar...")
            time.sleep(COOLDOWN_TIME)
        else:
            log(f"Scraper executou por {runtime:.1f} segundos antes de encerrar.")
            log("Reiniciando em 5 segundos...")
            time.sleep(5)


if __name__ == "__main__":
    try:
        monitor_scraper()
    except KeyboardInterrupt:
        log("\nPrograma encerrado pelo usuário.")
    except Exception as e:
        log(f"Erro fatal: {str(e)}")
        import traceback
        log(traceback.format_exc())
        sys.exit(1) 