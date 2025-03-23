# Guia de Implantação da Conexão em Tempo Real

Este guia descreve como configurar a conexão em tempo real entre o backend (scraper Python) e o frontend no Vercel.

## Visão Geral da Arquitetura

A arquitetura de tempo real consiste em três componentes principais:

1. **Backend Scraper (Python)**: Extrai dados das roletas e os armazena no MongoDB
2. **Servidor WebSocket (Node.js)**: Recebe eventos do scraper e os transmite para o frontend
3. **Frontend (React no Vercel)**: Recebe e exibe os dados em tempo real

## Pré-requisitos

- Servidor com Node.js para o WebSocket server
- MongoDB acessível tanto pelo scraper quanto pelo servidor WebSocket
- Vercel para hospedar o frontend
- Local para execução do scraper Python (pode ser o mesmo servidor do WebSocket)

## Passo 1: Configurar o MongoDB

1. **Instalar e configurar o MongoDB**
   - Instale o MongoDB em seu servidor ou use um serviço de MongoDB na nuvem (Atlas, mLab, etc.)
   - Crie um banco de dados chamado `runcash`
   - Anote a string de conexão, por exemplo: `mongodb://localhost:27017/runcash`

## Passo 2: Configurar e iniciar o servidor WebSocket

1. **Preparar o ambiente**
   ```bash
   cd backend
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   npm install
   ```

2. **Iniciar o servidor WebSocket**
   ```bash
   node websocket_server.js
   ```

3. **Expor o servidor WebSocket na internet**
   - Use um serviço como Ngrok: `ngrok http 5000`
   - Ou configure um proxy reverso com Nginx/Apache
   - Ou use um serviço de hospedagem como Heroku, Render, Railway, etc.

4. **Anote a URL pública do seu servidor WebSocket**
   - Exemplo: `https://seu-websocket-server.com`

## Passo 3: Configurar o Scraper Python

1. **Instalar dependências**
   ```bash
   cd backend/scraper
   pip install -r requirements.txt
   ```

2. **Atualizar a URL do WebSocket no script**
   - Edite `backend/scraper/run_real_scraper.py` e atualize a variável `WEBSOCKET_SERVER_URL`:
   ```python
   WEBSOCKET_SERVER_URL = "https://seu-websocket-server.com/emit-event"
   ```

3. **Iniciar o scraper**
   ```bash
   python run_real_scraper.py
   ```

## Passo 4: Configurar o Frontend no Vercel

1. **Adicionar a variável de ambiente no Vercel**
   - Na dashboard do Vercel:
     - Vá para seu projeto
     - Acesse a aba "Settings"
     - Vá para "Environment Variables"
     - Adicione a variável:
       - Nome: `VITE_WS_URL`
       - Valor: `https://seu-websocket-server.com` (a URL pública do seu servidor WebSocket)

2. **Redeploye o frontend**
   - Isso pode ser feito manualmente via dashboard ou automaticamente por meio de integração com GitHub.

## Testando a Conexão

1. Inicie o servidor WebSocket
2. Inicie o scraper Python
3. Abra o frontend em seu navegador
4. Abra o console do navegador para ver mensagens de log da conexão
5. Verifique se os dados estão sendo atualizados em tempo real na interface

## Solução de Problemas

### Servidor WebSocket não recebe eventos do scraper

- Verifique se a URL no script Python está correta
- Verifique os logs do script Python para erros
- Verifique se o servidor está acessível a partir do ambiente do scraper

### Frontend não recebe eventos em tempo real

- Verifique se a variável de ambiente VITE_WS_URL está configurada corretamente
- Verifique os logs do console do navegador para erros de conexão
- Certifique-se de que o CORS está configurado corretamente no servidor WebSocket

### Erros de conexão com MongoDB

- Verifique se a string de conexão está correta
- Verifique se o MongoDB está acessível a partir do servidor WebSocket
- Verifique os logs do servidor WebSocket para erros de conexão

## Monitoramento e Manutenção

Para garantir que o sistema continue funcionando corretamente:

1. **Configure monitoramento** para o servidor WebSocket e MongoDB
2. **Verifique os logs regularmente** para identificar problemas
3. **Reinicie o servidor WebSocket periodicamente** para evitar vazamentos de memória
4. **Faça backup do banco de dados MongoDB** regularmente 