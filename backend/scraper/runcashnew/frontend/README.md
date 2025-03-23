# RunCash Frontend

Interface de usuário para o sistema RunCash de rastreamento de roletas.

## Recursos

- Visualização em tempo real dos números da roleta
- Autenticação com email/senha e provedores sociais
- Sugestões de estratégia
- Design responsivo para todos os dispositivos
- Dashboard de estatísticas

## Stack Tecnológico

- React com TypeScript
- Vite para ferramentas de build
- Tailwind CSS para estilização
- Supabase para autenticação
- React Router para navegação
- Componentes UI Shadcn

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

## Configuração

Crie um arquivo `.env` no diretório frontend com as seguintes variáveis:

```
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_KEY=sua_chave_anon_supabase
VITE_API_URL=sua_url_api
```

Para produção, certifique-se de definir essas variáveis de ambiente na sua plataforma de hospedagem.

## Estrutura de Diretórios

```
frontend/
├── api/                # Funções serverless (Vercel/Netlify)
├── public/             # Arquivos estáticos
├── src/
│   ├── components/     # Componentes React reutilizáveis
│   ├── context/        # Contextos React (auth, subscription)
│   ├── hooks/          # Hooks personalizados
│   ├── integrations/   # Integrações com serviços (Supabase, Stripe)
│   ├── lib/            # Bibliotecas utilitárias
│   ├── pages/          # Páginas/componentes de rota
│   ├── services/       # Serviços (EventService para SSE)
│   ├── types/          # Definições de tipos TypeScript
│   └── utils/          # Funções utilitárias
└── ...
```

## Leia Também

Para mais informações sobre backend e scraper, consulte os respectivos README em seus diretórios. 