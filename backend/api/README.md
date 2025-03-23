# RunCash API

Esta API serve como intermediário entre o scraper de roletas e o frontend da aplicação RunCash.

## Estrutura

- `index.js`: Arquivo principal que contém a configuração do servidor Express e as rotas da API
- `package.json`: Dependências e scripts do projeto
- `.env`: Variáveis de ambiente (URL e chave do Supabase, porta do servidor)

## Endpoints

### GET /api/roletas

Retorna todas as roletas cadastradas no banco de dados Supabase.

Exemplo de resposta:
```json
[
  {
    "id": "roleta-123",
    "nome": "Roleta Brasileira",
    "numeros": [7, 11, 23, 5, 18],
    "updated_at": "2023-10-15T14:30:00.000Z"
  },
  {
    "id": "roleta-456",
    "nome": "Roleta Europeia",
    "numeros": [32, 15, 3, 26, 8],
    "updated_at": "2023-10-15T14:30:00.000Z"
  }
]
```

### GET /api/roletas/:id

Retorna uma roleta específica pelo seu ID.

Exemplo de resposta:
```json
{
  "id": "roleta-123",
  "nome": "Roleta Brasileira",
  "numeros": [7, 11, 23, 5, 18],
  "updated_at": "2023-10-15T14:30:00.000Z"
}
```

## Instalação e Execução

1. Instale as dependências:
```
npm install
```

2. Configure as variáveis de ambiente no arquivo `.env`:
```
SUPABASE_URL=sua_url_do_supabase
SUPABASE_KEY=sua_chave_do_supabase
PORT=3001
```

3. Inicie o servidor:
```
npm start
```

Para desenvolvimento com reinicialização automática:
```
npm run dev
```

## Integração com o Frontend

O frontend se conecta a esta API através do serviço `rouletteService.ts`, que fornece funções para buscar os dados das roletas.
