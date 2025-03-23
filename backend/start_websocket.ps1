# Script para iniciar o servidor WebSocket
Write-Host "Iniciando servidor WebSocket MongoDB..."

# Verificar se o Node.js está instalado
$nodeVersion = node --version
if (-not $?) {
    Write-Host "Erro: Node.js não está instalado. Por favor, instale o Node.js para continuar." -ForegroundColor Red
    exit 1
}

Write-Host "Node.js $nodeVersion encontrado." -ForegroundColor Green

# Verificar se os pacotes necessários estão instalados
if (-not (Test-Path -Path "node_modules")) {
    Write-Host "Instalando dependências necessárias..." -ForegroundColor Yellow
    npm install express socket.io cors mongodb dotenv axios
    
    if (-not $?) {
        Write-Host "Erro ao instalar dependências. Verifique sua conexão com a internet." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Dependências instaladas com sucesso!" -ForegroundColor Green
}

# Definir variáveis de ambiente para o MongoDB
$env:MONGODB_URI = "mongodb://localhost:27017/runcash"
$env:PORT = "5000"

# Iniciar o servidor WebSocket
Write-Host "Iniciando servidor na porta 5000..." -ForegroundColor Cyan
node ./websocket_server.js 