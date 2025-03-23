#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para corrigir o problema com o campo nome nas coleções do MongoDB
"""

import sys
import os
import pymongo
from datetime import datetime

def main():
    """
    Função principal
    """
    print("Iniciando correção de campos no MongoDB...")
    
    # Conectar ao MongoDB
    mongodb_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/runcash')
    db_name = os.environ.get('MONGODB_DB_NAME', 'runcash')
    
    try:
        # Conectar ao MongoDB
        client = pymongo.MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        print(f"Conexão ao MongoDB estabelecida com sucesso: {db_name}")
        
        # Corrigir a coleção de roletas
        print("\nCorrigindo coleção de roletas...")
        roletas_collection = db['roletas']
        roletas = list(roletas_collection.find({}))
        print(f"Total de roletas encontradas: {len(roletas)}")
        
        for i, roleta in enumerate(roletas):
            print(f"\nRoleta {i+1}/{len(roletas)}:")
            print(f"  ID: {roleta.get('_id')}")
            
            # Garantir que o campo nome seja uma string
            nome_atual = roleta.get('nome')
            if nome_atual is None:
                nome_novo = f"Roleta {roleta.get('_id')}"
                print(f"  Campo 'nome' não encontrado, definindo como: '{nome_novo}'")
                roletas_collection.update_one(
                    {'_id': roleta.get('_id')},
                    {'$set': {'nome': nome_novo}}
                )
            elif not isinstance(nome_atual, str):
                nome_novo = str(nome_atual) if nome_atual is not None else f"Roleta {roleta.get('_id')}"
                print(f"  Campo 'nome' não é string, convertendo de {type(nome_atual)} para: '{nome_novo}'")
                roletas_collection.update_one(
                    {'_id': roleta.get('_id')},
                    {'$set': {'nome': nome_novo}}
                )
            else:
                print(f"  Nome: {nome_atual} (OK)")
        
        # Verificar se a coleção estrategia_historico existe
        print("\nVerificando coleção de histórico de estratégia...")
        colecoes = db.list_collection_names()
        if 'estrategia_historico' not in colecoes:
            print("Coleção estrategia_historico não encontrada, criando...")
            db.create_collection('estrategia_historico')
            print("Coleção estrategia_historico criada com sucesso")
        else:
            print("Coleção estrategia_historico já existe")
            
            # Corrigir documentos na coleção de histórico
            historico_collection = db['estrategia_historico']
            historico = list(historico_collection.find({}))
            print(f"Total de documentos de histórico: {len(historico)}")
            
            for i, doc in enumerate(historico):
                if i < 5:  # Mostrar apenas os 5 primeiros para não sobrecarregar o console
                    print(f"\nHistórico {i+1}/{len(historico)}:")
                    print(f"  ID: {doc.get('_id')}")
                    print(f"  Roleta ID: {doc.get('roleta_id')}")
                    print(f"  Roleta Nome: {doc.get('roleta_nome')}")
                
                # Corrigir campo roleta_nome se necessário
                roleta_nome = doc.get('roleta_nome')
                if roleta_nome is None or not isinstance(roleta_nome, str):
                    roleta_nome_novo = str(roleta_nome) if roleta_nome is not None else "Roleta Desconhecida"
                    historico_collection.update_one(
                        {'_id': doc.get('_id')},
                        {'$set': {'roleta_nome': roleta_nome_novo}}
                    )
                    if i < 5:
                        print(f"  Corrigido campo 'roleta_nome' para: '{roleta_nome_novo}'")
        
        print("\nCorreção de campos concluída com sucesso!")
        return 0
        
    except Exception as e:
        print(f"Erro ao conectar ou processar MongoDB: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 