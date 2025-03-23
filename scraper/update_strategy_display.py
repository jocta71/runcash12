#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para atualizar diretamente as coleções do MongoDB com 
diferentes estados de estratégia para exibição no frontend
"""

import sys
import logging
from pymongo import MongoClient, UpdateOne
from datetime import datetime
import random

# Configurar logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Estados possíveis
ESTADOS = ["NEUTRAL", "TRIGGER", "POST_GALE_NEUTRAL", "MORTO"]

def update_mongodb_collections():
    """Atualiza diretamente as coleções do MongoDB com estados variados"""
    try:
        # Conectar ao MongoDB
        client = MongoClient('mongodb://localhost:27017/runcash')
        db = client.runcash
        
        # Obter todas as roletas
        roletas = list(db.roletas.find({}))
        
        # Lista de atualizações para executar em lote
        updates_roletas = []
        updates_hist = []
        
        # Para cada roleta, associar um estado diferente
        for i, roleta in enumerate(roletas):
            roleta_id = roleta.get("_id") or roleta.get("id")
            roleta_nome = roleta.get("nome")
            
            if not roleta_id or not roleta_nome:
                continue
                
            # Distribuir os estados de forma cíclica
            estado = ESTADOS[i % len(ESTADOS)]
            
            # Definir terminais de acordo com o estado
            terminais = []
            num_gatilho = None
            
            if estado == "TRIGGER" or estado == "POST_GALE_NEUTRAL":
                num_gatilho = random.randint(1, 36)
                terminais = [1, 2, 3]  # Terminais simples para teste
                
            # Definir vitórias e derrotas
            vitorias = random.randint(1, 5)
            derrotas = random.randint(0, 3)
            
            # Timestamp atual
            timestamp = datetime.now().isoformat()
            
            # Atualização para a coleção roletas
            updates_roletas.append(
                UpdateOne(
                    {"_id": roleta_id},
                    {"$set": {
                        "estado_estrategia": estado,
                        "numero_gatilho": num_gatilho,
                        "terminais_gatilho": terminais,
                        "vitorias": vitorias,
                        "derrotas": derrotas,
                        "updated_at": timestamp
                    }}
                )
            )
            
            # Atualização para a coleção de histórico
            updates_hist.append({
                "roleta_id": roleta_id,
                "roleta_nome": roleta_nome,
                "estado": estado,
                "numero_gatilho": num_gatilho,
                "terminais_gatilho": terminais,
                "timestamp": timestamp,
                "vitorias": vitorias,
                "derrotas": derrotas
            })
            
            logger.info(f"Roleta {roleta_nome} será atualizada para estado {estado} com {vitorias}W/{derrotas}L")
            
        # Executar atualizações em lote para a coleção roletas
        if updates_roletas:
            result = db.roletas.bulk_write(updates_roletas)
            logger.info(f"Atualizadas {result.modified_count} roletas")
            
        # Limpar e reinserir na coleção de histórico
        if updates_hist:
            # Remover todos os registros existentes
            db.estrategia_historico_novo.delete_many({})
            # Inserir novos registros
            result = db.estrategia_historico_novo.insert_many(updates_hist)
            logger.info(f"Inseridos {len(result.inserted_ids)} registros de histórico")
            
        # Verificar se as últimas atualizações foram feitas
        last_updates = list(db.estrategia_historico_novo.find().sort("timestamp", -1).limit(5))
        for update in last_updates:
            logger.info(f"Último registro: {update.get('roleta_nome')} - Estado: {update.get('estado')} - V/D: {update.get('vitorias')}/{update.get('derrotas')}")
            
        # Verificar a coleção 'estrategias' também (se existir)
        if db.estrategias.count_documents({}) > 0:
            estrategias_updates = []
            for roleta in roletas:
                roleta_id = roleta.get("_id") or roleta.get("id")
                if not roleta_id:
                    continue
                    
                # Estado aleatório para variedade
                estado = random.choice(ESTADOS)
                
                estrategias_updates.append(
                    UpdateOne(
                        {"roleta_id": roleta_id},
                        {"$set": {
                            "estado": estado,
                            "timestamp": datetime.now().isoformat()
                        }},
                        upsert=True
                    )
                )
                
            if estrategias_updates:
                result = db.estrategias.bulk_write(estrategias_updates)
                logger.info(f"Atualizados {result.modified_count} registros na coleção 'estrategias'")
                
        return True
        
    except Exception as e:
        logger.error(f"Erro ao atualizar MongoDB: {str(e)}")
        return False

if __name__ == "__main__":
    if update_mongodb_collections():
        logger.info("Atualização concluída com sucesso")
        sys.exit(0)
    else:
        logger.error("Falha na atualização")
        sys.exit(1) 