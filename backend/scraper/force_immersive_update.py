#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para forçar a atualização da Immersive Roulette para estado TRIGGER
"""

import pymongo
from datetime import datetime
from config import MONGODB_URI

def force_immersive_update():
    try:
        # Conectar ao MongoDB
        client = pymongo.MongoClient(MONGODB_URI)
        db = client.get_default_database()
        
        # Coleções
        numeros = db["numeros_sorteados_novo"]
        estrategias = db["estrategia_historico_novo"]
        
        # Buscar Immersive Roulette
        roleta_doc = numeros.find_one({"roleta_nome": {"$regex": "Immersive", "$options": "i"}})
        
        if not roleta_doc:
            print("Immersive Roulette não encontrada na coleção 'numeros_sorteados_novo'")
            print("Criando registro de exemplo...")
            # Criar um registro de exemplo
            roleta_id = "immersive_roulette_id"
            roleta_nome = "Immersive Roulette"
        else:
            roleta_id = roleta_doc.get("roleta_id", "immersive_roulette_id")
            roleta_nome = roleta_doc.get("roleta_nome", "Immersive Roulette")
            print(f"Immersive Roulette encontrada: ID={roleta_id}, Nome={roleta_nome}")
        
        # Buscar estratégia atual
        estrategia_atual = estrategias.find_one({"roleta_id": roleta_id})
        
        if estrategia_atual:
            print(f"Estratégia atual: {estrategia_atual.get('estado')}")
            print(f"Terminais atuais: {estrategia_atual.get('terminais_gatilho')}")
        
        # Criar estratégia com estado TRIGGER
        estrategia = {
            "roleta_id": roleta_id,
            "roleta_nome": roleta_nome,
            "estado": "TRIGGER",
            "numero_gatilho": 36,
            "terminais_gatilho": [33, 36, 0],
            "vitorias": 10,
            "derrotas": 2,
            "timestamp": datetime.now()
        }
        
        # Atualizar ou inserir
        result = estrategias.update_one(
            {"roleta_id": roleta_id},
            {"$set": estrategia},
            upsert=True
        )
        
        if result.modified_count > 0 or result.upserted_id:
            print(f"Immersive Roulette atualizada para estado TRIGGER")
            print(f"Terminais de aposta: {estrategia['terminais_gatilho']}")
        else:
            print(f"Falha ao atualizar estratégia para Immersive Roulette")
        
        print("\nVerifique o cartão de roleta no frontend para ver se os dados são exibidos corretamente.")
        print("O WebSocket enviará o novo estado na próxima verificação (em cerca de 2 segundos).")
    
    except Exception as e:
        print(f"Erro ao forçar atualização para Immersive Roulette: {str(e)}")

if __name__ == "__main__":
    force_immersive_update() 