#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para executar diretamente o scraper_mongodb.py
"""

import sys
import time
from data_source_mongo import MongoDataSource
from scraper_mongodb import scrape_roletas

def main():
    """Executar o scraper diretamente"""
    print("Iniciando scraper direto para 888 Casino...")
    print("URL: https://es.888casino.com/live-casino/#filters=live-roulette")
    
    try:
        # Inicializar a fonte de dados MongoDB
        print("Conectando ao MongoDB...")
        db = MongoDataSource()
        print("Conexão ao MongoDB estabelecida com sucesso")
        
        # Iniciar o scraper real (não o simulador)
        print("Iniciando o scraper em modo real...")
        scrape_roletas(db)
        
    except KeyboardInterrupt:
        print("Scraper interrompido pelo usuário")
    except Exception as e:
        print(f"Erro ao executar o scraper: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 