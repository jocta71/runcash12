#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para testar a integração da estratégia com o MongoDB usando a função auxiliar
"""

import sys
import time
import os
import random
from datetime import datetime
import uuid
import hashlib

# Importar a classe MongoDataSource e a nova função auxiliar
from data_source_mongo import MongoDataSource
from strategy_analyzer import StrategyAnalyzer, State
from strategy_helper import atualizar_estrategia

def main():
    """
    Função principal
    """
    print("Iniciando teste direto de estratégia com o MongoDB...")
    
    # Criar uma instância da fonte de dados MongoDB
    try:
        mongo_ds = MongoDataSource()
        print("Conexão ao MongoDB estabelecida com sucesso")
    except Exception as e:
        print(f"Erro ao conectar ao MongoDB: {str(e)}")
        return 1
    
    # Criar uma roleta de teste
    roleta_nome = "Roleta de Teste Direto"
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
        
        # Usar a nova função auxiliar para atualizar dados
        sucesso = atualizar_estrategia(
            roleta_id=roleta_id,
            roleta_nome=roleta_nome,
            estado=status['estado'],
            numero_gatilho=status['numero_gatilho'],
            terminais_gatilho=status['terminais_gatilho'],
            vitorias=status['vitorias'],
            derrotas=status['derrotas']
        )
        
        if sucesso:
            print(f"Dados da estratégia atualizados com sucesso")
        else:
            print(f"Falha ao atualizar dados da estratégia")
        
        # Aguardar um pouco para simular o tempo real
        time.sleep(1)
    
    print("\nTeste direto concluído com sucesso!")
    return 0

if __name__ == "__main__":
    sys.exit(main()) 