#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Módulo de configuração e utilitários para MongoDB
"""

import os
import logging
from datetime import datetime
from typing import Dict, Any, Tuple, Dict
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.collection import Collection
from pymongo.database import Database

from config import MONGODB_URI, MONGODB_DB_NAME, logger

def conectar_mongodb() -> Tuple[MongoClient, Database]:
    """
    Estabelece conexão com MongoDB
    
    Returns:
        Tuple[MongoClient, Database]: Cliente MongoDB e objeto de banco de dados
    """
    try:
        # Conectar ao MongoDB sem configuração de pool
        client = MongoClient(MONGODB_URI)
        db = client[MONGODB_DB_NAME]
        
        # Verificar conexão
        db.command('ping')
        logger.info(f"Conexão MongoDB estabelecida com sucesso: {MONGODB_URI}")
        
        return client, db
    except Exception as e:
        logger.error(f"Erro ao conectar ao MongoDB: {str(e)}")
        raise

def inicializar_colecoes() -> Dict[str, Collection]:
    """
    Inicializa as coleções do MongoDB e configura índices
    
    Returns:
        Dict[str, Collection]: Dicionário com as coleções
    """
    try:
        # Conectar ao MongoDB
        client, db = conectar_mongodb()
        
        # Inicializar dicionário de coleções
        colecoes = {}
        
        # Colecão "roletas"
        colecoes['roletas'] = db['roletas']
        
        # Criar índices para coleção "roletas" se não existirem
        if 'nome_1' not in colecoes['roletas'].index_information():
            colecoes['roletas'].create_index([('nome', ASCENDING)])
            logger.info("Índice 'nome' criado para coleção 'roletas'")
        
        # Coleção "roleta_numeros"
        colecoes['roleta_numeros'] = db['roleta_numeros']
        
        # Criar índices para coleção "roleta_numeros" se não existirem
        indices_numeros = colecoes['roleta_numeros'].index_information()
        
        if 'roleta_id_1_timestamp_-1' not in indices_numeros:
            colecoes['roleta_numeros'].create_index([
                ('roleta_id', ASCENDING), 
                ('timestamp', DESCENDING)
            ])
            logger.info("Índice 'roleta_id_timestamp' criado para coleção 'roleta_numeros'")
        
        if 'numero_1' not in indices_numeros:
            colecoes['roleta_numeros'].create_index([('numero', ASCENDING)])
            logger.info("Índice 'numero' criado para coleção 'roleta_numeros'")
        
        if 'cor_1' not in indices_numeros:
            colecoes['roleta_numeros'].create_index([('cor', ASCENDING)])
            logger.info("Índice 'cor' criado para coleção 'roleta_numeros'")
        
        # Coleção "roleta_estatisticas_diarias"
        colecoes['roleta_estatisticas_diarias'] = db['roleta_estatisticas_diarias']
        
        # Criar índices para coleção "roleta_estatisticas_diarias" se não existirem
        indices_estat = colecoes['roleta_estatisticas_diarias'].index_information()
        
        if 'roleta_id_1_data_1' not in indices_estat:
            colecoes['roleta_estatisticas_diarias'].create_index([
                ('roleta_id', ASCENDING), 
                ('data', ASCENDING)
            ], unique=True)
            logger.info("Índice 'roleta_id_data' criado para coleção 'roleta_estatisticas_diarias'")
        
        # Coleção "roleta_sequencias"
        colecoes['roleta_sequencias'] = db['roleta_sequencias']
        
        # Criar índices para coleção "roleta_sequencias" se não existirem
        indices_seq = colecoes['roleta_sequencias'].index_information()
        
        if 'roleta_id_1_tipo_1_comprimento_-1' not in indices_seq:
            colecoes['roleta_sequencias'].create_index([
                ('roleta_id', ASCENDING), 
                ('tipo', ASCENDING),
                ('comprimento', DESCENDING)
            ])
            logger.info("Índice 'roleta_id_tipo_comprimento' criado para coleção 'roleta_sequencias'")
        
        logger.info("Todas as coleções inicializadas com sucesso")
        return colecoes
    except Exception as e:
        logger.error(f"Erro ao inicializar coleções MongoDB: {str(e)}")
        raise

def roleta_para_documento(roleta_id: str, roleta_nome: str) -> Dict[str, Any]:
    """
    Converte dados de roleta para documento MongoDB
    
    Args:
        roleta_id (str): ID da roleta
        roleta_nome (str): Nome da roleta
        
    Returns:
        Dict[str, Any]: Documento formatado para MongoDB
    """
    agora = datetime.now()
    
    return {
        "_id": roleta_id,
        "nome": roleta_nome,
        "ativa": True,
        "criado_em": agora,
        "atualizado_em": agora
    }

def numero_para_documento(
    roleta_id: str, 
    roleta_nome: str, 
    numero: int, 
    cor: str = None,
    timestamp: str = None
) -> Dict[str, Any]:
    """
    Converte dados de número para documento MongoDB
    
    Args:
        roleta_id (str): ID da roleta
        roleta_nome (str): Nome da roleta
        numero (int): Número sorteado
        cor (str, optional): Cor do número. Defaults to None.
        timestamp (str, optional): Timestamp do evento. Defaults to None.
        
    Returns:
        Dict[str, Any]: Documento formatado para MongoDB
    """
    # Usar timestamp fornecido ou atual
    if timestamp is None or not timestamp:
        ts = datetime.now()
    else:
        # Tentar converter de string para datetime
        try:
            if isinstance(timestamp, str):
                ts = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            else:
                ts = timestamp
        except:
            ts = datetime.now()
    
    # Determinar cor se não fornecida
    if not cor:
        from scraper_core import determinar_cor_numero
        cor = determinar_cor_numero(numero)
    
    return {
        "roleta_id": roleta_id,
        "roleta_nome": roleta_nome,
        "numero": numero,
        "cor": cor,
        "timestamp": ts,
        "criado_em": datetime.now()
    }

def estatistica_diaria_para_documento(roleta_id: str, data: datetime, dados_estatisticos: dict) -> dict:
    """
    Converte estatísticas diárias para um documento MongoDB
    
    Args:
        roleta_id (str): ID da roleta
        data (datetime): Data da estatística
        dados_estatisticos (dict): Dados estatísticos (contagens, frequências, etc.)
        
    Returns:
        dict: Documento MongoDB para inserção
    """
    return {
        "roleta_id": roleta_id,
        "data": data.strftime("%Y-%m-%d"),
        "total_numeros": dados_estatisticos.get("total_numeros", 0),
        "numeros_vermelhos": dados_estatisticos.get("numeros_vermelhos", 0),
        "numeros_pretos": dados_estatisticos.get("numeros_pretos", 0),
        "zeros": dados_estatisticos.get("zeros", 0),
        "numeros_pares": dados_estatisticos.get("numeros_pares", 0),
        "numeros_impares": dados_estatisticos.get("numeros_impares", 0),
        "numero_mais_frequente": dados_estatisticos.get("numero_mais_frequente", 0),
        "frequencia_maxima": dados_estatisticos.get("frequencia_maxima", 0),
        "atualizado_em": datetime.now()
    }

def sequencia_para_documento(roleta_id: str, tipo: str, valor: str, 
                            comprimento: int, inicio: datetime, fim: datetime = None) -> dict:
    """
    Converte dados de sequência para um documento MongoDB
    
    Args:
        roleta_id (str): ID da roleta
        tipo (str): Tipo da sequência (cor, paridade, etc.)
        valor (str): Valor da sequência (vermelho, par, etc.)
        comprimento (int): Comprimento da sequência
        inicio (datetime): Timestamp de início
        fim (datetime, optional): Timestamp de fim. Defaults to None.
        
    Returns:
        dict: Documento MongoDB para inserção
    """
    documento = {
        "roleta_id": roleta_id,
        "tipo": tipo,
        "valor": valor,
        "comprimento": comprimento,
        "inicio_timestamp": inicio,
        "criado_em": datetime.now()
    }
    
    if fim:
        documento["fim_timestamp"] = fim
        
    return documento

# Inicializar conexão quando o módulo é importado
if __name__ != "__main__":
    try:
        conectar_mongodb()
    except Exception as e:
        logger.error(f"Erro ao inicializar conexão MongoDB: {str(e)}") 