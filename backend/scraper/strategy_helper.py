#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Funções auxiliares para a integração da estratégia com o MongoDB
"""

import os
import logging
import pymongo
from datetime import datetime
import json
from typing import List, Dict, Any, Optional

# Configurar logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def atualizar_estrategia(
    roleta_id: str, 
    roleta_nome: str, 
    estado: str, 
    numero_gatilho: int,
    terminais_gatilho: List[int],
    vitorias: int,
    derrotas: int
) -> bool:
    """
    Função simplificada para atualizar dados de estratégia no MongoDB
    
    Args:
        roleta_id: ID da roleta (string)
        roleta_nome: Nome da roleta (string)
        estado: Estado atual da estratégia (string)
        numero_gatilho: Número gatilho (int)
        terminais_gatilho: Lista de terminais (list)
        vitorias: Contagem de vitórias (int)
        derrotas: Contagem de derrotas (int)
        
    Returns:
        bool: True se atualizado com sucesso, False caso contrário
    """
    try:
        # Conectar ao MongoDB
        mongodb_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/runcash')
        db_name = os.environ.get('MONGODB_DB_NAME', 'runcash')
        
        client = pymongo.MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        
        # Garantir que os tipos de dados estão corretos
        roleta_nome_str = str(roleta_nome) if roleta_nome is not None else "Roleta Desconhecida"
        estado_str = str(estado) if estado is not None else "NEUTRAL"
        numero_gatilho_int = int(numero_gatilho) if numero_gatilho is not None else -1
        terminais_list = list(terminais_gatilho) if terminais_gatilho is not None else []
        vitorias_int = int(vitorias) if vitorias is not None else 0
        derrotas_int = int(derrotas) if derrotas is not None else 0
        
        # Criar documento para atualização na coleção roletas
        dados_roleta = {
            'estado_estrategia': estado_str,
            'numero_gatilho': numero_gatilho_int,
            'terminais_gatilho': terminais_list,
            'vitorias': vitorias_int,
            'derrotas': derrotas_int,
            'updated_at': datetime.now().isoformat(),
            'nome': roleta_nome_str
        }
        
        # Atualizar a coleção de roletas (principal)
        logger.info(f"Atualizando roleta {roleta_nome_str} (ID: {roleta_id}) com estado: {estado_str}")
        resultado_roleta = db.roletas.update_one(
            {'_id': roleta_id},
            {'$set': dados_roleta},
            upsert=True
        )
        
        # Criar documento para coleção de histórico
        dados_historico = {
            'roleta_id': roleta_id,
            'roleta_nome': roleta_nome_str,
            'estado_estrategia': estado_str,
            'numero_gatilho': numero_gatilho_int,
            'terminais_gatilho': terminais_list,
            'vitorias': vitorias_int,
            'derrotas': derrotas_int,
            'timestamp': datetime.now().isoformat()
        }
        
        # Inserir na coleção de histórico nova (que criamos sem validação)
        logger.info(f"Salvando histórico para roleta {roleta_nome_str}")
        resultado_historico = db.estrategia_historico_novo.insert_one(dados_historico)
        
        return bool(resultado_roleta.acknowledged)
    
    except Exception as e:
        logger.error(f"Erro ao atualizar estratégia: {str(e)}")
        return False 