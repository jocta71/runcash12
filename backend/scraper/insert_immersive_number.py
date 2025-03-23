#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para inserir um número para a Immersive Roulette
"""

import pymongo
from datetime import datetime
from config import MONGODB_URI
import time
from data_source_mongo import MongoDataSource

def insert_immersive_number():
    try:
        # Conectar ao MongoDB
        client = pymongo.MongoClient(MONGODB_URI)
        db = client.get_default_database()
        
        # Criar fonte de dados MongoDB
        db_source = MongoDataSource()
        
        # ID e nome para Immersive Roulette
        roleta_id = "immersive_roulette_id"
        roleta_nome = "Immersive Roulette"
        
        # Garantir que a roleta existe
        db_source.garantir_roleta_existe(roleta_id, roleta_nome)
        
        # Número para inserir
        numero = 33
        cor = "preto"  # Cor do número 33
        
        # Inserir o número
        timestamp = datetime.now().isoformat()
        db_source.inserir_numero(roleta_id, roleta_nome, numero, cor, timestamp)
        
        print(f"Número {numero} inserido para {roleta_nome}")
        print("Aguardando processamento...")
        
        # Aguardar para o processamento acontecer
        time.sleep(2)
        
        # Verificar a estratégia atualizada
        estrategias = db["estrategia_historico_novo"]
        estrategia = estrategias.find_one({"roleta_id": roleta_id})
        
        if estrategia:
            print(f"\nEstratégia atual após inserção do número:")
            print(f"Estado: {estrategia.get('estado')}")
            print(f"Número gatilho: {estrategia.get('numero_gatilho')}")
            print(f"Terminais: {estrategia.get('terminais_gatilho')}")
            print(f"Vitórias/Derrotas: {estrategia.get('vitorias')}/{estrategia.get('derrotas')}")
        else:
            print("Estratégia não encontrada após inserção do número")
        
        print("\nVerifique o cartão de roleta no frontend para ver se os dados foram atualizados.")
    
    except Exception as e:
        print(f"Erro ao inserir número para Immersive Roulette: {str(e)}")

if __name__ == "__main__":
    insert_immersive_number() 