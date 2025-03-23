#!/bin/bash

# Script para iniciar o scraper Python

echo "=== Iniciando o scraper Python ==="

# Verificar se o Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "Python 3 não encontrado. Por favor, instale o Python 3."
    exit 1
fi

# Verificar se o pip está instalado
if ! command -v pip3 &> /dev/null; then
    echo "pip3 não encontrado. Por favor, instale o pip3."
    exit 1
fi

# Instalar dependências
echo "Instalando dependências..."
pip3 install -r requirements.txt

# Verificar se o arquivo de configuração existe
echo "Verificando configuração..."
if ! grep -q "WEBSOCKET_SERVER_URL" run_real_scraper.py; then
    echo "ERRO: Configuração do WebSocket não encontrada no arquivo run_real_scraper.py"
    echo "Por favor, edite o arquivo e defina a URL correta do servidor WebSocket."
    exit 1
fi

# Iniciar o scraper
echo "Iniciando o scraper..."
python3 run_real_scraper.py 