#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para depurar problemas de esquema no MongoDB
"""

import sys
import os
import pymongo
from datetime import datetime
import uuid
import hashlib

def debug_mongo_schema():
    """
    Script para depurar problemas de esquema no MongoDB
    """
    print("Iniciando depuração do esquema MongoDB...")
    
    # Conectar ao MongoDB
    mongodb_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/runcash')
    db_name = os.environ.get('MONGODB_DB_NAME', 'runcash')
    
    try:
        # Conectar ao MongoDB
        client = pymongo.MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        print(f"Conexão ao MongoDB estabelecida com sucesso: {db_name}")
        
        # Primeiro teste: inserir um documento simples na coleção de estratégia
        print("\nTESTE 1: Inserir documento com campo 'nome' string")
        historico_collection = db['estrategia_historico']
        
        doc_teste_1 = {
            "roleta_id": "test-id-1",
            "roleta_nome": "Roleta de Teste 1",
            "estado_estrategia": "NEUTRAL",
            "nome": "Roleta de Teste 1",  # Mesmo que roleta_nome
            "timestamp": datetime.now().isoformat()
        }
        
        try:
            resultado_1 = historico_collection.insert_one(doc_teste_1)
            print(f"Documento inserido com sucesso. ID: {resultado_1.inserted_id}")
        except Exception as e:
            print(f"ERRO ao inserir documento 1: {str(e)}")
        
        # Segundo teste: inserir um documento sem campo 'nome'
        print("\nTESTE 2: Inserir documento sem campo 'nome'")
        doc_teste_2 = {
            "roleta_id": "test-id-2",
            "roleta_nome": "Roleta de Teste 2",
            "estado_estrategia": "NEUTRAL",
            "timestamp": datetime.now().isoformat()
        }
        
        try:
            resultado_2 = historico_collection.insert_one(doc_teste_2)
            print(f"Documento inserido com sucesso. ID: {resultado_2.inserted_id}")
        except Exception as e:
            print(f"ERRO ao inserir documento 2: {str(e)}")
        
        # Terceiro teste: verificar restrições de coleção
        print("\nTESTE 3: Verificar validação de esquema")
        try:
            validacao = db.command("listCollections", filter={"name": "estrategia_historico"})
            colecao_info = list(validacao["cursor"]["firstBatch"])
            if colecao_info and "options" in colecao_info[0]:
                print(f"Opções da coleção: {colecao_info[0]['options']}")
                if "validator" in colecao_info[0]["options"]:
                    print(f"Regras de validação: {colecao_info[0]['options']['validator']}")
                else:
                    print("Coleção não tem regras de validação definidas")
            else:
                print("Não foi possível obter informações da coleção")
        except Exception as e:
            print(f"ERRO ao verificar validação: {str(e)}")
        
        # Teste final: verificar todas as coleções que podem ter validação
        print("\nTESTE 4: Verificar coleções com validação")
        try:
            collections = db.list_collection_names()
            for collection_name in collections:
                print(f"\nVerificando coleção: {collection_name}")
                collection_info = db.command("collMod", collection_name, validator={})
                print(f"Resultado: {collection_info}")
        except Exception as e:
            print(f"ERRO ao verificar coleções: {str(e)}")
        
        # Remover documentos de teste
        print("\nLimpando documentos de teste...")
        historico_collection.delete_many({"roleta_id": {"$in": ["test-id-1", "test-id-2"]}})
        
        print("\nDepuração concluída!")
        return 0
        
    except Exception as e:
        print(f"Erro durante depuração: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(debug_mongo_schema()) 