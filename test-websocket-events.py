import requests
import json
import time
import random
from datetime import datetime

# URL do endpoint para enviar eventos
WEBSOCKET_URL = "http://localhost:5000/emit-event"

# Lista de roletas para simular
ROLETAS = [
    {"id": "2010017", "nome": "Auto-Roulette"},
    {"id": "2010065", "nome": "Bucharest Auto-Roulette"},
    {"id": "2010051", "nome": "Speed Auto Roulette"},
    {"id": "2010049", "nome": "Auto-Roulette VIP"},
    {"id": "2010011", "nome": "Immersive Roulette"},
    {"id": "2010015", "nome": "Brazilian Mega Roulette"}
]

# Números vermelhos na roleta
NUMEROS_VERMELHOS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]

def get_cor(numero):
    """Determina a cor de um número na roleta"""
    if numero == 0:
        return "verde"
    return "vermelho" if numero in NUMEROS_VERMELHOS else "preto"

def enviar_numero_aleatorio():
    """Envia um número aleatório para uma roleta aleatória"""
    roleta = random.choice(ROLETAS)
    numero = random.randint(0, 36)
    
    evento = {
        "event": "new_number",
        "data": {
            "type": "new_number",
            "roleta_id": roleta["id"],
            "roleta_nome": roleta["nome"],
            "numero": numero,
            "cor": get_cor(numero),
            "timestamp": datetime.now().isoformat()
        }
    }
    
    print(f"\nEnviando número {numero} para {roleta['nome']}...")
    
    try:
        response = requests.post(WEBSOCKET_URL, json=evento)
        
        if response.status_code == 200:
            print(f"Evento enviado com sucesso: {response.json()}")
        else:
            print(f"Erro ao enviar evento: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Exceção ao enviar evento: {e}")

def enviar_estrategia_aleatoria():
    """Envia uma atualização de estratégia aleatória"""
    roleta = random.choice(ROLETAS)
    estados = ["NEUTRAL", "TRIGGER", "POST_GALE_NEUTRAL", "MORTO"]
    estado = random.choice(estados)
    
    # Criar terminais aleatórios
    terminais = []
    for _ in range(random.randint(1, 3)):
        terminais.append(random.randint(0, 9))
    
    # Determinar sugestão com base no estado
    sugestao = "AGUARDANDO GATILHO"
    if estado == "TRIGGER":
        sugestao = f"APOSTAR EM: {','.join(map(str, terminais))}"
    elif estado == "POST_GALE_NEUTRAL":
        sugestao = f"GALE EM: {','.join(map(str, terminais))}"
    elif estado == "MORTO":
        sugestao = "AGUARDANDO PRÓXIMO CICLO"
    
    evento = {
        "event": "strategy_update",
        "data": {
            "type": "strategy_update",
            "roleta_id": roleta["id"],
            "roleta_nome": roleta["nome"],
            "estado": estado,
            "numero_gatilho": random.randint(0, 36),
            "terminais_gatilho": terminais,
            "vitorias": random.randint(0, 10),
            "derrotas": random.randint(0, 10),
            "sugestao_display": sugestao,
            "timestamp": datetime.now().isoformat()
        }
    }
    
    print(f"\nEnviando estratégia {estado} para {roleta['nome']}...")
    
    try:
        response = requests.post(WEBSOCKET_URL, json=evento)
        
        if response.status_code == 200:
            print(f"Evento enviado com sucesso: {response.json()}")
        else:
            print(f"Erro ao enviar evento: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Exceção ao enviar evento: {e}")

def main():
    """Função principal que envia eventos a cada poucos segundos"""
    print("Iniciando envio de eventos para o WebSocket...")
    print(f"Servidor: {WEBSOCKET_URL}")
    print("Pressione Ctrl+C para encerrar\n")
    
    count = 0
    
    try:
        while True:
            count += 1
            
            # Enviar número aleatório
            enviar_numero_aleatorio()
            
            # A cada 3 números, enviar também uma estratégia
            if count % 3 == 0:
                enviar_estrategia_aleatoria()
            
            # Aguardar intervalo aleatório entre 2 e 5 segundos
            intervalo = random.uniform(2, 5)
            print(f"Aguardando {intervalo:.1f} segundos...")
            time.sleep(intervalo)
            
    except KeyboardInterrupt:
        print("\nEnvio de eventos interrompido pelo usuário.")

if __name__ == "__main__":
    main() 