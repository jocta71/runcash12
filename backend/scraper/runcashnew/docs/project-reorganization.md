# Reorganização do Projeto RunCash

Este documento descreve a estrutura atual do projeto e propõe uma reorganização para melhorar a manutenibilidade e separação clara entre frontend e backend.

## Estrutura Atual

A estrutura atual do projeto contém arquivos e diretórios misturados, com vários componentes redundantes:

```
/
├── .git/
├── api/                    <- APIs de pagamento na raiz
├── backend/
│   ├── api/                <- API principal do backend
│   ├── scraper/            <- Scraper para coleta de dados
│   └── ...
├── frontend/
│   ├── api/                <- APIs serverless no frontend
│   ├── src/                <- Código fonte do frontend
│   ├── public/             <- Arquivos estáticos
│   └── ...
├── lib/                    <- Bibliotecas compartilhadas (quase vazias)
├── src/                    <- Diretório src redundante na raiz
├── node_modules/           <- Dependências do Node.js
├── package.json            <- Configuração do projeto (raiz)
├── package-lock.json       <- Lock file de dependências
├── vercel.json             <- Configuração do Vercel (redundante)
├── *.md                    <- Vários arquivos de documentação
├── *.js                    <- Scripts de utilitários
├── *.py                    <- Scripts de ferramentas Python
└── *.ps1                   <- Scripts PowerShell
```

## Problemas Identificados

1. **Duplicação de arquivos de configuração** - vercel.json está na raiz e no diretório frontend
2. **Mistura entre frontend e backend** - Código e utilitários misturados na raiz
3. **Diretórios redundantes** - src/ e lib/ na raiz parecem ser resquícios de versões anteriores
4. **Scripts soltos** - Vários scripts de utilitários espalhados na raiz
5. **Arquivos API em vários lugares** - APIs relacionadas a pagamento estão na raiz e no frontend

## Estrutura Proposta

```
/
├── .git/
├── frontend/               <- Tudo relacionado ao frontend
│   ├── api/                <- APIs serverless do frontend
│   ├── src/                <- Código fonte do frontend
│   ├── public/             <- Arquivos estáticos
│   ├── .env.example        <- Exemplo de variáveis de ambiente
│   ├── package.json        <- Dependências do frontend
│   └── ...
├── backend/                <- Tudo relacionado ao backend
│   ├── api/                <- API principal do backend
│   │   ├── payment/        <- APIs de pagamento (movidas da raiz)
│   │   └── ...
│   ├── scraper/            <- Scraper para coleta de dados
│   ├── .env.example        <- Exemplo de variáveis de ambiente
│   ├── package.json        <- Dependências do backend
│   └── ...
├── docs/                   <- Documentação centralizada
│   ├── deployment.md       <- Instruções de deployment
│   ├── api.md              <- Documentação da API
│   └── ...
├── scripts/                <- Scripts utilitários organizados
│   ├── db/                 <- Scripts relacionados a banco de dados
│   ├── maintenance/        <- Scripts de manutenção
│   └── ...
├── .gitignore              <- Configuração global do Git
├── README.md               <- Documentação principal do projeto
└── package.json            <- Apenas com scripts para iniciar frontend e backend
```

## Plano de Implementação

1. **Migrar APIs de pagamento** da raiz para `backend/api/payment/`
2. **Mover scripts utilitários** para o diretório `scripts/` organizado por categoria
3. **Consolidar documentação** no diretório `docs/`
4. **Remover diretórios redundantes** como src/ e lib/ na raiz
5. **Atualizar caminhos e dependências** nos arquivos importados
6. **Simplificar package.json** raiz para facilitar execução de todo o projeto

Este plano preserva todos os arquivos funcionais do projeto, apenas reorganizando-os em uma estrutura mais lógica e fácil de manter. 