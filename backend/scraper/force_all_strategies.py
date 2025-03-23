#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para forçar o envio de estratégias para todas as roletas
"""

import pymongo
import time
import random
from datetime import datetime
import os
import sys

# Adicionar diretório pai ao path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Importar os módulos necessários
from run_real_scraper import process_new_number, get_analyzer, generate_display_suggestion
from strategy_helper import atualizar_estrategia

# Configuração do MongoDB
MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/runcash')
DB_NAME = os.environ.get('MONGODB_DB_NAME', 'runcash')

def main():
    try:
        # Conectar ao MongoDB
        print(f"Conectando ao MongoDB: {MONGODB_URI}")
        client = pymongo.MongoClient(MONGODB_URI)
        db = client[DB_NAME]
        
        # Obter todas as roletas da coleção de números sorteados
        print("Buscando roletas existentes...")
        roletas = get_all_roulettes(db)
        
        if not roletas:
            # Se não encontrou roletas, vamos criar algumas para teste
            roletas = create_test_roulettes(db)
        
        print(f"Encontradas {len(roletas)} roletas")
        
        # Força atualização para cada roleta
        for i, roleta in enumerate(roletas):
            roleta_id = roleta.get('_id') or roleta.get('id') or roleta.get('roleta_id')
            roleta_nome = roleta.get('nome') or roleta.get('roleta_nome') or f"Roleta {i+1}"
            
            print(f"\n[{i+1}/{len(roletas)}] Processando roleta: {roleta_nome} (ID: {roleta_id})")
            
            # Gerar estado aleatório para cada roleta
            estado = random.choice(["NEUTRAL", "TRIGGER", "POST_GALE_NEUTRAL", "MORTO"])
            numero_gatilho = random.randint(0, 36)
            
            # Gerar terminais com base no número gatilho
            if estado in ["TRIGGER", "POST_GALE_NEUTRAL"]:
                # Usar os 3 dígitos do número
                terminais = [numero_gatilho % 10]
                # Adicionar mais alguns terminais aleatórios
                while len(terminais) < 3:
                    terminal = random.randint(0, 9)
                    if terminal not in terminais:
                        terminais.append(terminal)
            else:
                terminais = []
            
            # Gerar contadores
            vitorias = random.randint(5, 20)
            derrotas = random.randint(0, 10)
            
            # Gerar sugestão de display
            sugestao_display = generate_display_suggestion(estado, terminais)
            
            print(f"  → Estado: {estado}")
            print(f"  → Número gatilho: {numero_gatilho}")
            print(f"  → Terminais: {terminais}")
            print(f"  → Sugestão: {sugestao_display}")
            print(f"  → Vitórias/Derrotas: {vitorias}/{derrotas}")
            
            # Atualizar estratégia no MongoDB
            atualizar_estrategia(
                roleta_id=roleta_id,
                roleta_nome=roleta_nome,
                estado=estado,
                numero_gatilho=numero_gatilho,
                terminais_gatilho=terminais,
                vitorias=vitorias,
                derrotas=derrotas
            )
            
            # Inserir um número para essa roleta para garantir que há dados recentes
            insert_test_number(db, roleta_id, roleta_nome)
            
            print(f"  ✅ Estratégia atualizada com sucesso!")
            
            # Pausa para dar tempo do WebSocket processar
            time.sleep(0.5)
        
        print("\nTodas as estratégias foram atualizadas com sucesso!")
        print("O WebSocket deve ter enviado os dados para todas as roletas.")
        print("Verifique se os estados aparecem corretamente no frontend.")
        
    except Exception as e:
        print(f"Erro: {str(e)}")

def get_all_roulettes(db):
    """Obtém todas as roletas do MongoDB"""
    # Tentar obter roletas da coleção de roletas
    roletas = list(db.roletas.find())
    
    if not roletas:
        # Se não encontrou na coleção principal, buscar em números sorteados
        roletas_ids = db.roleta_numeros.distinct("roleta_id")
        roletas_nomes = db.roleta_numeros.distinct("roleta_nome")
        
        if len(roletas_ids) == len(roletas_nomes):
            roletas = [{"_id": id, "nome": nome} for id, nome in zip(roletas_ids, roletas_nomes)]
    
    return roletas

def create_test_roulettes(db):
    """Cria roletas de teste caso não existam"""
    print("Criando roletas de teste...")
    
    test_roulettes = [
        {"_id": "auto_roulette_id", "nome": "Auto-Roulette"},
        {"_id": "speed_auto_roulette_id", "nome": "Speed Auto Roulette"},
        {"_id": "bucharest_auto_roulette_id", "nome": "Bucharest Auto-Roulette"},
        {"_id": "immersive_roulette_id", "nome": "Immersive Roulette"}
    ]
    
    for roleta in test_roulettes:
        db.roletas.update_one(
            {"_id": roleta["_id"]},
            {"$set": roleta},
            upsert=True
        )
    
    return test_roulettes

def insert_test_number(db, roleta_id, roleta_nome):
    """Insere um número de teste para a roleta"""
    numero = random.randint(0, 36)
    
    # Determinar a cor do número
    if numero == 0:
        cor = "verde"
    else:
        vermelhos = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]
        cor = "vermelho" if numero in vermelhos else "preto"
    
    # Inserir o número na coleção
    db.roleta_numeros.insert_one({
        "roleta_id": roleta_id,
        "roleta_nome": roleta_nome,
        "numero": numero,
        "cor": cor,
        "timestamp": datetime.now().isoformat()
    })
    
    print(f"  → Inserido número de teste: {numero} ({cor})")

if __name__ == "__main__":
    main() 