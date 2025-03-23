#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para diagnóstico detalhado da estrutura dos documentos no MongoDB
"""

import sys
import os
import pymongo
import json
from datetime import datetime
from bson import ObjectId

# Para permitir a serialização de ObjectId e datetime
class MongoEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (ObjectId, datetime)):
            return str(obj)
        return super(MongoEncoder, self).default(obj)

def print_type_info(value, depth=1):
    """Imprime informações detalhadas sobre o tipo de um valor"""
    indent = "  " * depth
    
    if value is None:
        print(f"{indent}Valor: None (NoneType)")
    elif isinstance(value, dict):
        print(f"{indent}Tipo: dict com {len(value)} elementos")
        for k, v in list(value.items())[:3]:  # Limitamos a 3 itens para não sobrecarregar
            print(f"{indent}Chave: {k}")
            print_type_info(v, depth + 1)
        if len(value) > 3:
            print(f"{indent}... e {len(value) - 3} mais elementos")
    elif isinstance(value, list):
        print(f"{indent}Tipo: list com {len(value)} elementos")
        if value:
            for i, item in enumerate(value[:3]):  # Limitamos a 3 itens
                print(f"{indent}[{i}]:")
                print_type_info(item, depth + 1)
            if len(value) > 3:
                print(f"{indent}... e {len(value) - 3} mais elementos")
    else:
        print(f"{indent}Tipo: {type(value).__name__}")
        print(f"{indent}Valor: {value}")

def diagnose_mongo_collections():
    """
    Analisa detalhadamente as coleções do MongoDB
    """
    print("Iniciando diagnóstico profundo do MongoDB...")
    
    # Conectar ao MongoDB
    mongodb_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/runcash')
    db_name = os.environ.get('MONGODB_DB_NAME', 'runcash')
    
    try:
        # Conectar ao MongoDB
        client = pymongo.MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        print(f"Conexão ao MongoDB estabelecida com sucesso: {db_name}")
        
        # Listar todas as coleções
        collections = db.list_collection_names()
        print(f"Coleções no banco de dados: {collections}")
        
        # Analisar a coleção de roletas
        print("\n==== DIAGNÓSTICO DA COLEÇÃO 'roletas' ====")
        roletas_collection = db['roletas']
        roletas = list(roletas_collection.find({}))
        print(f"Total de roletas: {len(roletas)}")
        
        for i, roleta in enumerate(roletas):
            print(f"\n--- Roleta {i+1}/{len(roletas)} ---")
            print(f"ID: {roleta.get('_id')}")
            
            # Analisar cada campo da roleta
            for field_name, field_value in roleta.items():
                print(f"\nCampo: '{field_name}'")
                print_type_info(field_value)
                
            print("\nJSON completo do documento:")
            print(json.dumps(roleta, indent=2, cls=MongoEncoder))
        
        # Analisar a coleção de histórico de estratégia
        if 'estrategia_historico' in collections:
            print("\n==== DIAGNÓSTICO DA COLEÇÃO 'estrategia_historico' ====")
            historico_collection = db['estrategia_historico']
            historico = list(historico_collection.find({}))
            print(f"Total de entradas de histórico: {len(historico)}")
            
            for i, entrada in enumerate(historico[:3]):  # Limitamos a 3 para não sobrecarregar
                print(f"\n--- Histórico {i+1}/{len(historico)} ---")
                print(f"ID: {entrada.get('_id')}")
                
                # Analisar cada campo do histórico
                for field_name, field_value in entrada.items():
                    print(f"\nCampo: '{field_name}'")
                    print_type_info(field_value)
                
                print("\nJSON completo do documento:")
                print(json.dumps(entrada, indent=2, cls=MongoEncoder))
            
            if len(historico) > 3:
                print(f"\n... e {len(historico) - 3} mais entradas de histórico")
        else:
            print("\nColeção 'estrategia_historico' não encontrada")
        
        print("\nDiagnóstico profundo concluído com sucesso!")
        return 0
        
    except Exception as e:
        print(f"Erro ao analisar MongoDB: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(diagnose_mongo_collections()) 