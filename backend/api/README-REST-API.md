# REST API Documentation

This document provides an overview of the REST API endpoints available in the RunCash application.

## Base URL

All API endpoints are relative to the base URL:

```
/api/rest
```

## Authentication

Currently, the API endpoints are public and do not require authentication. API Key authentication is currently disabled but will be implemented in the future.

## Endpoints

### Items

#### Get All Items

```
GET /api/rest/items
```

Returns a list of all items.

**Response**

```json
[
  {
    "id": 1,
    "name": "Item 1",
    "description": "Description for item 1",
    "createdAt": "2023-03-11T12:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Item 2",
    "description": "Description for item 2",
    "createdAt": "2023-03-11T12:05:00.000Z"
  }
]
```

#### Get Item by ID

```
GET /api/rest/items/:id
```

Returns a single item by its ID.

**Parameters**

- `id` (path parameter) - The ID of the item to retrieve

**Response**

```json
{
  "id": 1,
  "name": "Item 1",
  "description": "Description for item 1",
  "createdAt": "2023-03-11T12:00:00.000Z"
}
```

**Error Responses**

- `404 Not Found` - If the item with the specified ID does not exist
- `400 Bad Request` - If the ID is invalid

#### Create Item

```
POST /api/rest/items
```

Creates a new item.

**Request Body**

```json
{
  "name": "New Item",
  "description": "Description for the new item"
}
```

**Response**

```json
{
  "id": 3,
  "name": "New Item",
  "description": "Description for the new item",
  "createdAt": "2023-03-12T15:30:00.000Z"
}
```

**Error Responses**

- `400 Bad Request` - If the request body is invalid

#### Update Item

```
PUT /api/rest/items/:id
```

Updates an existing item.

**Parameters**

- `id` (path parameter) - The ID of the item to update

**Request Body**

```json
{
  "name": "Updated Item Name",
  "description": "Updated description"
}
```

Both fields are optional, but at least one must be provided.

**Response**

```json
{
  "id": 1,
  "name": "Updated Item Name",
  "description": "Updated description",
  "createdAt": "2023-03-11T12:00:00.000Z",
  "updatedAt": "2023-03-12T16:45:00.000Z"
}
```

**Error Responses**

- `404 Not Found` - If the item with the specified ID does not exist
- `400 Bad Request` - If the request body is invalid or the ID is invalid

#### Delete Item

```
DELETE /api/rest/items/:id
```

Deletes an item.

**Parameters**

- `id` (path parameter) - The ID of the item to delete

**Response**

```json
{
  "message": "Item 1 deleted successfully"
}
```

**Error Responses**

- `404 Not Found` - If the item with the specified ID does not exist
- `400 Bad Request` - If the ID is invalid

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - The request was successful
- `201 Created` - A new resource was successfully created
- `400 Bad Request` - The request could not be understood or was missing required parameters
- `404 Not Found` - The requested resource could not be found
- `500 Internal Server Error` - An error occurred on the server

Error responses will have the following format:

```json
{
  "error": {
    "message": "Error message",
    "errors": ["Specific error details"] // Optional
  }
}
```

## Testing the API

You can test the API using tools like [Postman](https://www.postman.com/) or [curl](https://curl.se/).

For example, to get all items using curl:

```bash
curl -X GET http://localhost:3002/api/rest/items
```

To create a new item:

```bash
curl -X POST http://localhost:3002/api/rest/items \
     -H "Content-Type: application/json" \
     -d '{"name": "New Item", "description": "Description for the new item"}'
``` 