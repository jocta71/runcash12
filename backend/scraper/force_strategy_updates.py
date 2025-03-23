#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para forçar atualizações de estados de estratégia para todas as roletas
"""

import pymongo
import random
from datetime import datetime
from config import MONGODB_URI

# Estados possíveis
ESTADOS = ["NEUTRAL", "TRIGGER", "POST_GALE_NEUTRAL", "MORTO"]

def force_strategy_updates():
    try:
        # Conectar ao MongoDB
        client = pymongo.MongoClient(MONGODB_URI)
        db = client.get_default_database()
        
        # Coleções
        numeros = db["numeros_sorteados_novo"]
        estrategias = db["estrategia_historico_novo"]
        
        # Obter todas as roletas disponíveis
        roletas = list(numeros.distinct("roleta_nome"))
        
        if not roletas:
            print("Nenhuma roleta encontrada na coleção 'numeros_sorteados_novo'")
            return
        
        print(f"Encontradas {len(roletas)} roletas.")
        
        # Forçar atualizações para cada roleta
        for roleta_nome in roletas:
            # Obter o ID da roleta
            roleta_doc = numeros.find_one({"roleta_nome": roleta_nome})
            if not roleta_doc:
                print(f"Nenhum registro encontrado para {roleta_nome}")
                continue
                
            roleta_id = roleta_doc.get("roleta_id", "unknown")
            
            # Decidir o estado aleatoriamente, mas forçar TRIGGER e POST_GALE_NEUTRAL com mais frequência
            # para mostrar os terminais
            peso_estado = random.random()
            if peso_estado < 0.4:  # 40% chance de TRIGGER
                estado = "TRIGGER"
            elif peso_estado < 0.6:  # 20% chance de POST_GALE_NEUTRAL
                estado = "POST_GALE_NEUTRAL"
            elif peso_estado < 0.8:  # 20% chance de NEUTRAL
                estado = "NEUTRAL"
            else:  # 20% chance de MORTO
                estado = "MORTO"
            
            # Gerar número de gatilho aleatório
            numero_gatilho = random.randint(0, 36)
            
            # Gerar terminais de gatilho aleatórios
            terminais_gatilho = [random.randint(1, 36) for _ in range(3)]
            
            # Vitórias e derrotas aleatórias
            vitorias = random.randint(0, 50)
            derrotas = random.randint(0, 30)
            
            # Timestamp atual
            timestamp = datetime.now()
            
            # Criar ou atualizar o documento de estratégia
            estrategia = {
                "roleta_id": roleta_id,
                "roleta_nome": roleta_nome,
                "estado": estado,
                "numero_gatilho": numero_gatilho,
                "terminais_gatilho": terminais_gatilho,
                "vitorias": vitorias,
                "derrotas": derrotas,
                "timestamp": timestamp
            }
            
            # Atualizar ou inserir
            result = estrategias.update_one(
                {"roleta_id": roleta_id},
                {"$set": estrategia},
                upsert=True
            )
            
            if result.modified_count > 0 or result.upserted_id:
                print(f"Roleta: {roleta_nome} - Estado: {estado} - Terminais: {terminais_gatilho}")
            else:
                print(f"Falha ao atualizar estratégia para {roleta_nome}")
                
        print("\nTodas as estratégias foram atualizadas!")
        print("Agora o WebSocket enviará os novos estados.")
    
    except Exception as e:
        print(f"Erro ao forçar atualizações de estratégia: {str(e)}")

if __name__ == "__main__":
    force_strategy_updates() 