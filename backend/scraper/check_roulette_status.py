#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para verificar o estado das estratégias para Immersive Roulette no MongoDB
"""

import pymongo
import json
from config import MONGODB_URI

def check_strategy_status():
    try:
        # Conectar ao MongoDB
        client = pymongo.MongoClient(MONGODB_URI)
        db = client.get_default_database()
        
        # Coleção de estratégias
        estrategias = db["estrategia_historico_novo"]
        
        # Buscar estratégias para Immersive Roulette
        query = {"roleta_nome": {"$regex": "Immersive", "$options": "i"}}
        
        # Ordenar por timestamp decrescente para obter os mais recentes
        results = list(estrategias.find(query).sort("timestamp", -1).limit(5))
        
        if not results:
            print("Nenhuma estratégia encontrada para Immersive Roulette")
            
            # Verificar todas as roletas disponíveis
            all_roulettes = list(estrategias.distinct("roleta_nome"))
            print(f"Roletas disponíveis: {all_roulettes}")
            
            # Verificar estados disponíveis
            all_states = list(estrategias.distinct("estado"))
            print(f"Estados disponíveis: {all_states}")
            
            return
        
        # Exibir os registros encontrados
        print(f"Encontrados {len(results)} registros para Immersive Roulette:")
        for idx, result in enumerate(results):
            # Converter ObjectId para string para serialização
            if "_id" in result:
                result["_id"] = str(result["_id"])
            
            # Formatar timestamp para exibição
            if "timestamp" in result:
                result["timestamp"] = str(result["timestamp"])
            
            print(f"\n--- Registro {idx+1} ---")
            print(json.dumps(result, indent=2))
        
        # Forçar uma atualização para TRIGGER se todos estiverem MORTO
        if all(r.get("estado") == "MORTO" for r in results):
            print("\nTodos os estados estão MORTO. Forçando atualização para TRIGGER...")
            
            # Pegar a entrada mais recente
            latest = results[0]
            roleta_id = latest.get("roleta_id")
            roleta_nome = latest.get("roleta_nome")
            
            # Atualizar para TRIGGER
            from strategy_helper import atualizar_estrategia
            
            success = atualizar_estrategia(
                roleta_id=roleta_id,
                roleta_nome=roleta_nome,
                estado="TRIGGER",
                numero_gatilho=0,  # qualquer número
                terminais_gatilho=[1, 2, 3],  # terminais de exemplo
                vitorias=0,
                derrotas=0
            )
            
            if success:
                print("Estratégia atualizada com sucesso para TRIGGER!")
            else:
                print("Falha ao atualizar estratégia.")
    
    except Exception as e:
        print(f"Erro ao verificar estratégias: {str(e)}")

if __name__ == "__main__":
    check_strategy_status() 