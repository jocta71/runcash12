#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para testar a integração da estratégia com o WebSocket
"""

import sys
import time
import os
import random
from datetime import datetime
import uuid
import hashlib

# Importar a classe MongoDataSource
from data_source_mongo import MongoDataSource
from strategy_analyzer import StrategyAnalyzer, State

def main():
    """
    Função principal
    """
    print("Iniciando teste de integração da estratégia com o WebSocket...")
    
    # Criar uma instância da fonte de dados MongoDB
    try:
        mongo_ds = MongoDataSource()
        print("Conexão ao MongoDB estabelecida com sucesso")
    except Exception as e:
        print(f"Erro ao conectar ao MongoDB: {str(e)}")
        return 1
    
    # Criar uma roleta de teste
    roleta_nome = "Roleta de Teste WebSocket"
    roleta_id_hash = hashlib.md5(roleta_nome.encode()).hexdigest()
    roleta_id = str(uuid.UUID(roleta_id_hash))
    
    # Garantir que a roleta existe
    mongo_ds.garantir_roleta_existe(roleta_id, roleta_nome)
    print(f"Roleta de teste criada: {roleta_nome} (ID: {roleta_id})")
    
    # Criar uma instância do analisador de estratégia
    strategy = StrategyAnalyzer(titulo_roleta=roleta_nome)
    print("Analisador de estratégia criado")
    
    # Simular alguns números e atualizar a estratégia
    print("\nSimulando números e atualizando a estratégia...")
    
    # Ciclo de teste: gerar um gatilho e depois um terminal
    numeros_teste = [5, 15, 25, 35, 0, 32, 22, 12, 2]
    
    for i, numero in enumerate(numeros_teste):
        print(f"\nProcessando número {i+1}/{len(numeros_teste)}: {numero}")
        
        # Inserir o número na roleta
        mongo_ds.inserir_numero(roleta_id, roleta_nome, numero)
        print(f"Número {numero} inserido para a roleta {roleta_nome}")
        
        # Processar o número na estratégia
        strategy.process_number(numero)
        print(f"Número {numero} processado pela estratégia")
        
        # Obter o status atual da estratégia
        status = strategy.get_status()
        print(f"Estado atual: {status['estado']}")
        print(f"Vitórias: {status['vitorias']}, Derrotas: {status['derrotas']}")
        
        # Usar diretamente o método da MongoDataSource
        try:
            # Preparar dados para atualização
            atualizado = mongo_ds.atualizar_dados_estrategia(
                roleta_id=roleta_id,
                roleta_nome=str(roleta_nome),  # Garantir que seja string
                estado=str(status['estado']),  # Converter para string
                numero_gatilho=int(status['numero_gatilho']),
                numero_gatilho_anterior=int(status['numero_gatilho_anterior']),
                terminais_gatilho=list(status['terminais_gatilho']),  # Garantir que seja lista
                terminais_gatilho_anterior=list(status['terminais_gatilho_anterior']),
                vitorias=int(status['vitorias']),
                derrotas=int(status['derrotas']),
                ultimo_numero=int(numero)
            )
            
            if atualizado:
                print(f"Dados da estratégia atualizados no MongoDB com sucesso")
            else:
                print(f"Falha ao atualizar dados da estratégia no MongoDB")
                
        except Exception as e:
            print(f"ERRO ao atualizar dados da estratégia: {str(e)}")
        
        # Aguardar um pouco para simular o tempo real
        time.sleep(2)
    
    print("\nTeste de integração concluído com sucesso!")
    return 0

if __name__ == "__main__":
    sys.exit(main()) 