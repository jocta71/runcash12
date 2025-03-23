#!/bin/bash

# Script para implantar o servidor WebSocket

echo "=== Iniciando implantação do servidor WebSocket ==="

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "Node.js não encontrado. Por favor, instale o Node.js."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "npm não encontrado. Por favor, instale o npm."
    exit 1
fi

# Instalar dependências
echo "Instalando dependências..."
npm install

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "Arquivo .env não encontrado. Criando a partir do exemplo..."
    cp .env.example .env
    echo "Por favor, edite o arquivo .env com suas configurações."
    exit 1
fi

# Iniciar o servidor
echo "Iniciando o servidor WebSocket..."
node websocket_server.js 