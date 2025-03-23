#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para depurar o problema de exibição de estados de estratégia
"""

import pymongo
import json
from datetime import datetime
from config import MONGODB_URI
from run_real_scraper import generate_display_suggestion

def debug_strategy_display():
    try:
        # Conectar ao MongoDB
        client = pymongo.MongoClient(MONGODB_URI)
        db = client.get_default_database()
        
        # Coleções
        estrategias = db["estrategia_historico_novo"]
        
        # Buscar todas as estratégias
        all_strategies = list(estrategias.find().sort("timestamp", -1).limit(10))
        
        print(f"Encontradas {len(all_strategies)} estratégias recentes:")
        
        for idx, strategy in enumerate(all_strategies):
            # Converter ObjectId para string
            if "_id" in strategy:
                strategy["_id"] = str(strategy["_id"])
                
            # Formatar timestamp
            if "timestamp" in strategy:
                strategy["timestamp"] = str(strategy["timestamp"])
                
            print(f"\n--- Estratégia {idx+1} ---")
            print(f"Roleta: {strategy.get('roleta_nome')}")
            print(f"Estado: {strategy.get('estado')}")
            print(f"Número gatilho: {strategy.get('numero_gatilho')}")
            print(f"Terminais: {strategy.get('terminais_gatilho')}")
            
            # Verificar se o campo sugestao_display está presente
            if "sugestao_display" not in strategy:
                print("ERRO: Campo 'sugestao_display' não encontrado!")
                
                # Gerar sugestão de exibição
                estado = strategy.get("estado", "")
                terminais = strategy.get("terminais_gatilho", [])
                
                try:
                    sugestao = generate_display_suggestion(estado, terminais)
                    print(f"Sugestão gerada: {sugestao}")
                    
                    # Atualizar o documento com a sugestão
                    result = estrategias.update_one(
                        {"_id": strategy["_id"]},
                        {"$set": {"sugestao_display": sugestao}}
                    )
                    
                    if result.modified_count > 0:
                        print("Documento atualizado com sugestão de exibição!")
                    else:
                        print("Falha ao atualizar documento.")
                except Exception as e:
                    print(f"Erro ao gerar sugestão: {str(e)}")
            else:
                print(f"Sugestão de exibição: {strategy.get('sugestao_display')}")
        
        print("\nVerificando WebSocket Server...")
        print("1. Certifique-se de que o WebSocket Server está enviando o campo 'sugestao_display'")
        print("2. Verifique se o fronted está exibindo o campo 'strategyDisplay' no componente")
        
        # Forçar atualização de todas as estratégias com sugestao_display
        print("\nAtualizando todas as estratégias com sugestao_display...")
        
        count = 0
        for strategy in estrategias.find():
            if "estado" in strategy and "terminais_gatilho" in strategy:
                estado = strategy.get("estado", "")
                terminais = strategy.get("terminais_gatilho", [])
                
                try:
                    sugestao = generate_display_suggestion(estado, terminais)
                    
                    result = estrategias.update_one(
                        {"_id": strategy["_id"]},
                        {"$set": {"sugestao_display": sugestao}}
                    )
                    
                    if result.modified_count > 0:
                        count += 1
                except Exception:
                    pass
        
        print(f"Atualizadas {count} estratégias com sugestao_display")
    
    except Exception as e:
        print(f"Erro ao depurar exibição de estratégia: {str(e)}")

if __name__ == "__main__":
    debug_strategy_display() 