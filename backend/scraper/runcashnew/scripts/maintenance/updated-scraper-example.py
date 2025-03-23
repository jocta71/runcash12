#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Exemplo atualizado do scraper para usar a nova tabela roleta_numeros
"""

import requests
import json
import time
import schedule
from datetime import datetime
import random  # Apenas para simulação

# Configuração da API Supabase
SUPABASE_URL = "https://evzqzghxuttctbxgohpx.supabase.co/rest/v1"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # Substitua pela sua chave real
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Configuração das roletas
ROLETAS = [
    {"id": "2341648", "nome": "Ruleta XL", "scrape_function": lambda: scrape_ruleta_xl()},
    {"id": "2010143", "nome": "Ruleta Relámpago en Vivo", "scrape_function": lambda: scrape_ruleta_relampago()},
    # Adicione outras roletas conforme necessário
]

# Funções de acesso à API Supabase

def get_roleta(roleta_id):
    """
    Obtém informações de uma roleta específica
    """
    url = f"{SUPABASE_URL}/roletas?id=eq.{roleta_id}"
    response = requests.get(url, headers=HEADERS)
    
    if response.status_code == 200 and response.json():
        return response.json()[0]
    return None

def update_roleta(roleta_id, numeros):
    """
    Atualiza o array de números de uma roleta
    (mantido para compatibilidade)
    """
    url = f"{SUPABASE_URL}/roletas?id=eq.{roleta_id}"
    data = {"numeros": numeros}
    headers = {**HEADERS, "Prefer": "return=minimal"}
    
    response = requests.patch(url, headers=headers, json=data)
    return response.status_code == 204

def insert_roleta_numero(roleta_id, roleta_nome, numero):
    """
    Insere um novo número na tabela roleta_numeros
    """
    url = f"{SUPABASE_URL}/roleta_numeros"
    
    data = {
        "roleta_id": roleta_id,
        "roleta_nome": roleta_nome,
        "numero": numero,
        "created_at": datetime.now().isoformat()
    }
    
    response = requests.post(url, headers=HEADERS, json=data)
    return response.status_code == 201


# Funções de scraping (simuladas para este exemplo)

def scrape_ruleta_xl():
    """
    Simula o scraping da roleta XL
    Em uma implementação real, aqui estaria o código para obter o número 
    do site da roleta.
    """
    # Simula um número aleatório de 0 a 36
    return random.randint(0, 36)

def scrape_ruleta_relampago():
    """
    Simula o scraping da roleta Relámpago
    """
    # Simula um número aleatório de 0 a 36
    return random.randint(0, 36)


# Função principal de processamento

def process_new_number(roleta_id, roleta_nome, new_number, current_numbers):
    """
    Processa um novo número detectado.
    1. Atualiza a tabela roletas (mantido para compatibilidade)
    2. Insere o novo número na tabela roleta_numeros
    """
    try:
        # Atualiza a tabela roletas (mantido para compatibilidade)
        updated_numbers = [new_number] + current_numbers
        if len(updated_numbers) > 1000:
            updated_numbers = updated_numbers[:1000]
        
        update_success = update_roleta(roleta_id, updated_numbers)
        
        # Insere na nova tabela roleta_numeros
        insert_success = insert_roleta_numero(roleta_id, roleta_nome, new_number)
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] Novo número para {roleta_nome}: {new_number}")
        print(f"  Atualização roletas: {'Sucesso' if update_success else 'Falha'}")
        print(f"  Inserção roleta_numeros: {'Sucesso' if insert_success else 'Falha'}")
        
        return update_success and insert_success
    except Exception as e:
        print(f"Erro ao processar novo número para {roleta_nome}: {str(e)}")
        return False


def monitor_roleta(roleta_id, roleta_nome, scrape_function):
    """
    Monitora uma roleta específica e processa novos números
    """
    try:
        # Obtém o estado atual da roleta na tabela roletas
        response = get_roleta(roleta_id)
        if response:
            current_numbers = response.get("numeros", [])
        else:
            current_numbers = []
            
        # Obtém o número atual da roleta via scraping
        new_number = scrape_function()
        
        if new_number is not None:
            # Verifica se é um número novo (não é o último número registrado)
            if not current_numbers or new_number != current_numbers[0]:
                # Processa o novo número
                process_new_number(roleta_id, roleta_nome, new_number, current_numbers)
    except Exception as e:
        print(f"Erro ao monitorar {roleta_nome}: {str(e)}")


def schedule_monitoring():
    """
    Agenda o monitoramento de todas as roletas
    """
    for roleta in ROLETAS:
        roleta_id = roleta["id"]
        roleta_nome = roleta["nome"]
        scrape_function = roleta["scrape_function"]
        
        # Executa imediatamente na inicialização
        monitor_roleta(roleta_id, roleta_nome, scrape_function)
        
        # Agenda para executar a cada minuto
        schedule.every(1).minutes.do(
            monitor_roleta, 
            roleta_id=roleta_id, 
            roleta_nome=roleta_nome, 
            scrape_function=scrape_function
        )
    
    print("Monitoramento agendado para todas as roletas.")


def main():
    """
    Função principal que executa o scraper
    """
    print(f"[{datetime.now()}] Iniciando o scraper...")
    
    # Agenda o monitoramento
    schedule_monitoring()
    
    # Loop principal para manter o agendamento rodando
    while True:
        schedule.run_pending()
        time.sleep(1)


if __name__ == "__main__":
    main() 