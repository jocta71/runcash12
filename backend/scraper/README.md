# RunCash - Sistema de Scraper de Roletas

## Visão Geral

O RunCash é um sistema avançado para monitoramento e análise de roletas online. O sistema inclui capacidades de scraping em tempo real, armazenamento de dados, análise estatística e uma API para integração com aplicações frontend.

Este repositório contém a versão refatorada do backend, que foi modularizada para melhor manutenção e extensibilidade.

## Características

- 🎮 Scraping em tempo real de roletas online
- 📊 Análise estatística de números e sequências
- 📱 API REST para integração com aplicações frontend
- 🔄 Notificações em tempo real via Server-Sent Events (SSE)
- 💾 Suporte a múltiplas fontes de dados (MongoDB e Supabase)
- 🧪 Modo de simulação para testes sem scraper
- 📝 Logging extensivo para monitoramento

## Arquitetura

O sistema foi refatorado em uma estrutura modular com os seguintes componentes:

- `app_refactor.py` - Módulo principal que coordena a inicialização dos componentes
- `config.py` - Configurações, variáveis de ambiente e logging
- `scraper_core.py` - Lógica do scraper e extração de dados
- `server.py` - Implementação da API Flask e eventos SSE
- `event_manager.py` - Gerenciador de eventos para notificações em tempo real
- `analytics.py` - Análise de dados e estatísticas
- `data_source_mongo.py` - Implementação de fonte de dados MongoDB
- `data_source_supabase.py` - Implementação de fonte de dados Supabase
- `mongo_config.py` - Configurações e utilitários para MongoDB
- `run.py` - Script de inicialização com opções de linha de comando

## Requisitos

- Python 3.8+
- MongoDB ou Supabase para armazenamento de dados
- Chrome/Chromium e ChromeDriver para o scraper

### Dependências Python

```
pymongo==4.5.0
supabase==1.0.3
flask==2.3.2
flask-cors==4.0.0
selenium==4.11.2
webdriver-manager==3.8.6
python-dotenv==1.0.0
requests==2.30.0
```

## Configuração

1. Clone o repositório
2. Instale as dependências:
   ```
   pip install -r requirements.txt
   ```
3. Configure as variáveis de ambiente criando um arquivo `.env` na raiz do projeto:

```bash
# Ambiente
PRODUCTION=false

# MongoDB (opcional)
MONGODB_URI=mongodb://localhost:27017/runcash
MONGODB_DB_NAME=runcash
MONGODB_ENABLED=true

# Supabase (opcional)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-supabase
SUPABASE_ENABLED=false

# URL do Casino
CASINO_URL=https://www.cassinobrazil.com/

# Servidor
HOST=0.0.0.0
PORT=5000
```

## Uso

O sistema pode ser iniciado usando o script `run.py`, que oferece várias opções de linha de comando:

### Exemplos de uso

**Iniciar com MongoDB (padrão):**
```bash
python run.py --mongodb
```

**Iniciar com Supabase:**
```bash
python run.py --supabase
```

**Iniciar apenas em modo de simulação (sem scraper real):**
```bash
python run.py --simulate
```

**Iniciar apenas o servidor (sem scraper ou simulador):**
```bash
python run.py --only-server
```

**Iniciar com porta específica:**
```bash
python run.py --port 8080
```

**Exibir informações do sistema:**
```bash
python run.py --info
```

**Modo debug com mais logs:**
```bash
python run.py --debug
```

## Endpoints da API

A API oferece os seguintes endpoints principais:

- `GET /events` - Stream SSE para eventos em tempo real
- `GET /health` - Verificação de saúde do sistema
- `GET /api/roletas` - Lista todas as roletas ativas
- `GET /api/roleta/<roleta_id>/numeros` - Obtém os últimos números de uma roleta
- `GET /api/roleta/<roleta_id>/estatisticas` - Obtém estatísticas para uma roleta
- `GET /api/roleta/<roleta_id>/sequencias` - Obtém sequências detectadas
- `GET /api/status` - Status do sistema e estatísticas
- `GET /api/start-simulator` - Inicia o simulador (para testes)
- `GET /api/force-event` - Força um evento aleatório (para testes)

## Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados.

## Contato

Para mais informações ou suporte, entre em contato com a equipe de desenvolvimento.
