#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para executar o scraper em modo real com integração de análise de estratégia
"""

import sys
import time
import logging
import json
import requests
from datetime import datetime

# Configurar logging para mostrar mais informações
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Imports locais
from data_source_mongo import MongoDataSource
from scraper_mongodb import scrape_roletas
from strategy_analyzer import StrategyAnalyzer
from strategy_helper import atualizar_estrategia

# Dicionário global para armazenar instâncias de analisadores de estratégia
_strategy_analyzers = {}

# Configuração do WebSocket - ajustar conforme necessário
# Esta URL deve apontar para o servidor WebSocket que você implantou
# Exemplos:
#  - Em desenvolvimento local: "http://localhost:5000/emit-event"
#  - Com ngrok: "https://seu-tunnel-ngrok.ngrok-free.app/emit-event"
#  - Servidor em produção: "https://seu-servidor-websocket.com/emit-event"
WEBSOCKET_SERVER_URL = "http://localhost:5000/emit-event"  # URL local com protocolo http://

def notify_websocket(event_type, data):
    """
    Envia um evento para o servidor WebSocket
    """
    try:
        payload = {
            "event": event_type,
            "data": data
        }
        
        print(f"\n[WebSocket] Enviando evento {event_type}:")
        print(json.dumps(data, indent=2, ensure_ascii=False))
        
        response = requests.post(WEBSOCKET_SERVER_URL, json=payload)
        
        if response.status_code == 200:
            print(f"[WebSocket] ✅ Evento {event_type} enviado com sucesso")
        else:
            print(f"[WebSocket] ❌ Falha ao enviar evento: {response.status_code} - {response.text}")
    
    except Exception as e:
        print(f"[WebSocket] ❌ Erro ao notificar WebSocket: {str(e)}")

def get_analyzer(roleta_id, roleta_nome):
    """
    Obtém ou cria uma instância do analisador de estratégia para uma roleta
    """
    global _strategy_analyzers
    
    # Criar chave global única para esta roleta
    key = f"{roleta_id}:{roleta_nome}"
    
    # Se já existe um analisador para esta roleta, retorná-lo
    if key in _strategy_analyzers:
        return _strategy_analyzers[key]
    
    # Caso contrário, criar uma nova instância
    try:
        print(f"\n[Estratégia] 🎲 Criando novo analisador para roleta: {roleta_nome}")
        analyzer = StrategyAnalyzer(table_name=roleta_nome)
        _strategy_analyzers[key] = analyzer
        return analyzer
    except Exception as e:
        print(f"[Estratégia] ❌ Erro ao criar analisador: {str(e)}")
        return None

def generate_display_suggestion(estado, terminais):
    """
    Gera uma sugestão de exibição baseada no estado da estratégia
    """
    if estado == "NEUTRAL":
        return "AGUARDANDO GATILHO"
    elif estado == "TRIGGER" and terminais:
        return f"APOSTAR EM: {','.join(map(str, terminais))}"
    elif estado == "POST_GALE_NEUTRAL" and terminais:
        return f"GALE EM: {','.join(map(str, terminais))}"
    elif estado == "MORTO":
        return "AGUARDANDO PRÓXIMO CICLO"
    
    return ""

def process_new_number(db, roleta_id, roleta_nome, numero):
    """
    Processa um novo número com o analisador de estratégia e atualiza no MongoDB
    """
    print(f"\n{'='*50}")
    print(f"🎲 NOVO NÚMERO DETECTADO")
    print(f"📍 Roleta: {roleta_nome}")
    print(f"🔢 Número: {numero}")
    print(f"{'='*50}")
    
    try:
        # Obter o analisador para esta roleta
        analyzer = get_analyzer(roleta_id, roleta_nome)
        
        if not analyzer:
            print(f"❌ Não foi possível obter analisador para roleta {roleta_nome}")
            return None
        
        # Adicionar o novo número
        analyzer.add_number(numero)
        
        # Obter o status atual da estratégia
        data = analyzer.get_data()
        estrategia = data.get("estrategia", {})
        
        # Atualizar no MongoDB
        print(f"\n[MongoDB] 💾 Atualizando estratégia para roleta {roleta_nome}")
        
        atualizar_estrategia(
            roleta_id=roleta_id,
            roleta_nome=roleta_nome,
            estado=estrategia.get("estado", "NEUTRAL"),
            numero_gatilho=estrategia.get("numero_gatilho", -1),
            terminais_gatilho=estrategia.get("terminais_gatilho", []),
            vitorias=estrategia.get("vitorias", 0),
            derrotas=estrategia.get("derrotas", 0)
        )
        
        # Notificar o WebSocket sobre o novo número
        event_data = {
            "roleta_id": roleta_id,
            "roleta_nome": roleta_nome,
            "numero": numero,
            "timestamp": datetime.now().isoformat()
        }
        notify_websocket("new_number", event_data)
        
        # Notificar o WebSocket sobre a atualização da estratégia
        strategy_data = {
            "roleta_id": roleta_id,
            "roleta_nome": roleta_nome,
            "estado": estrategia.get("estado", "NEUTRAL"),
            "numero_gatilho": estrategia.get("numero_gatilho", -1),
            "terminais_gatilho": estrategia.get("terminais_gatilho", []),
            "vitorias": estrategia.get("vitorias", 0),
            "derrotas": estrategia.get("derrotas", 0),
            "display_suggestion": generate_display_suggestion(
                estrategia.get("estado", "NEUTRAL"),
                estrategia.get("terminais_gatilho", [])
            ),
            "timestamp": datetime.now().isoformat()
        }
        notify_websocket("strategy_update", strategy_data)
        
        # Mostrar resumo da estratégia
        print(f"\n[Estratégia] 📊 Status Atual:")
        print(f"Estado: {estrategia.get('estado', 'NEUTRAL')}")
        print(f"Vitórias: {estrategia.get('vitorias', 0)}")
        print(f"Derrotas: {estrategia.get('derrotas', 0)}")
        if estrategia.get('terminais_gatilho'):
            print(f"Terminais: {estrategia.get('terminais_gatilho', [])}")
        print(f"{'='*50}\n")
        
        return estrategia
    
    except Exception as e:
        print(f"❌ Erro ao processar número {numero} para roleta {roleta_nome}: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """
    Função principal para executar o scraper em modo real
    """
    print("\n🚀 Iniciando scraper REAL com integração de análise de estratégia...")
    
    try:
        # Inicializar fonte de dados MongoDB
        db = MongoDataSource()
        print("✅ Conexão ao MongoDB estabelecida com sucesso")
        
        # Hook para processar números da roleta
        def numero_hook(roleta_id, roleta_nome, numero):
            """
            Hook chamado quando um novo número é detectado pelo scraper
            """
            # Processar o número com o analisador de estratégia
            status = process_new_number(db, roleta_id, roleta_nome, numero)
            
            if not status:
                print(f"❌ Falha ao processar número {numero} para estratégia")
        
        print("\n🎰 Executando em modo REAL - Acessando site da casa de apostas")
        
        # Executar o scraper real com o hook
        scrape_roletas(db, numero_hook=numero_hook)
        
        return 0
        
    except Exception as e:
        print(f"❌ Erro ao executar scraper: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 