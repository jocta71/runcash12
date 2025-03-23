#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para migrar números existentes da tabela 'roletas' para a nova tabela 'roleta_numeros'
"""

import requests
import json
from datetime import datetime, timedelta
import time
import random

# Configuração da API Supabase
SUPABASE_URL = "https://evzqzghxuttctbxgohpx.supabase.co/rest/v1"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # Substitua pela sua chave real
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def get_all_roletas():
    """
    Obtém todas as roletas da tabela roletas
    """
    url = f"{SUPABASE_URL}/roletas"
    response = requests.get(url, headers=HEADERS)
    
    if response.status_code == 200:
        return response.json()
    return []

def insert_roleta_numero(roleta_id, roleta_nome, numero, created_at=None):
    """
    Insere um número na nova tabela roleta_numeros
    """
    url = f"{SUPABASE_URL}/roleta_numeros"
    
    # Se não for fornecido um timestamp, usa o momento atual
    if created_at is None:
        created_at = datetime.now().isoformat()
    
    data = {
        "roleta_id": roleta_id,
        "roleta_nome": roleta_nome,
        "numero": numero,
        "created_at": created_at
    }
    
    response = requests.post(url, headers=HEADERS, json=data)
    return response.status_code == 201

def migrate_roleta_data(roleta):
    """
    Migra os números de uma roleta específica
    """
    roleta_id = roleta.get("id")
    roleta_nome = roleta.get("nome")
    numeros = roleta.get("numeros", [])
    
    if not numeros:
        print(f"Roleta {roleta_nome} não possui números para migrar.")
        return 0
    
    # Calculamos timestamps para cada número, começando do mais recente (índice 0)
    # para o mais antigo (último índice)
    now = datetime.now()
    count = 0
    
    for i, numero in enumerate(numeros):
        # Cada número é mais antigo que o anterior (intervalos de 1 minuto)
        timestamp = (now - timedelta(minutes=i)).isoformat()
        
        # Insere o número na nova tabela
        if insert_roleta_numero(roleta_id, roleta_nome, numero, timestamp):
            count += 1
            print(f"Migrado: Roleta {roleta_nome}, Número {numero}, Timestamp {timestamp}")
        else:
            print(f"Erro ao migrar: Roleta {roleta_nome}, Número {numero}")
        
        # Pequena pausa para não sobrecarregar a API
        time.sleep(0.2)
    
    return count

def main():
    """
    Função principal que executa a migração
    """
    print("Iniciando migração de dados da tabela 'roletas' para 'roleta_numeros'...")
    
    # Obtém todas as roletas
    roletas = get_all_roletas()
    print(f"Encontradas {len(roletas)} roletas para migração.")
    
    total_migrated = 0
    
    # Migra os números de cada roleta
    for roleta in roletas:
        print(f"\nProcessando roleta: {roleta.get('nome')}")
        migrated = migrate_roleta_data(roleta)
        total_migrated += migrated
        print(f"Migrados {migrated} números para a roleta {roleta.get('nome')}")
    
    print(f"\nMigração concluída. Total de {total_migrated} números migrados.")

if __name__ == "__main__":
    main() 