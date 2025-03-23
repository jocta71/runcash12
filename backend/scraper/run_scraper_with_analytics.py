#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para executar o scraper com integração de análise de estratégia
"""

import sys
import time
import logging
import threading
from datetime import datetime

# Configurar logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Imports locais
from data_source_mongo import MongoDataSource
from scraper_mongodb import scrape_roletas
from integrated_simulator import simular_roletas
from run_real_scraper import process_new_number
from config import MODO_SIMULACAO

def main():
    """
    Função principal para executar o scraper integrado com análise de estratégia
    """
    print("Iniciando scraper com integração de análise de estratégia...")
    
    try:
        # Inicializar fonte de dados MongoDB
        db = MongoDataSource()
        print("Conexão ao MongoDB estabelecida com sucesso")
        
        # Hook para processar números da roleta
        def numero_hook(roleta_id, roleta_nome, numero):
            """
            Hook chamado quando um novo número é detectado pelo scraper
            """
            logger.info(f"Novo número detectado: {numero} para roleta {roleta_nome}")
            
            # Processar o número com o analisador de estratégia
            status = process_new_number(db, roleta_id, roleta_nome, numero)
            
            if status:
                logger.info(f"Estratégia atualizada: {status['estado']} - Vitórias: {status['vitorias']}, Derrotas: {status['derrotas']}")
            else:
                logger.error(f"Falha ao processar número {numero} para estratégia")
        
        # Verificar modo de simulação
        if MODO_SIMULACAO:
            print("Executando em modo de SIMULAÇÃO")
            
            # Iniciar simulação em thread separada
            sim_thread = threading.Thread(
                target=simular_roletas,
                args=(db, numero_hook),  # Passar o hook para processar números
                daemon=True
            )
            sim_thread.start()
            
            # Manter o script rodando
            try:
                while True:
                    # Verificar a cada 5 segundos
                    time.sleep(5)
                    print(f"Simulação executando... {datetime.now().strftime('%H:%M:%S')}")
            except KeyboardInterrupt:
                print("Simulação interrompida pelo usuário")
                return 0
                
        else:
            print("Executando em modo REAL - Acessando site da casa de apostas")
            
            # Executar o scraper real com o hook
            scrape_roletas(db, numero_hook=numero_hook)
            
        return 0
        
    except Exception as e:
        print(f"Erro ao executar scraper: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 