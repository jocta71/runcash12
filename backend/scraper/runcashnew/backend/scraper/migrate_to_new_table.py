#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para extração e armazenamento manual de números de roleta no Supabase
"""

import os
import time
import json
import logging
from datetime import datetime, timedelta
import random
from dotenv import load_dotenv
from supabase import create_client

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('inserir_numeros_roleta')

# Carregar variáveis de ambiente
load_dotenv()

# Configuração do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

# Garantir que a URL do Supabase esteja corretamente formatada
supabase_url = SUPABASE_URL
if supabase_url.startswith('@'):
    supabase_url = supabase_url[1:]
if not supabase_url.startswith('http'):
    supabase_url = f"https://{supabase_url}"

# Inicialização do cliente Supabase
try:
    supabase = create_client(supabase_url, SUPABASE_KEY)
    logger.info(f"Cliente Supabase inicializado com sucesso: {supabase_url}")
except Exception as e:
    logger.error(f"Erro ao inicializar cliente Supabase: {str(e)}")
    logger.error(f"URL: {supabase_url}")
    logger.error(f"Key: {SUPABASE_KEY[:10]}...")
    exit(1)

def verificar_tabela_roleta_numeros():
    """
    Verifica se a tabela 'roleta_numeros' existe
    """
    try:
        url = f"{supabase_url}/rest/v1/roleta_numeros"
        logger.info(f"Verificando tabela em: {url}")
        
        response = supabase.table("roleta_numeros").select("count").limit(1).execute()
        logger.info("Tabela 'roleta_numeros' existe e está disponível")
        return True
    except Exception as e:
        logger.error(f"Erro ao verificar tabela 'roleta_numeros': {str(e)}")
        logger.error("A tabela 'roleta_numeros' pode não existir. Execute o SQL para criá-la primeiro.")
        return False

def inserir_numeros_manual(roleta_id, roleta_nome, numeros):
    """
    Insere uma lista de números na tabela 'roleta_numeros'
    """
    if not numeros:
        logger.warning(f"Nenhum número fornecido para a roleta {roleta_nome} (ID: {roleta_id})")
        return 0
    
    # Limitar a 1000 números para evitar exceder o limite da tabela
    if len(numeros) > 1000:
        logger.info(f"Limitando a 1000 números dos {len(numeros)} fornecidos para a roleta {roleta_nome}")
        numeros = numeros[:1000]
    
    logger.info(f"Iniciando inserção de {len(numeros)} números para a roleta {roleta_nome} (ID: {roleta_id})")
    
    # Verificar se já existem números para esta roleta na tabela 'roleta_numeros'
    try:
        url = f"{supabase_url}/rest/v1/roleta_numeros?roleta_id=eq.{roleta_id}&select=count"
        logger.info(f"Verificando números existentes em: {url}")
        
        response = supabase.table("roleta_numeros").select("count").filter("roleta_id", "eq", roleta_id).execute()
        numeros_existentes = response.data[0]['count'] if response.data else 0
        
        if numeros_existentes > 0:
            logger.warning(f"Já existem {numeros_existentes} números para a roleta {roleta_nome} na tabela 'roleta_numeros'")
            decisao = input(f"Deseja continuar e adicionar mais números? (s/n): ")
            if decisao.lower() != 's':
                logger.info(f"Inserção cancelada para a roleta {roleta_nome}")
                return 0
    except Exception as e:
        logger.warning(f"Erro ao verificar números existentes: {str(e)}")
    
    # Inserir cada número em lotes para evitar sobrecarga
    total_inseridos = 0
    lote_size = 50
    
    for i in range(0, len(numeros), lote_size):
        lote = numeros[i:i+lote_size]
        lote_dados = []
        
        for j, numero in enumerate(lote):
            # Validar o número
            try:
                if isinstance(numero, str):
                    numero_int = int(numero.strip())
                else:
                    numero_int = int(numero)
                
                if 0 <= numero_int <= 36:
                    # Criar um timestamp decrescente para manter a ordem cronológica
                    timestamp = datetime.now() - timedelta(minutes=i+j)
                    
                    lote_dados.append({
                        "roleta_id": roleta_id,
                        "roleta_nome": roleta_nome,
                        "numero": numero_int,
                        "created_at": timestamp.isoformat()
                    })
                else:
                    logger.warning(f"Número inválido ignorado: {numero}")
            except (ValueError, TypeError) as e:
                logger.warning(f"Erro ao converter número '{numero}': {str(e)}")
        
        # Inserir o lote
        if lote_dados:
            try:
                url = f"{supabase_url}/rest/v1/roleta_numeros"
                logger.info(f"Inserindo lote de {len(lote_dados)} números em: {url}")
                
                response = supabase.table("roleta_numeros").insert(lote_dados).execute()
                total_inseridos += len(lote_dados)
                logger.info(f"Lote {i//lote_size + 1} inserido: {len(lote_dados)} números")
            except Exception as e:
                logger.error(f"Erro ao inserir lote {i//lote_size + 1}: {str(e)}")
        
        # Pequena pausa para não sobrecarregar a API
        time.sleep(0.5)
    
    logger.info(f"Inserção completa para a roleta {roleta_nome}: {total_inseridos} números inseridos")
    return total_inseridos

def inserir_dados_exemplo():
    """
    Insere dados de exemplo para demonstração
    """
    # Configuração das roletas de exemplo
    roletas_exemplo = [
        {
            "id": "2341648",
            "nome": "Ruleta XL",
            "numeros": [random.randint(0, 36) for _ in range(100)]  # 100 números aleatórios
        },
        {
            "id": "2010143",
            "nome": "Ruleta Relámpago en Vivo",
            "numeros": [random.randint(0, 36) for _ in range(100)]  # 100 números aleatórios
        }
    ]
    
    total_inseridos = 0
    
    # Inserir os números de cada roleta de exemplo
    for roleta in roletas_exemplo:
        try:
            inseridos = inserir_numeros_manual(roleta["id"], roleta["nome"], roleta["numeros"])
            total_inseridos += inseridos
        except Exception as e:
            logger.error(f"Erro ao inserir números para a roleta {roleta['nome']}: {str(e)}")
    
    logger.info(f"Total de {total_inseridos} números de exemplo inseridos.")

def main():
    """
    Função principal
    """
    logger.info("Iniciando inserção de dados na tabela 'roleta_numeros'")
    
    # Verificar se a tabela 'roleta_numeros' existe
    if not verificar_tabela_roleta_numeros():
        logger.error("Operação abortada. Verifique se a tabela 'roleta_numeros' foi criada corretamente.")
        return
    
    # Menu de opções
    print("\nEscolha uma opção:")
    print("1. Inserir dados de exemplo (números aleatórios)")
    print("2. Inserir números manualmente para uma roleta")
    print("3. Sair")
    
    opcao = input("\nOpção: ")
    
    if opcao == "1":
        inserir_dados_exemplo()
    elif opcao == "2":
        roleta_id = input("ID da roleta: ")
        roleta_nome = input("Nome da roleta: ")
        
        print("\nDigite os números da roleta (0-36), um por linha.")
        print("Deixe uma linha em branco para finalizar.")
        
        numeros = []
        while True:
            linha = input()
            if not linha:
                break
            
            try:
                numero = int(linha)
                if 0 <= numero <= 36:
                    numeros.append(numero)
                else:
                    print(f"Número {numero} inválido. Use apenas números de 0 a 36.")
            except ValueError:
                print(f"Entrada inválida: {linha}. Use apenas números.")
        
        inserir_numeros_manual(roleta_id, roleta_nome, numeros)
    else:
        logger.info("Operação cancelada pelo usuário.")

if __name__ == "__main__":
    main() 