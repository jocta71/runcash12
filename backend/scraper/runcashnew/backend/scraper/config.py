import os
import logging
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Configurar logging
logger = logging.getLogger('roulette_scraper')
logger.setLevel(logging.INFO)  # Manteremos INFO como padrão, mas ajustaremos o formato

# Criar um handler para console com formato mais limpo
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

# Criar um formatador mais conciso - apenas hora:minuto:segundo e a mensagem
formatter = logging.Formatter('%(asctime)s - %(message)s', '%H:%M:%S')
console_handler.setFormatter(formatter)

# Adicionar o handler ao logger
logger.addHandler(console_handler)

# Máximo de ciclos (0 = infinito)
MAX_CICLOS = 0

# Intervalo de scraping em minutos (padrão: 5 minutos)
SCRAPE_INTERVAL_MINUTES = int(os.getenv('SCRAPE_INTERVAL_MINUTES', 5))

# Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://evzqzghxuttctbxgohpx.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2enF6Z2h4dXR0Y3RieGdvaHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzc5OTEsImV4cCI6MjA1Njc1Mzk5MX0.CmoM_y0i36nbBx2iN0DlOIob3yAgVRM1xY_XiOFBZLQ')

# URL do cassino
casino_url_env = os.getenv('CASINO_URL', 'https://es.888casino.com/live-casino/#filters=live-roulette')
# Sanitizar a URL removendo espaços e símbolos indesejados
CASINO_URL = casino_url_env.strip()
if CASINO_URL.startswith('='):
    CASINO_URL = CASINO_URL[1:]

# Função para verificar se uma roleta é permitida
def roleta_permitida_por_id(id_roleta):
    # Lista de IDs conhecidos (sincronizada com frontend/src/config/allowedRoulettes.ts)
    roletas_conhecidas = [
        "2010016",  # Immersive Roulette
        "2380335",  # Brazilian Mega Roulette
        "2010065",  # Bucharest Auto-Roulette
        "2010096",  # Speed Auto Roulette
        "2010017",  # Auto-Roulette
        "2010098",  # Auto-Roulette VIP
    ]
    
    # Obter lista de roletas permitidas da variável de ambiente
    roletas_permitidas = os.getenv('ALLOWED_ROULETTES', '')
    
    # Se a variável não estiver definida, usar a lista de roletas conhecidas
    if not roletas_permitidas:
        # Reduzir verbosidade - apenas log em debug
        logger.debug(f"Usando lista interna de roletas")
        return id_roleta in roletas_conhecidas
    
    # Se a variável tiver o valor "*", permitir todas as roletas
    if roletas_permitidas == "*":
        logger.debug("Modo permissivo: todas as roletas são permitidas")
        return True
    
    # Dividir a string por vírgulas para obter a lista de roletas permitidas
    lista_permitidas = [r.strip() for r in roletas_permitidas.split(',')]
    
    # Verificar se o ID da roleta está na lista de permitidas
    return id_roleta in lista_permitidas
