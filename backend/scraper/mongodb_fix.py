#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para diagnosticar e corrigir problemas de campo 'nome' nas roletas
"""

import sys
import time
import pymongo
import os
from datetime import datetime

def main():
    """
    Função principal
    """
    print("Iniciando diagnóstico e correção de campo 'nome' nas roletas...")
    
    # Conectar ao MongoDB
    mongodb_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/runcash')
    db_name = os.environ.get('MONGODB_DB_NAME', 'runcash')
    
    try:
        # Conectar ao MongoDB
        client = pymongo.MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        print(f"Conexão ao MongoDB estabelecida com sucesso: {db_name}")
        
        # Verificar a estrutura da coleção de roletas
        roletas_collection = db['roletas']
        roletas = list(roletas_collection.find({}))
        print(f"Total de roletas encontradas: {len(roletas)}")
        
        for i, roleta in enumerate(roletas):
            print(f"\nRoleta {i+1}/{len(roletas)}:")
            print(f"  ID: {roleta.get('_id')}")
            print(f"  Nome: {roleta.get('nome')}")
            print(f"  roleta_nome: {roleta.get('roleta_nome')}")
            print(f"  Estado estratégia: {roleta.get('estado_estrategia')}")
            
            # Corrigir o problema do campo 'nome'
            if 'nome' not in roleta and 'roleta_nome' in roleta:
                print(f"  Corrigindo campo 'nome' para '{roleta['roleta_nome']}'")
                roletas_collection.update_one(
                    {'_id': roleta['_id']},
                    {'$set': {'nome': roleta['roleta_nome']}}
                )
            elif 'nome' not in roleta and '_id' in roleta:
                nome_fallback = f"Roleta {roleta['_id']}"
                print(f"  Adicionando campo 'nome' fallback: '{nome_fallback}'")
                roletas_collection.update_one(
                    {'_id': roleta['_id']},
                    {'$set': {'nome': nome_fallback}}
                )
        
        # Examinar documentos de estratégia
        print("\nVerificando coleção de histórico de estratégia...")
        # Verificar se a coleção existe primeiro
        colecoes = db.list_collection_names()
        if 'estrategia_historico' in colecoes:
            print("Coleção estrategia_historico encontrada")
            historico_collection = db['estrategia_historico']
            historico = list(historico_collection.find({}).limit(10))
            print(f"Total de entradas de histórico encontradas (amostra): {len(historico)}")
            
            for i, entrada in enumerate(historico):
                print(f"\nHistórico {i+1}/{len(historico)}:")
                print(f"  Roleta ID: {entrada.get('roleta_id')}")
                print(f"  Roleta Nome: {entrada.get('roleta_nome')}")
                print(f"  Estado: {entrada.get('estado_estrategia')}")
        else:
            print("Coleção de histórico de estratégia não encontrada")
            print("Criando coleção estrategia_historico...")
            db.create_collection('estrategia_historico')
            print("Coleção estrategia_historico criada com sucesso")
        
        print("\nDiagnóstico e correção concluídos com sucesso!")
        
    except Exception as e:
        print(f"Erro ao conectar ou processar MongoDB: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 