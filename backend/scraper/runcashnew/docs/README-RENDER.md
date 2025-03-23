# Deploy do Backend RunCash no Render

Este guia fornece instruções para configurar e implantar o backend da aplicação RunCash no Render.

## Pré-requisitos

1. Conta no [Render](https://render.com/)
2. Conta no [GitHub](https://github.com/)
3. Repositório com o código da aplicação

## Passos para Deploy

### 1. Preparar o Repositório

Certifique-se de que os seguintes arquivos estão presentes no seu repositório:

- `backend/scraper/requirements.txt` - Lista as dependências
- `backend/scraper/app.py` - Aplicação Flask principal
- `render.yaml` - Configuração para o Render (na raiz do projeto)

### 2. Deploy via Dashboard do Render

#### Opção A: Deploy Automático com Blueprint (Recomendado)

1. Faça login no [Render Dashboard](https://dashboard.render.com/)
2. Clique em "New" > "Blueprint"
3. Selecione seu repositório
4. O Render detectará automaticamente o arquivo `render.yaml` e configurará o serviço
5. Clique em "Apply" para iniciar o deploy

#### Opção B: Deploy Manual

1. Faça login no [Render Dashboard](https://dashboard.render.com/)
2. Clique em "New" > "Web Service"
3. Conecte seu repositório GitHub
4. Configure o serviço:
   - **Nome**: runcash-backend (ou outro de sua escolha)
   - **Ambiente**: Python
   - **Região**: Selecione a mais próxima de você
   - **Branch**: master (ou a branch principal)
   - **Comando de Build**: `pip install -r backend/scraper/requirements.txt`
   - **Comando de Inicialização**: `cd backend/scraper && gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120`

### 3. Configurar Variáveis de Ambiente

Se você usou o deploy automático com o arquivo `render.yaml`, a maioria das variáveis já estará configurada. Caso contrário, configure manualmente:

1. No dashboard do seu serviço no Render, vá para "Environment"
2. Adicione as seguintes variáveis:
   - `SUPABASE_URL`: https://evzqzghxuttctbxgohpx.supabase.co
   - `SUPABASE_KEY`: sua-chave-do-supabase
   - `ALLOWED_ROULETTES`: * (asterisco para permitir todas as roletas)
   - `RENDER`: true
   - `PRODUCTION`: true
   - `DISABLE_SCRAPER`: false (mude para true se o scraper não funcionar)
   - `SIMULATE_DATA`: true (ativa a simulação de dados quando o scraper real não funciona)
   - `SCRAPE_INTERVAL_MINUTES`: 5
   - `MAX_CICLOS`: 0

### 4. Verificar o Deploy

Após o deploy ser concluído:

1. Acesse a URL do seu serviço (ex: https://runcash-backend.onrender.com)
2. Verifique o endpoint de saúde em `/health` para confirmar que está funcionando
3. Teste o endpoint SSE em `/events` usando um cliente como Postman ou diretamente pelo navegador

### 5. Configurar o Frontend

No seu projeto frontend na Vercel:

1. Acesse as configurações do projeto
2. Em "Environment Variables", adicione:
   - `VITE_SSE_SERVER_URL`: https://runcash-backend.onrender.com/events (substituindo pelo seu domínio real)
3. Reimplante o frontend

## Troubleshooting

### O Selenium não funciona no Render

O Render pode ter limitações para executar o Chrome em modo headless. Se o scraper não estiver funcionando:

1. Verifique os logs para identificar erros específicos
2. Ative a simulação de dados definindo `SIMULATE_DATA` como "true"
3. Opcionalmente, desabilite o scraper definindo `DISABLE_SCRAPER` como "true"

#### Modo de Simulação

O modo de simulação gera números aleatórios para roletas predefinidas em intervalos aleatórios (30-120 segundos). Isso é útil para:

- Testar a aplicação quando o scraper real não funciona
- Desenvolvimento e testes sem precisar interagir com o site externo
- Garantir que o frontend receba eventos mesmo quando há problemas com o Selenium

### Monitorando Logs

Para verificar logs e diagnosticar problemas:

1. No dashboard do Render, vá para seu serviço
2. Clique na aba "Logs"
3. Você verá os logs em tempo real

## Plano Gratuito vs. Pago

O plano gratuito do Render tem algumas limitações:

- O serviço "hiberna" após 15 minutos de inatividade
- Recursos de CPU e memória limitados
- 750 horas/mês de uso

Se você precisa de um serviço que não hiberne e tenha mais recursos, considere o plano "Starter" a partir de $7/mês.

## Recursos Adicionais

- [Documentação do Render para Python](https://render.com/docs/deploy-python)
- [Documentação do Flask](https://flask.palletsprojects.com/)
- [Configurando CORS com Flask](https://flask-cors.readthedocs.io/) 