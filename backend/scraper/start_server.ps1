# PowerShell script para iniciar o servidor API com configurações adequadas
# Autor: RunCash Team
# Data: Março 2025

Write-Host "`n===== RunCash API Server Starter =====`n" -ForegroundColor Green

# Verificar se o arquivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "Arquivo .env não encontrado. Criando a partir do .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "Arquivo .env criado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "ERRO: Arquivo .env.example não encontrado." -ForegroundColor Red
        Write-Host "Criando arquivo .env com configuração padrão..." -ForegroundColor Yellow
        
        # Criar arquivo .env com configuração padrão
        @"
# Configurações do MongoDB
MONGODB_URI=mongodb://localhost:27017/runcash
MONGODB_DB_NAME=runcash

# Configurações da API
HOST=0.0.0.0
PORT=5000
ALLOWED_ORIGINS=https://runcashnew-frontend-nu.vercel.app,http://localhost:3000,https://788b-146-235-26-230.ngrok-free.app,https://new-run-zeta.vercel.app

# Configurações de ambiente
PRODUCTION=false
SIMULATE_DATA=false

# Configuração de CORS
CORS_ENABLED=true

# Configuração de logs
DEBUG=true
"@ | Out-File -FilePath ".env" -Encoding utf8
        
        Write-Host "Arquivo .env criado com configuração padrão!" -ForegroundColor Green
    }
}

# Verificar se o Python está instalado
try {
    $pythonVersion = python --version
    Write-Host "Python encontrado: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERRO: Python não encontrado. Por favor, instale o Python 3.6 ou superior." -ForegroundColor Red
    exit 1
}

# Verificar se os pacotes necessários estão instalados
Write-Host "`nVerificando pacotes Python necessários..." -ForegroundColor Yellow
pip install -q pymongo python-dotenv flask flask-cors

# Verificar se há dados no MongoDB
Write-Host "`nVerificando se há dados no MongoDB..." -ForegroundColor Yellow
$hasData = python -c "
import pymongo
try:
    client = pymongo.MongoClient('mongodb://localhost:27017/runcash', serverSelectionTimeoutMS=2000)
    db = client['runcash']
    roletas_count = db.roletas.count_documents({})
    numeros_count = db.roleta_numeros.count_documents({})
    print(f'Dados encontrados: {roletas_count} roletas, {numeros_count} números')
    if roletas_count == 0 or numeros_count == 0:
        print('no_data')
    else:
        print('has_data')
except Exception as e:
    print(f'Erro ao conectar ao MongoDB: {str(e)}')
    print('no_data')
"

if ($hasData -match "no_data") {
    Write-Host "Nenhum dado encontrado no MongoDB. Deseja inserir dados de exemplo? (S/N)" -ForegroundColor Yellow
    $resposta = Read-Host
    if ($resposta -eq "S" -or $resposta -eq "s") {
        Write-Host "Inserindo dados de exemplo..." -ForegroundColor Yellow
        python insert_test_data.py
    }
} elseif ($hasData -match "has_data") {
    Write-Host "Dados encontrados no MongoDB. Continuando..." -ForegroundColor Green
} else {
    Write-Host "Erro ao verificar dados no MongoDB. Continuando..." -ForegroundColor Red
}

# Iniciar o servidor
Write-Host "`nIniciando o servidor API..." -ForegroundColor Green
python server.py 