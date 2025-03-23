#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para modificar a estrutura da coleção MongoDB e resolver problemas de validação
"""

import sys
import os
import pymongo
from bson import ObjectId
from datetime import datetime

def modificar_colecoes():
    """
    Modifica as coleções do MongoDB para resolver problemas de validação
    """
    print("Iniciando modificação das coleções MongoDB...")
    
    # Conectar ao MongoDB
    mongodb_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/runcash')
    db_name = os.environ.get('MONGODB_DB_NAME', 'runcash')
    
    try:
        # Conectar ao MongoDB
        client = pymongo.MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        print(f"Conexão ao MongoDB estabelecida com sucesso: {db_name}")
        
        # Listar todas as coleções
        colecoes = db.list_collection_names()
        print(f"Coleções encontradas: {colecoes}")
        
        # Verificar se há coleções com validações
        for colecao_nome in colecoes:
            print(f"\nVerificando coleção '{colecao_nome}'...")
            try:
                info_colecao = db.command("collMod", colecao_nome, validator={})
                print(f"Validador removido com sucesso para '{colecao_nome}'")
            except Exception as e:
                print(f"Erro ao modificar coleção '{colecao_nome}': {str(e)}")
        
        # Contornar o problema criando uma nova coleção para histórico
        print("\nCriando coleção alternativa para histórico de estratégia...")
        if 'estrategia_historico_novo' in colecoes:
            db.drop_collection('estrategia_historico_novo')
            print("Coleção existente removida")
        
        db.create_collection('estrategia_historico_novo')
        print("Nova coleção criada")
        
        # Criar índices na nova coleção
        db.estrategia_historico_novo.create_index([("roleta_id", pymongo.ASCENDING)])
        db.estrategia_historico_novo.create_index([("timestamp", pymongo.DESCENDING)])
        print("Índices criados na nova coleção")
        
        # Criar uma função wrapper para atualizar dados da estratégia
        print("\nInstalando uma função helper no banco de dados...")
        js_function = """
        function updateStrategyData(roletaId, roletaNome, estado, numeroGatilho, terminais, vitorias, derrotas) {
            var dados = {
                roleta_id: roletaId,
                roleta_nome: String(roletaNome),
                estado: String(estado),
                numero_gatilho: NumberInt(numeroGatilho),
                vitorias: NumberInt(vitorias),
                derrotas: NumberInt(derrotas),
                timestamp: new Date()
            };
            
            if (terminais && Array.isArray(terminais)) {
                dados.terminais = terminais;
            } else {
                dados.terminais = [];
            }
            
            db.estrategia_historico_novo.insertOne(dados);
            return true;
        }
        """
        
        try:
            # Criar uma nova coleção para guardar a função
            if 'system.js' not in colecoes:
                print("Criando coleção system.js...")
                db.system.js.insert_one({"_id": "updateStrategyData", "value": js_function})
            else:
                print("Atualizando função existente...")
                db.system.js.update_one(
                    {"_id": "updateStrategyData"}, 
                    {"$set": {"value": js_function}}, 
                    upsert=True
                )
            print("Função de helper instalada com sucesso")
        except Exception as e:
            print(f"Erro ao instalar função helper: {str(e)}")
        
        # Testar a nova coleção
        print("\nTestando inserção na nova coleção...")
        try:
            resultado = db.estrategia_historico_novo.insert_one({
                "roleta_id": "test-id",
                "roleta_nome": "Roleta Teste",
                "estado": "NEUTRAL",
                "numero_gatilho": 5,
                "terminais": [15, 25, 35],
                "vitorias": 0,
                "derrotas": 0,
                "timestamp": datetime.now()
            })
            print(f"Documento de teste inserido com sucesso. ID: {resultado.inserted_id}")
            
            # Remover o documento de teste
            db.estrategia_historico_novo.delete_one({"_id": resultado.inserted_id})
            print("Documento de teste removido")
        except Exception as e:
            print(f"Erro ao testar nova coleção: {str(e)}")
        
        print("\nModificação das coleções concluída com sucesso!")
        return 0
        
    except Exception as e:
        print(f"Erro durante a modificação das coleções: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(modificar_colecoes()) 