# Deploy do Frontend no Vercel

Este guia explica como fazer o deploy do frontend RunCash no Vercel.

## Pré-requisitos

- Uma conta no [Vercel](https://vercel.com/)
- Um repositório Git com o código do frontend (GitHub, GitLab ou Bitbucket)
- A API backend do RunCash em execução e acessível publicamente

## Passo 1: Configurar as Variáveis de Ambiente

Antes de fazer o deploy, é necessário garantir que o arquivo `.env.production` esteja configurado corretamente com as URLs da sua API.

Edite o arquivo `.env.production` e atualize as seguintes variáveis:

```
# Substitua pelo URL público da sua API
VITE_SSE_SERVER_URL=https://seu-dominio-api.com/api/events
VITE_SOCKET_URL=https://seu-dominio-api.com
```

Se você estiver executando a API localmente, considere usar um serviço como [ngrok](https://ngrok.com/) ou [localtunnel](https://localtunnel.github.io/www/) para expor sua API localmente para a Internet.

## Passo 2: Preparar o Repositório

Certifique-se de que o código esteja pronto para deploy:

1. Teste a aplicação localmente: `npm run dev`
2. Verifique se o build está funcionando: `npm run build`
3. Commit e push das alterações finais para o repositório:

```bash
git add .
git commit -m "Preparação para deploy no Vercel"
git push
```

## Passo 3: Deploy no Vercel

### Opção 1: Deploy via Interface Web do Vercel

1. Faça login no [Vercel](https://vercel.com/)
2. Clique em "Add New..." > "Project"
3. Importe o repositório Git com o código do frontend
4. Configure o projeto:
   - Framework Preset: Selecione "Vite"
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Expanda a seção "Environment Variables" e adicione as mesmas variáveis do arquivo `.env.production`
6. Clique em "Deploy"

### Opção 2: Deploy via Vercel CLI

1. Instale a Vercel CLI: `npm i -g vercel`
2. No diretório do projeto, execute: `vercel login`
3. Para fazer o deploy, execute: `vercel`
4. Siga as instruções e configure:
   - Set up and deploy: Yes
   - Link to existing project: Yes (se já tiver criado o projeto no Vercel)
   - Environment variables: Adicione as mesmas do `.env.production`

## Passo 4: Verificar o Deploy

1. Após o deploy, o Vercel fornecerá uma URL para acessar o site (ex: `https://seu-projeto.vercel.app`)
2. Acesse a URL e verifique se o frontend está funcionando corretamente
3. Verifique se a conexão com a API está funcionando:
   - Os dados das roletas são exibidos
   - A conexão em tempo real está funcionando

## Passo 5: Configuração de Domínio Personalizado (Opcional)

1. No dashboard do Vercel, vá para o seu projeto
2. Clique em "Settings" > "Domains"
3. Adicione seu domínio personalizado e siga as instruções

## Solução de Problemas

### Erro de CORS

Se encontrar erros de CORS, verifique:

1. A configuração de CORS no backend está permitindo o domínio do Vercel
2. As URLs da API no frontend estão corretas
3. A API está acessível publicamente

### Erro de Conexão com a API

Se o frontend não conseguir se conectar à API:

1. Verifique se a API está em execução
2. Confirme se as URLs da API estão corretas no arquivo `.env.production`
3. Verifique se o domínio da API está configurado corretamente no backend

## Atualização do Deploy

Quando fizer alterações no código, basta fazer push para o repositório Git, e o Vercel fará automaticamente o redeploy.

Para forçar uma nova compilação, vá ao dashboard do Vercel, selecione seu projeto e clique em "Redeploy". 