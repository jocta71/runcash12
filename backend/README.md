# RunCash Backend

Este diretório contém dois componentes principais:
1. **API:** Servidor Express.js para servir dados das roletas
2. **Scraper:** Script Python para coletar dados das roletas

## API

A API serve como intermediário entre o frontend e o banco de dados Supabase. Ela fornece endpoints para acessar dados das roletas.

### Endpoints

- `GET /api/roletas` - Obter todas as roletas
- `GET /api/roletas/latest` - Obter números mais recentes de todas as roletas
- `GET /api/roletas/:id` - Obter detalhes de uma roleta específica
- `GET /api/health` - Endpoint de verificação de saúde

### Desenvolvimento Local

```bash
cd api
npm install
npm start
```

### Configuração

Crie um arquivo `.env` no diretório api com:

```
SUPABASE_URL=sua_url_supabase
SUPABASE_KEY=sua_chave_supabase
PORT=3001
```

## Scraper

O scraper coleta dados de roletas online e os armazena no Supabase.

### Execução Local

```bash
cd scraper
pip install -r requirements.txt
python app.py
```

### Configuração

Crie um arquivo `.env` no diretório scraper com:

```
SUPABASE_URL=sua_url_supabase
SUPABASE_KEY=sua_chave_supabase
SCRAPE_INTERVAL_MINUTES=5
ALLOWED_ROULETTES=2010016,2380335,2010065,2010096,2010017,2010098
```

### Estrutura do Scraper

```
scraper/
├── app.py              # Script principal
├── config.py           # Configurações e constantes
├── strategy_analyzer.py # Análise de estratégias
└── ...
```

## Pagamentos (API)

Os endpoints de pagamento estão localizados em `api/payment/` e integram-se com:

- Stripe para pagamentos internacionais
- Asaas para pagamentos brasileiros

### Endpoints de Pagamento

- `/api/payment/create-checkout-session` - Criar sessão de checkout
- `/api/payment/webhook` - Webhook para notificações de pagamento

Consulte a documentação em `docs/STRIPE_SETUP.md` e `docs/API_KEYS.md` para detalhes de configuração.

## Estrutura de Diretórios

```
backend/
├── api/                # API Express.js
│   ├── payment/        # Endpoints de processamento de pagamento
│   └── ...
├── scraper/            # Scraper Python
└── ...
``` 