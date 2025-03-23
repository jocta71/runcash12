# Documentação da API de Eventos

Este documento fornece uma visão geral dos endpoints da API de Eventos disponíveis na aplicação RunCash.

## URL Base

Todos os endpoints da API são relativos à URL base:

```
/api/events
```

## Autenticação

Atualmente, os endpoints da API são públicos e não requerem autenticação. A autenticação por API Key está desativada no momento, mas será implementada no futuro.

## Endpoints

### Obter Todos os Eventos

```
GET /api/events
```

Retorna uma lista de todos os eventos.

**Resposta**

```json
[
  {
    "id": 1,
    "title": "Evento 1",
    "description": "Descrição do evento 1",
    "date": "2023-04-15T10:00:00.000Z",
    "location": "Online",
    "createdAt": "2023-03-11T12:00:00.000Z"
  },
  {
    "id": 2,
    "title": "Evento 2",
    "description": "Descrição do evento 2",
    "date": "2023-04-20T14:30:00.000Z",
    "location": "Sala de Conferência A",
    "createdAt": "2023-03-11T12:05:00.000Z"
  }
]
```

### Obter Eventos Futuros

```
GET /api/events/upcoming
```

Retorna uma lista de eventos agendados para o futuro, ordenados por data (mais próximos primeiro).

**Resposta**

```json
[
  {
    "id": 1,
    "title": "Evento 1",
    "description": "Descrição do evento 1",
    "date": "2023-04-15T10:00:00.000Z",
    "location": "Online",
    "createdAt": "2023-03-11T12:00:00.000Z"
  },
  {
    "id": 2,
    "title": "Evento 2",
    "description": "Descrição do evento 2",
    "date": "2023-04-20T14:30:00.000Z",
    "location": "Sala de Conferência A",
    "createdAt": "2023-03-11T12:05:00.000Z"
  }
]
```

### Obter Evento por ID

```
GET /api/events/:id
```

Retorna um único evento pelo seu ID.

**Parâmetros**

- `id` (parâmetro de caminho) - O ID do evento a ser recuperado

**Resposta**

```json
{
  "id": 1,
  "title": "Evento 1",
  "description": "Descrição do evento 1",
  "date": "2023-04-15T10:00:00.000Z",
  "location": "Online",
  "createdAt": "2023-03-11T12:00:00.000Z"
}
```

**Respostas de Erro**

- `404 Not Found` - Se o evento com o ID especificado não existir
- `400 Bad Request` - Se o ID for inválido

### Criar Evento

```
POST /api/events
```

Cria um novo evento.

**Corpo da Requisição**

```json
{
  "title": "Novo Evento",
  "description": "Descrição do novo evento",
  "date": "2023-05-01T09:00:00.000Z",
  "location": "Sala de Reuniões 3"
}
```

**Resposta**

```json
{
  "id": 3,
  "title": "Novo Evento",
  "description": "Descrição do novo evento",
  "date": "2023-05-01T09:00:00.000Z",
  "location": "Sala de Reuniões 3",
  "createdAt": "2023-03-12T15:30:00.000Z"
}
```

**Respostas de Erro**

- `400 Bad Request` - Se o corpo da requisição for inválido

### Atualizar Evento

```
PUT /api/events/:id
```

Atualiza um evento existente.

**Parâmetros**

- `id` (parâmetro de caminho) - O ID do evento a ser atualizado

**Corpo da Requisição**

```json
{
  "title": "Título do Evento Atualizado",
  "description": "Descrição atualizada",
  "date": "2023-05-02T10:00:00.000Z",
  "location": "Nova Localização"
}
```

Todos os campos são opcionais, mas pelo menos um deve ser fornecido.

**Resposta**

```json
{
  "id": 1,
  "title": "Título do Evento Atualizado",
  "description": "Descrição atualizada",
  "date": "2023-05-02T10:00:00.000Z",
  "location": "Nova Localização",
  "createdAt": "2023-03-11T12:00:00.000Z",
  "updatedAt": "2023-03-12T16:45:00.000Z"
}
```

**Respostas de Erro**

- `404 Not Found` - Se o evento com o ID especificado não existir
- `400 Bad Request` - Se o corpo da requisição for inválido ou o ID for inválido

### Excluir Evento

```
DELETE /api/events/:id
```

Exclui um evento.

**Parâmetros**

- `id` (parâmetro de caminho) - O ID do evento a ser excluído

**Resposta**

```json
{
  "message": "Evento 1 excluído com sucesso"
}
```

**Respostas de Erro**

- `404 Not Found` - Se o evento com o ID especificado não existir
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

Por exemplo, para obter todos os eventos usando curl:

```bash
curl -X GET http://localhost:3002/api/events
```

Para criar um novo evento:

```bash
curl -X POST http://localhost:3002/api/events \
     -H "Content-Type: application/json" \
     -d '{"title": "Novo Evento", "description": "Descrição do novo evento", "date": "2023-05-01T09:00:00.000Z", "location": "Sala de Reuniões 3"}'
```

Para acesso via LocalTunnel, uma vez que você tenha configurado um túnel, você pode usar essa URL:

```bash
curl -X GET https://seu-subdominio.loca.lt/api/events
``` 