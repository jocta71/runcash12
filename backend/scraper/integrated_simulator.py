#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Simulador integrado de dados de roleta
"""

import sys
import time
import random
import logging
import threading
from datetime import datetime
import uuid
import hashlib

# Configurar logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def simular_roletas(db, numero_hook=None):
    """
    Simula dados de roleta e os salva no MongoDB
    
    Args:
        db: Instância de MongoDataSource
        numero_hook: Função opcional para processar números (roleta_id, roleta_nome, numero)
    """
    logger.info("Iniciando simulação de dados de roleta...")
    
    # Definir roletas simuladas
    roletas_simuladas = [
        {"id": "sim-roleta-1", "nome": "Roleta Simulada 1"},
        {"id": "sim-roleta-2", "nome": "Roleta Simulada 2"},
        {"id": "sim-roleta-3", "nome": "Roleta Simulada 3"}
    ]
    
    # Garantir que as roletas existam no banco de dados
    for roleta in roletas_simuladas:
        roleta_id_hash = hashlib.md5(roleta["id"].encode()).hexdigest()
        roleta_id = str(uuid.UUID(roleta_id_hash))
        roleta["db_id"] = db.garantir_roleta_existe(roleta["id"], roleta["nome"])
        logger.info(f"Roleta simulada registrada: {roleta['nome']} (ID: {roleta['db_id']})")
    
    # Números possíveis da roleta europeia
    numeros_possiveis = list(range(0, 37))  # 0-36
    
    try:
        while True:
            # Selecionar uma roleta aleatória para gerar um número
            roleta = random.choice(roletas_simuladas)
            
            # Gerar um número aleatório
            numero = random.choice(numeros_possiveis)
            
            # Determinar a cor
            if numero == 0:
                cor = "verde"
            elif numero in [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]:
                cor = "vermelho"
            else:
                cor = "preto"
            
            # Salvar o número no MongoDB
            logger.info(f"Simulando número {numero} ({cor}) para {roleta['nome']}")
            timestamp = datetime.now().isoformat()
            
            # Inserir no MongoDB
            db.inserir_numero(
                roleta_id=roleta["db_id"], 
                roleta_nome=roleta["nome"], 
                numero=numero,
                cor=cor,
                timestamp=timestamp
            )
            
            # Chamar o hook se fornecido
            if numero_hook:
                try:
                    numero_hook(roleta["db_id"], roleta["nome"], numero)
                except Exception as e:
                    logger.error(f"Erro ao executar hook: {str(e)}")
            
            # Aguardar um período aleatório (2-5 segundos)
            tempo_espera = random.uniform(2, 5)
            time.sleep(tempo_espera)
            
    except KeyboardInterrupt:
        logger.info("Simulação interrompida pelo usuário")
    except Exception as e:
        logger.error(f"Erro na simulação: {str(e)}")

if __name__ == "__main__":
    # Apenas para testes
    from data_source_mongo import MongoDataSource
    db = MongoDataSource()
    simular_roletas(db) 