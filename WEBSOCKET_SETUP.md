# Configuração do Servidor WebSocket para RunCash

Este documento fornece instruções para configurar e executar o servidor WebSocket que conecta o scraper Python com o frontend React.

## Visão Geral

O sistema RunCash utiliza WebSockets para fornecer atualizações em tempo real dos números e estratégias das roletas. O servidor WebSocket atua como um intermediário entre:

1. O **backend scraper** (Python) que coleta dados das roletas
2. O **frontend** (React) que exibe os dados em tempo real

## Pré-requisitos

- Node.js (v14+)
- MongoDB (já configurado e acessível)
- Python 3.8+ (para o scraper e testes)

## Configuração Rápida

### 1. Iniciar o Servidor WebSocket

Execute o script batch incluído para iniciar o servidor WebSocket:

```
start-websocket-server.bat
```

Ou manualmente:

```
cd backend
node websocket_server.js
```

O servidor WebSocket iniciará na porta 5000 por padrão.

### 2. Configurar o Frontend

Certifique-se de que o arquivo `.env` no diretório `frontend` contenha a URL correta do servidor WebSocket:

```
VITE_WS_URL=http://localhost:5000
```

Se estiver acessando de outro dispositivo na rede, substitua `localhost` pelo endereço IP da máquina onde o servidor WebSocket está rodando.

### 3. Testar a Conexão

Abra o arquivo `websocket-test.html` em um navegador para testar se a conexão WebSocket está funcionando corretamente. Você deverá ver eventos em tempo real aparecendo na página.

Para teste remoto, use `websocket-test-remote.html` e ajuste a URL do servidor conforme necessário.

## Simulação de Dados para Teste

Execute o script Python de teste para simular o envio de eventos para o servidor WebSocket:

```
python test-websocket-events.py
```

Este script enviará números aleatórios e atualizações de estratégia para testar o fluxo de dados completo.

## Configuração Avançada

### Configuração do MongoDB

O servidor WebSocket busca dados do MongoDB usando as configurações definidas em `backend/.env`:

```
MONGODB_URI=mongodb://localhost:27017/runcash
```

### Configuração do CORS

Por padrão, o servidor aceita conexões de qualquer origem. Para produção, você deve restringir as origens permitidas:

```javascript
// Em backend/websocket_server.js
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://seu-site.vercel.app'  // URL do seu site em produção
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

### Executando como Serviço do Windows

Para executar o servidor WebSocket como um serviço do Windows, você pode usar ferramentas como:

- [NSSM (Non-Sucking Service Manager)](https://nssm.cc/)
- [PM2](https://pm2.keymetrics.io/)

Exemplo com PM2:

```
npm install -g pm2
cd backend
pm2 start websocket_server.js --name "runcash-websocket"
pm2 save
pm2 startup
```

## Envio de Eventos via Scraper

O servidor WebSocket expõe um endpoint HTTP para receber eventos do scraper:

```
POST http://localhost:5000/emit-event
```

Payload:

```json
{
  "event": "new_number",
  "data": {
    "type": "new_number",
    "roleta_id": "123456",
    "roleta_nome": "Nome da Roleta",
    "numero": 15,
    "cor": "vermelho",
    "timestamp": "2023-03-17T12:00:00Z"
  }
}
```

## Solução de Problemas

### Verificar Status do Servidor

Acesse `http://localhost:5000/socket-status` para verificar se o servidor está online e conectado ao MongoDB.

### Problemas Comuns

1. **Erro de conexão MongoDB**
   - Verifique se o MongoDB está rodando
   - Verifique se a URI de conexão está correta em `backend/.env`

2. **Problemas de CORS**
   - Verifique se a origem do seu frontend está incluída na configuração CORS
   - Verifique logs do navegador para erros relacionados

3. **Falha na Recepção de Eventos**
   - Verifique se o endpoint `/emit-event` está retornando 200 OK
   - Verifique logs do servidor para erros

## Registro de Logs

Os logs do servidor são exibidos no console. Para registrar logs em um arquivo:

```
node websocket_server.js > websocket.log 2>&1
```

## Monitoramento

Para um monitoramento simples, você pode acessar `http://localhost:5000/api/status` para verificar o status atual do servidor.

---

Certifique-se de iniciar o servidor WebSocket antes de iniciar o frontend para garantir uma conexão suave! 