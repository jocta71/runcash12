import time
import random
import logging
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

class StrategyAnalyzer:
    # ... (existing code)
    pass

def configurar_driver():
    # ... (existing code)
    pass

while executando:
    try:
        # Verificar URL atual e redirecionar se necessário, mas com limitação
        current_url = driver.current_url
        current_time = time.time()
        
        if ("888casino.com" not in current_url or "live-casino" not in current_url) and \
           (current_time - last_redirection_time > 60 or redirection_count < 3):
            logging.warning("URL incorreta detectada, redirecionando...")
            driver.get("https://es.888casino.com/live-casino/#filters=live-roulette")
            time.sleep(5)
            redirection_count += 1
            last_redirection_time = current_time
        elif current_time - last_redirection_time > 300:
            # Reset counter every 5 minutes
            redirection_count = 0
        
        # Encontrar todas as roletas
        elementos = WebDriverWait(driver, 15).until(
            EC.presence_of_all_elements_located((By.CLASS_NAME, "cy-live-casino-grid-item"))
        )
        
        # Log the number of roulette elements found
        logging.info(f"Encontradas {len(elementos)} roletas na página")
        
        # Process all roulette tables instead of filtering
        for elemento in elementos:
            try:
                # Extrair título da roleta
                titulo = elemento.find_element(By.CLASS_NAME, "cy-live-casino-grid-item-title").text
                
                # Log the roulette title for debugging
                logging.info(f"Processando roleta: {titulo}")
                
                # Criar analisador para mesa se não existir
                if titulo not in analisadores_mesas:
                    analisadores_mesas[titulo] = StrategyAnalyzer()
                    logging.info(f"Novo analisador criado para mesa: {titulo}")
                
                # ... resto do código aqui ...
            
            except Exception as e:
                logging.error(f"Erro ao processar roleta: {str(e)}")
        
        # Delay aleatório entre verificações
        time.sleep(random.uniform(2.0, 3.0))  # Aumentado para reduzir uso de CPU
            
    except Exception as e:
        logging.error(f"Erro na extração: {str(e)}")
        
        # Se houver erro, tentar reiniciar o driver, mas com menos frequência
        try:
            if driver:
                driver.quit()
            driver = configurar_driver()
            
            redirection_count = 0
            last_redirection_time = time.time()
        except Exception as e:
            logging.error(f"Erro ao reiniciar driver: {str(e)}")
            time.sleep(30)  # Esperar mais tempo antes de tentar novamente 