#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Módulo de análise de dados das roletas
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from collections import Counter, defaultdict

from config import logger
from mongo_config import conectar_mongodb

def calcular_estatisticas_diarias(roleta_id: str, data: datetime = None) -> Dict[str, Any]:
    """
    Calcula estatísticas diárias para uma roleta específica
    
    Args:
        roleta_id (str): ID da roleta
        data (datetime, optional): Data para calcular estatísticas. Defaults to None (hoje).
        
    Returns:
        Dict[str, Any]: Estatísticas calculadas
    """
    try:
        # Conectar ao MongoDB
        client, db = conectar_mongodb()
        
        # Usar data atual se não especificada
        if data is None:
            data = datetime.now()
        
        # Obter início e fim do dia
        inicio_dia = datetime(data.year, data.month, data.day, 0, 0, 0)
        fim_dia = inicio_dia + timedelta(days=1) - timedelta(microseconds=1)
        
        # Formatar data como string YYYY-MM-DD
        data_str = data.strftime("%Y-%m-%d")
        
        # Buscar números da roleta para a data especificada
        numeros = list(db.roleta_numeros.find({
            "roleta_id": roleta_id,
            "timestamp": {"$gte": inicio_dia, "$lte": fim_dia}
        }))
        
        # Se não houver números, retornar estatísticas vazias
        if not numeros:
            estatisticas = {
                "roleta_id": roleta_id,
                "data": data_str,
                "total_numeros": 0,
                "distribuicao_numeros": [],
                "distribuicao_cores": {"vermelho": 0, "preto": 0, "verde": 0},
                "numeros_mais_frequentes": [],
                "numeros_menos_frequentes": [],
                "criado_em": datetime.now(),
                "atualizado_em": datetime.now()
            }
        else:
            # Extrair apenas os números
            lista_numeros = [n["numero"] for n in numeros]
            
            # Contar frequência dos números
            contador = Counter(lista_numeros)
            
            # Distribuição de cores
            cores = {"vermelho": 0, "preto": 0, "verde": 0}
            for n in numeros:
                cor = n.get("cor", "")
                if cor in cores:
                    cores[cor] += 1
            
            # Números mais e menos frequentes (limitados a 5)
            mais_frequentes = contador.most_common(5)
            menos_frequentes = contador.most_common()[:-6:-1]  # 5 menos frequentes
            
            # Distribuição completa
            distribuicao = [{"numero": num, "contagem": cont} for num, cont in contador.items()]
            
            # Criar documento de estatísticas
            estatisticas = {
                "roleta_id": roleta_id,
                "data": data_str,
                "total_numeros": len(lista_numeros),
                "distribuicao_numeros": distribuicao,
                "distribuicao_cores": cores,
                "numeros_mais_frequentes": [{"numero": num, "contagem": cont} for num, cont in mais_frequentes],
                "numeros_menos_frequentes": [{"numero": num, "contagem": cont} for num, cont in menos_frequentes],
                "criado_em": datetime.now(),
                "atualizado_em": datetime.now()
            }
        
        # Atualizar ou inserir estatísticas
        db.roleta_estatisticas_diarias.update_one(
            {"roleta_id": roleta_id, "data": data_str},
            {"$set": estatisticas},
            upsert=True
        )
        
        logger.debug(f"Estatísticas diárias atualizadas para roleta {roleta_id} na data {data_str}")
        return estatisticas
    except Exception as e:
        logger.error(f"Erro ao calcular estatísticas diárias: {str(e)}")
        return {
            "roleta_id": roleta_id,
            "data": data.strftime("%Y-%m-%d") if data else datetime.now().strftime("%Y-%m-%d"),
            "erro": str(e)
        }

def detectar_sequencias(roleta_id: str, limite: int = 100) -> List[Dict[str, Any]]:
    """
    Detecta sequências de números, cores e paridades para uma roleta
    
    Args:
        roleta_id (str): ID da roleta
        limite (int, optional): Limite de números a analisar. Defaults to 100.
        
    Returns:
        List[Dict[str, Any]]: Lista de sequências detectadas
    """
    try:
        # Conectar ao MongoDB
        client, db = conectar_mongodb()
        
        # Buscar os últimos números da roleta
        numeros = list(db.roleta_numeros.find({
            "roleta_id": roleta_id
        }).sort("timestamp", -1).limit(limite))
        
        # Inverter para ordem cronológica
        numeros.reverse()
        
        # Se não houver números suficientes, retornar lista vazia
        if len(numeros) < 3:  # Mínimo para uma sequência interessante
            return []
        
        # Listas de sequências detectadas
        sequencias = []
        
        # Detectar sequências de números pares/ímpares
        detectar_sequencia_paridade(roleta_id, numeros, db, sequencias)
        
        # Detectar sequências de cores
        detectar_sequencia_cores(roleta_id, numeros, db, sequencias)
        
        # Detectar sequências de dúzias
        detectar_sequencia_duzias(roleta_id, numeros, db, sequencias)
        
        # Detectar sequências de colunas
        detectar_sequencia_colunas(roleta_id, numeros, db, sequencias)
        
        # Detectar sequências de altos/baixos
        detectar_sequencia_metades(roleta_id, numeros, db, sequencias)
        
        logger.debug(f"Detectadas {len(sequencias)} sequências para roleta {roleta_id}")
        return sequencias
    except Exception as e:
        logger.error(f"Erro ao detectar sequências: {str(e)}")
        return []

def detectar_sequencia_paridade(roleta_id: str, numeros: List[Dict], db, sequencias: List):
    """Detecta sequências de números pares/ímpares"""
    seq_atual = None
    inicio = None
    inicio_timestamp = None
    
    for i, num in enumerate(numeros):
        numero = num["numero"]
        # Determinar paridade (0 é considerado neutro, nem par nem ímpar)
        if numero == 0:
            paridade = "zero"
        else:
            paridade = "par" if numero % 2 == 0 else "impar"
        
        # Iniciar nova sequência ou continuar a atual
        if seq_atual is None or (paridade != seq_atual and paridade != "zero"):
            # Salvar sequência anterior se existir e for longa o suficiente
            if seq_atual and i - inicio >= 3:
                fim = i - 1
                fim_timestamp = numeros[fim]["timestamp"]
                
                sequencia = {
                    "roleta_id": roleta_id,
                    "tipo": "paridade",
                    "valor": seq_atual,
                    "comprimento": fim - inicio + 1,
                    "inicio": inicio,
                    "fim": fim,
                    "inicio_timestamp": inicio_timestamp,
                    "fim_timestamp": fim_timestamp,
                    "criado_em": datetime.now(),
                    "atualizado_em": datetime.now()
                }
                
                db.roleta_sequencias.update_one(
                    {
                        "roleta_id": roleta_id,
                        "tipo": "paridade",
                        "valor": seq_atual,
                        "inicio_timestamp": inicio_timestamp
                    },
                    {"$set": sequencia},
                    upsert=True
                )
                
                sequencias.append(sequencia)
            
            # Iniciar nova sequência (se não for zero)
            if paridade != "zero":
                seq_atual = paridade
                inicio = i
                inicio_timestamp = num["timestamp"]

def detectar_sequencia_cores(roleta_id: str, numeros: List[Dict], db, sequencias: List):
    """Detecta sequências de cores"""
    seq_atual = None
    inicio = None
    inicio_timestamp = None
    
    for i, num in enumerate(numeros):
        cor = num.get("cor", "")
        
        # Iniciar nova sequência ou continuar a atual
        if seq_atual is None or (cor != seq_atual and cor != "verde"):
            # Salvar sequência anterior se existir e for longa o suficiente
            if seq_atual and i - inicio >= 3:
                fim = i - 1
                fim_timestamp = numeros[fim]["timestamp"]
                
                sequencia = {
                    "roleta_id": roleta_id,
                    "tipo": "cor",
                    "valor": seq_atual,
                    "comprimento": fim - inicio + 1,
                    "inicio": inicio,
                    "fim": fim,
                    "inicio_timestamp": inicio_timestamp,
                    "fim_timestamp": fim_timestamp,
                    "criado_em": datetime.now(),
                    "atualizado_em": datetime.now()
                }
                
                db.roleta_sequencias.update_one(
                    {
                        "roleta_id": roleta_id,
                        "tipo": "cor",
                        "valor": seq_atual,
                        "inicio_timestamp": inicio_timestamp
                    },
                    {"$set": sequencia},
                    upsert=True
                )
                
                sequencias.append(sequencia)
            
            # Iniciar nova sequência (se não for verde/0)
            if cor not in ["", "verde"]:
                seq_atual = cor
                inicio = i
                inicio_timestamp = num["timestamp"]

def detectar_sequencia_duzias(roleta_id: str, numeros: List[Dict], db, sequencias: List):
    """Detecta sequências de dúzias"""
    seq_atual = None
    inicio = None
    inicio_timestamp = None
    
    for i, num in enumerate(numeros):
        numero = num["numero"]
        
        # Determinar dúzia
        if numero == 0:
            duzia = "zero"
        elif 1 <= numero <= 12:
            duzia = "primeira"
        elif 13 <= numero <= 24:
            duzia = "segunda"
        else:
            duzia = "terceira"
        
        # Iniciar nova sequência ou continuar a atual
        if seq_atual is None or (duzia != seq_atual and duzia != "zero"):
            # Salvar sequência anterior se existir e for longa o suficiente
            if seq_atual and i - inicio >= 3:
                fim = i - 1
                fim_timestamp = numeros[fim]["timestamp"]
                
                sequencia = {
                    "roleta_id": roleta_id,
                    "tipo": "duzia",
                    "valor": seq_atual,
                    "comprimento": fim - inicio + 1,
                    "inicio": inicio,
                    "fim": fim,
                    "inicio_timestamp": inicio_timestamp,
                    "fim_timestamp": fim_timestamp,
                    "criado_em": datetime.now(),
                    "atualizado_em": datetime.now()
                }
                
                db.roleta_sequencias.update_one(
                    {
                        "roleta_id": roleta_id,
                        "tipo": "duzia",
                        "valor": seq_atual,
                        "inicio_timestamp": inicio_timestamp
                    },
                    {"$set": sequencia},
                    upsert=True
                )
                
                sequencias.append(sequencia)
            
            # Iniciar nova sequência (se não for zero)
            if duzia != "zero":
                seq_atual = duzia
                inicio = i
                inicio_timestamp = num["timestamp"]

def detectar_sequencia_colunas(roleta_id: str, numeros: List[Dict], db, sequencias: List):
    """Detecta sequências de colunas"""
    seq_atual = None
    inicio = None
    inicio_timestamp = None
    
    for i, num in enumerate(numeros):
        numero = num["numero"]
        
        # Determinar coluna
        if numero == 0:
            coluna = "zero"
        else:
            # Números por coluna:
            # Coluna 1: 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34
            # Coluna 2: 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35
            # Coluna 3: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36
            coluna = f"coluna_{(numero - 1) % 3 + 1}"
        
        # Iniciar nova sequência ou continuar a atual
        if seq_atual is None or (coluna != seq_atual and coluna != "zero"):
            # Salvar sequência anterior se existir e for longa o suficiente
            if seq_atual and i - inicio >= 3:
                fim = i - 1
                fim_timestamp = numeros[fim]["timestamp"]
                
                sequencia = {
                    "roleta_id": roleta_id,
                    "tipo": "coluna",
                    "valor": seq_atual,
                    "comprimento": fim - inicio + 1,
                    "inicio": inicio,
                    "fim": fim,
                    "inicio_timestamp": inicio_timestamp,
                    "fim_timestamp": fim_timestamp,
                    "criado_em": datetime.now(),
                    "atualizado_em": datetime.now()
                }
                
                db.roleta_sequencias.update_one(
                    {
                        "roleta_id": roleta_id,
                        "tipo": "coluna",
                        "valor": seq_atual,
                        "inicio_timestamp": inicio_timestamp
                    },
                    {"$set": sequencia},
                    upsert=True
                )
                
                sequencias.append(sequencia)
            
            # Iniciar nova sequência (se não for zero)
            if coluna != "zero":
                seq_atual = coluna
                inicio = i
                inicio_timestamp = num["timestamp"]

def detectar_sequencia_metades(roleta_id: str, numeros: List[Dict], db, sequencias: List):
    """Detecta sequências de números altos/baixos (metades)"""
    seq_atual = None
    inicio = None
    inicio_timestamp = None
    
    for i, num in enumerate(numeros):
        numero = num["numero"]
        
        # Determinar metade
        if numero == 0:
            metade = "zero"
        elif 1 <= numero <= 18:
            metade = "baixo"
        else:
            metade = "alto"
        
        # Iniciar nova sequência ou continuar a atual
        if seq_atual is None or (metade != seq_atual and metade != "zero"):
            # Salvar sequência anterior se existir e for longa o suficiente
            if seq_atual and i - inicio >= 3:
                fim = i - 1
                fim_timestamp = numeros[fim]["timestamp"]
                
                sequencia = {
                    "roleta_id": roleta_id,
                    "tipo": "metade",
                    "valor": seq_atual,
                    "comprimento": fim - inicio + 1,
                    "inicio": inicio,
                    "fim": fim,
                    "inicio_timestamp": inicio_timestamp,
                    "fim_timestamp": fim_timestamp,
                    "criado_em": datetime.now(),
                    "atualizado_em": datetime.now()
                }
                
                db.roleta_sequencias.update_one(
                    {
                        "roleta_id": roleta_id,
                        "tipo": "metade",
                        "valor": seq_atual,
                        "inicio_timestamp": inicio_timestamp
                    },
                    {"$set": sequencia},
                    upsert=True
                )
                
                sequencias.append(sequencia)
            
            # Iniciar nova sequência (se não for zero)
            if metade != "zero":
                seq_atual = metade
                inicio = i
                inicio_timestamp = num["timestamp"] 