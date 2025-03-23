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

## Configuração do Servidor WebSocket

1. **Configurar e iniciar o servidor WebSocket**

```bash
cd backend
npm install
node websocket_server.js
```

2. **Expor o servidor WebSocket na internet**

Você pode usar serviços como:
- Ngrok: `ngrok http 5000`
- Cloudflare Tunnel
- Um domínio próprio com HTTPS

Anote a URL pública do seu servidor WebSocket, ex: `https://seu-websocket-server.com`

## Configuração do Scraper Python

1. **Instalar dependências**

```bash
cd backend/scraper
pip install -r requirements.txt
```

2. **Atualizar a URL do WebSocket no script**

Edite `backend/scraper/run_real_scraper.py` e atualize a variável `WEBSOCKET_SERVER_URL`:

```python
WEBSOCKET_SERVER_URL = "https://seu-websocket-server.com/emit-event"
```

3. **Iniciar o scraper**

```bash
python run_real_scraper.py
```

## Configuração do Frontend no Vercel

1. **Adicionar a variável de ambiente no Vercel**

Na sua dashboard do Vercel:
- Vá para seu projeto
- Acesse a aba "Settings"
- Vá para "Environment Variables"
- Adicione a variável:
  - Nome: `VITE_WS_URL`
  - Valor: `https://seu-websocket-server.com` (a URL pública do seu servidor WebSocket)

2. **Redeploye o frontend**

Isso pode ser feito manualmente via dashboard ou automaticamente por meio de integração com GitHub.

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

### Erros CORS (Cross-Origin Resource Sharing)

Se encontrar erros CORS, atualize a lista de origens permitidas no arquivo `backend/websocket_server.js`:

```javascript
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://seu-projeto.vercel.app', // Adicione a URL do seu projeto Vercel aqui
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

## Escalabilidade e Produção

Para um ambiente de produção mais robusto:

1. **Use um balanceador de carga** para distribuir conexões WebSocket
2. **Adicione persistência** para conectar múltiplas instâncias do servidor WebSocket
3. **Implemente autenticação** para proteger seus endpoints
4. **Configure monitoramento** para detectar falhas rapidamente
5. **Implemente um sistema de filas** para eventos de alta frequência

## Conclusão

Seguindo este guia, você configurou com sucesso uma conexão em tempo real entre seu scraper Python, servidor WebSocket e frontend no Vercel. Os usuários agora receberão atualizações instantâneas sobre novos números de roleta e mudanças na estratégia! 