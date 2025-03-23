#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para forçar o envio de estratégias para o WebSocket
"""

import pymongo
import json
import time
from datetime import datetime
from config import MONGODB_URI

def debug_websocket():
    try:
        # Conectar ao MongoDB
        client = pymongo.MongoClient(MONGODB_URI)
        db = client.get_default_database()
        
        # Coleção de estratégias
        estrategias = db["estrategia_historico_novo"]
        
        # Para Auto-Roulette VIP especificamente
        print("\nForçando atualização para Auto-Roulette VIP...")
        
        # Verificar se já existe uma estratégia
        strategy = estrategias.find_one({"roleta_nome": "Auto-Roulette VIP"})
        
        if not strategy:
            print("Estratégia para Auto-Roulette VIP não encontrada, criando uma nova...")
            
            # Criar nova estratégia
            new_strategy = {
                "roleta_id": "auto_roulette_vip_id",
                "roleta_nome": "Auto-Roulette VIP",
                "estado": "TRIGGER",
                "numero_gatilho": 21,
                "terminais_gatilho": [1, 2, 3],
                "vitorias": 10,
                "derrotas": 2,
                "sugestao_display": "APOSTAR EM: 1,2,3",
                "timestamp": datetime.now()
            }
            
            result = estrategias.insert_one(new_strategy)
            print(f"Nova estratégia criada: {result.inserted_id}")
        else:
            # Atualizar estratégia existente para exibir TRIGGER
            print(f"Atualizando estratégia existente: {strategy.get('_id')}")
            
            update_data = {
                "estado": "TRIGGER",
                "numero_gatilho": 21,
                "terminais_gatilho": [19, 21, 30],
                "vitorias": 15,
                "derrotas": 3,
                "sugestao_display": "APOSTAR EM: 19,21,30",
                "timestamp": datetime.now()
            }
            
            result = estrategias.update_one(
                {"_id": strategy["_id"]},
                {"$set": update_data}
            )
            
            print(f"Estratégia atualizada: {result.modified_count > 0}")
        
        print("\nAtualizando timestamp para forçar o WebSocket a enviar os dados...")
        
        # Atualizar o timestamp para forçar o WebSocket a enviar novamente
        for i in range(5):
            print(f"Atualização {i+1}/5...")
            
            # Buscar todas as estratégias
            strategies = list(estrategias.find())
            
            for strategy in strategies:
                # Atualizar timestamp
                result = estrategias.update_one(
                    {"_id": strategy["_id"]},
                    {"$set": {"timestamp": datetime.now()}}
                )
            
            # Aguardar um pouco para dar tempo do WebSocket processar
            time.sleep(1)
        
        print("\nVerificação concluída. O WebSocket deve ter enviado os dados atualizados.")
        print("Por favor, verifique se o frontend está exibindo corretamente os estados e terminais.")
    
    except Exception as e:
        print(f"Erro ao depurar WebSocket: {str(e)}")

if __name__ == "__main__":
    debug_websocket() 