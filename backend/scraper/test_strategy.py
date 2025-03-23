#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para testar a integração do analisador de estratégia
"""

import sys
import time
import random
from datetime import datetime
from data_source_mongo import MongoDataSource
from strategy_analyzer import StrategyAnalyzer
from run_real_scraper import process_new_number

def test_strategy_integration():
    """
    Testa a integração do analisador de estratégia com o MongoDB
    """
    print("Iniciando teste de integração do analisador de estratégia...")
    
    # Conectar ao MongoDB
    try:
        db = MongoDataSource()
        print("Conexão ao MongoDB estabelecida com sucesso")
    except Exception as e:
        print(f"Erro ao conectar ao MongoDB: {str(e)}")
        sys.exit(1)
    
    # Criar uma roleta de teste
    roleta_id = "test-strategy-roleta"
    roleta_nome = "Roleta de Teste Estratégia"
    
    # Garantir que a roleta existe
    db.garantir_roleta_existe(roleta_id, roleta_nome)
    
    # Criar um analisador de estratégia
    analyzer = StrategyAnalyzer(titulo_roleta=roleta_nome)
    
    # Gerar e processar números aleatórios
    print(f"Gerando e processando números para a roleta {roleta_nome}...")
    
    for i in range(30):
        # Gerar um número aleatório (0-36)
        numero = random.randint(0, 36)
        
        # Processar o número
        print(f"Processando número {numero} ({i+1}/30)...")
        
        # Inserir o número no MongoDB
        db.inserir_numero(
            roleta_id=roleta_id,
            roleta_nome=roleta_nome,
            numero=numero,
            cor="vermelho" if numero % 2 == 1 else "preto",
            timestamp=datetime.now().isoformat()
        )
        
        # Processar o número com o analisador de estratégia
        status = process_new_number(db, roleta_id, roleta_nome, numero)
        
        if status:
            print(f"Estado da estratégia: {status['estado']}")
            print(f"Número gatilho: {status['numero_gatilho']}")
            print(f"Terminais: {status['terminais_gatilho'][:3] if status['terminais_gatilho'] else []}")
            print(f"Vitórias/Derrotas: {status['vitorias']}/{status['derrotas']}")
        
        # Aguardar um pouco para simular tempo real
        time.sleep(1)
    
    print("Teste de integração concluído com sucesso!")

if __name__ == "__main__":
    test_strategy_integration() 