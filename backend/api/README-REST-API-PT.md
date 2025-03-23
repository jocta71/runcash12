# Documentação da API REST

Este documento fornece uma visão geral dos endpoints da API REST disponíveis na aplicação RunCash.

## URL Base

Todos os endpoints da API são relativos à URL base:

```
/api/rest
```

## Autenticação

Atualmente, os endpoints da API são públicos e não requerem autenticação. A autenticação por API Key está desativada no momento, mas será implementada no futuro.

## Endpoints

### Itens

#### Obter Todos os Itens

```
GET /api/rest/items
```

Retorna uma lista de todos os itens.

**Resposta**

```json
[
  {
    "id": 1,
    "name": "Item 1",
    "description": "Descrição do item 1",
    "createdAt": "2023-03-11T12:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Item 2",
    "description": "Descrição do item 2",
    "createdAt": "2023-03-11T12:05:00.000Z"
  }
]
```

#### Obter Item por ID

```
GET /api/rest/items/:id
```

Retorna um único item pelo seu ID.

**Parâmetros**

- `id` (parâmetro de caminho) - O ID do item a ser recuperado

**Resposta**

```json
{
  "id": 1,
  "name": "Item 1",
  "description": "Descrição do item 1",
  "createdAt": "2023-03-11T12:00:00.000Z"
}
```

**Respostas de Erro**

- `404 Not Found` - Se o item com o ID especificado não existir
- `400 Bad Request` - Se o ID for inválido

#### Criar Item

```
POST /api/rest/items
```

Cria um novo item.

**Corpo da Requisição**

```json
{
  "name": "Novo Item",
  "description": "Descrição do novo item"
}
```

**Resposta**

```json
{
  "id": 3,
  "name": "Novo Item",
  "description": "Descrição do novo item",
  "createdAt": "2023-03-12T15:30:00.000Z"
}
```

**Respostas de Erro**

- `400 Bad Request` - Se o corpo da requisição for inválido

#### Atualizar Item

```
PUT /api/rest/items/:id
```

Atualiza um item existente.

**Parâmetros**

- `id` (parâmetro de caminho) - O ID do item a ser atualizado

**Corpo da Requisição**

```json
{
  "name": "Nome do Item Atualizado",
  "description": "Descrição atualizada"
}
```

Ambos os campos são opcionais, mas pelo menos um deve ser fornecido.

**Resposta**

```json
{
  "id": 1,
  "name": "Nome do Item Atualizado",
  "description": "Descrição atualizada",
  "createdAt": "2023-03-11T12:00:00.000Z",
  "updatedAt": "2023-03-12T16:45:00.000Z"
}
```

**Respostas de Erro**

- `404 Not Found` - Se o item com o ID especificado não existir
- `400 Bad Request` - Se o corpo da requisição for inválido ou o ID for inválido

#### Excluir Item

```
DELETE /api/rest/items/:id
```

Exclui um item.

**Parâmetros**

- `id` (parâmetro de caminho) - O ID do item a ser excluído

**Resposta**

```json
{
  "message": "Item 1 excluído com sucesso"
}
```

**Respostas de Erro**

- `404 Not Found` - Se o item com o ID especificado não existir
- `400 Bad Request` - Se o ID for inválido

## Tratamento de Erros

Todos os endpoints retornam códigos de status HTTP apropriados:

- `200 OK` - A requisição foi bem-sucedida
- `201 Created` - Um novo recurso foi criado com sucesso
- `400 Bad Request` - A requisição não pôde ser entendida ou estava faltando parâmetros obrigatórios
- `404 Not Found` - O recurso solicitado não foi encontrado
- `500 Internal Server Error` - Ocorreu um erro no servidor

As respostas de erro terão o seguinte formato:

```json
{
  "error": {
    "message": "Mensagem de erro",
    "errors": ["Detalhes específicos do erro"] // Opcional
  }
}
```

## Testando a API

Você pode testar a API usando ferramentas como [Postman](https://www.postman.com/) ou [curl](https://curl.se/).

Por exemplo, para obter todos os itens usando curl:

```bash
curl -X GET http://localhost:3002/api/rest/items
```

Para criar um novo item:

```bash
curl -X POST http://localhost:3002/api/rest/items \
     -H "Content-Type: application/json" \
     -d '{"name": "Novo Item", "description": "Descrição do novo item"}'
```

Para acesso via LocalTunnel, uma vez que você tenha configurado um túnel, você pode usar essa URL:

```bash
curl -X GET https://seu-subdominio.loca.lt/api/rest/items
``` 