#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para reiniciar todas as estratégias para o estado NEUTRAL
"""

import sys
import logging
from pymongo import MongoClient
from datetime import datetime

# Configurar logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Conectar ao MongoDB
def reset_strategies():
    """Reinicia todas as estratégias para estado NEUTRAL"""
    try:
        # Conectar ao MongoDB
        client = MongoClient('mongodb://localhost:27017/runcash')
        db = client.runcash
        
        # Coleções a serem atualizadas
        collections = [
            db.estrategias,
            db.estrategia_historico,
            db.estrategia_historico_novo
        ]
        
        # Reiniciar cada coleção
        for collection in collections:
            result = collection.update_many(
                {}, 
                {
                    "$set": {
                        "estado": "NEUTRAL",
                        "numero_gatilho": None,
                        "terminais_gatilho": [],
                        "ultima_atualizacao": datetime.now().isoformat()
                    }
                }
            )
            logger.info(f"Coleção {collection.name}: {result.modified_count} estratégias reiniciadas")
            
        # Criar um histórico para cada roleta
        roletas = db.roletas.find({})
        timestamp = datetime.now().isoformat()
        
        for roleta in roletas:
            db.estrategia_historico_novo.insert_one({
                "roleta_id": roleta.get("_id") or roleta.get("id"),
                "roleta_nome": roleta.get("nome"),
                "estado": "NEUTRAL",
                "numero_gatilho": None,
                "terminais_gatilho": [],
                "timestamp": timestamp,
                "vitorias": 0,
                "derrotas": 0
            })
            logger.info(f"Nova entrada adicionada para roleta: {roleta.get('nome')}")
        
        logger.info("Todas as estratégias foram reiniciadas com sucesso!")
        return True
    
    except Exception as e:
        logger.error(f"Erro ao reiniciar estratégias: {str(e)}")
        return False

if __name__ == "__main__":
    if reset_strategies():
        sys.exit(0)
    else:
        sys.exit(1) 