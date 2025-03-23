# Instruções para Deploy do Projeto RunCash

Este guia fornece instruções detalhadas para colocar cada componente do projeto RunCash online.

## 1. Deploy do Frontend (Vercel)

1. Acesse [Vercel](https://vercel.com/) e faça login (ou crie uma conta).
2. Clique em "Add New" > "Project".
3. Importe seu repositório Git (GitHub, GitLab ou Bitbucket).
4. Configure o projeto:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Root Directory: `frontend`
5. Configure as variáveis de ambiente em "Environment Variables":
   - `VITE_SUPABASE_URL` = URL do seu projeto Supabase
   - `VITE_SUPABASE_KEY` = Chave pública (anon key) do Supabase
   - `VITE_API_URL` = URL da sua API (do próximo passo)
6. Clique em "Deploy".

## 2. Deploy da API Backend (Railway)

1. Acesse [Railway](https://railway.app/) e faça login (ou crie uma conta).
2. Clique em "New Project" > "Deploy from GitHub repo".
3. Selecione seu repositório.
4. Configure o serviço:
   - Root Directory: `backend/api`
   - Start Command: `npm start`
5. Configure as variáveis de ambiente:
   - `SUPABASE_URL` = URL do seu projeto Supabase
   - `SUPABASE_KEY` = Chave de serviço do Supabase (service_role key)
   - `PORT` = 3001
6. Gere um domínio em "Settings" > "Domains".
7. Anote a URL gerada para usar no frontend.

## 3. Deploy do Scraper (GitHub Actions)

1. No seu repositório GitHub, vá para "Settings" > "Secrets and variables" > "Actions".
2. Adicione os seguintes secrets:
   - `SUPABASE_URL` = URL do seu projeto Supabase
   - `SUPABASE_KEY` = Chave de serviço do Supabase (service_role key)
   - `ALLOWED_ROULETTES` = 2010016,2380335,2010065,2010096,2010017,2010098
3. O arquivo de workflow `.github/workflows/scraper.yml` já foi criado.
4. O scraper será executado automaticamente a cada 5 minutos.

## 4. Configuração do Supabase

Se você ainda não tem um projeto Supabase:

1. Acesse [Supabase](https://supabase.com/) e faça login (ou crie uma conta).
2. Crie um novo projeto.
3. Anote a URL do projeto e as chaves (anon key e service_role key).
4. Crie as tabelas necessárias (consulte a estrutura da base de dados nos arquivos do scraper).

## 5. Atualizando Variáveis de Ambiente

Depois de obter a URL da API, volte ao projeto do frontend no Vercel e atualize a variável `VITE_API_URL` com a URL real.

## 6. Testando o Deploy

1. Acesse a URL do frontend fornecida pelo Vercel.
2. Verifique se os dados das roletas estão sendo exibidos corretamente.
3. Monitore os logs do scraper no GitHub Actions para garantir que está funcionando.

## Observações

- O GitHub Actions executa o scraper a cada 5 minutos, mas tem um limite mensal de minutos de execução para contas gratuitas.
- Para uma solução 24/7 mais robusta, considere hospedar o scraper em um VPS como mencionado no README.
- Mantenha suas chaves do Supabase seguras e nunca compartilhe a chave de serviço publicamente. 