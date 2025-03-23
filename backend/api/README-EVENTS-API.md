# Events API Documentation

This document provides an overview of the Events API endpoints available in the RunCash application.

## Base URL

All API endpoints are relative to the base URL:

```
/api/events
```

## Authentication

Currently, the API endpoints are public and do not require authentication. API Key authentication is currently disabled but will be implemented in the future.

## Endpoints

### Get All Events

```
GET /api/events
```

Returns a list of all events.

**Response**

```json
[
  {
    "id": 1,
    "title": "Event 1",
    "description": "Description for event 1",
    "date": "2023-04-15T10:00:00.000Z",
    "location": "Online",
    "createdAt": "2023-03-11T12:00:00.000Z"
  },
  {
    "id": 2,
    "title": "Event 2",
    "description": "Description for event 2",
    "date": "2023-04-20T14:30:00.000Z",
    "location": "Conference Room A",
    "createdAt": "2023-03-11T12:05:00.000Z"
  }
]
```

### Get Upcoming Events

```
GET /api/events/upcoming
```

Returns a list of events that are scheduled for the future, sorted by date (earliest first).

**Response**

```json
[
  {
    "id": 1,
    "title": "Event 1",
    "description": "Description for event 1",
    "date": "2023-04-15T10:00:00.000Z",
    "location": "Online",
    "createdAt": "2023-03-11T12:00:00.000Z"
  },
  {
    "id": 2,
    "title": "Event 2",
    "description": "Description for event 2",
    "date": "2023-04-20T14:30:00.000Z",
    "location": "Conference Room A",
    "createdAt": "2023-03-11T12:05:00.000Z"
  }
]
```

### Get Event by ID

```
GET /api/events/:id
```

Returns a single event by its ID.

**Parameters**

- `id` (path parameter) - The ID of the event to retrieve

**Response**

```json
{
  "id": 1,
  "title": "Event 1",
  "description": "Description for event 1",
  "date": "2023-04-15T10:00:00.000Z",
  "location": "Online",
  "createdAt": "2023-03-11T12:00:00.000Z"
}
```

**Error Responses**

- `404 Not Found` - If the event with the specified ID does not exist
- `400 Bad Request` - If the ID is invalid

### Create Event

```
POST /api/events
```

Creates a new event.

**Request Body**

```json
{
  "title": "New Event",
  "description": "Description for the new event",
  "date": "2023-05-01T09:00:00.000Z",
  "location": "Meeting Room 3"
}
```

**Response**

```json
{
  "id": 3,
  "title": "New Event",
  "description": "Description for the new event",
  "date": "2023-05-01T09:00:00.000Z",
  "location": "Meeting Room 3",
  "createdAt": "2023-03-12T15:30:00.000Z"
}
```

**Error Responses**

- `400 Bad Request` - If the request body is invalid

### Update Event

```
PUT /api/events/:id
```

Updates an existing event.

**Parameters**

- `id` (path parameter) - The ID of the event to update

**Request Body**

```json
{
  "title": "Updated Event Title",
  "description": "Updated description",
  "date": "2023-05-02T10:00:00.000Z",
  "location": "New Location"
}
```

All fields are optional, but at least one must be provided.

**Response**

```json
{
  "id": 1,
  "title": "Updated Event Title",
  "description": "Updated description",
  "date": "2023-05-02T10:00:00.000Z",
  "location": "New Location",
  "createdAt": "2023-03-11T12:00:00.000Z",
  "updatedAt": "2023-03-12T16:45:00.000Z"
}
```

**Error Responses**

- `404 Not Found` - If the event with the specified ID does not exist
- `400 Bad Request` - If the request body is invalid or the ID is invalid

### Delete Event

```
DELETE /api/events/:id
```

Deletes an event.

**Parameters**

- `id` (path parameter) - The ID of the event to delete

**Response**

```json
{
  "message": "Event 1 deleted successfully"
}
```

**Error Responses**

- `404 Not Found` - If the event with the specified ID does not exist
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

For example, to get all events using curl:

```bash
curl -X GET http://localhost:3002/api/events
```

To create a new event:

```bash
curl -X POST http://localhost:3002/api/events \
     -H "Content-Type: application/json" \
     -d '{"title": "New Event", "description": "Description for the new event", "date": "2023-05-01T09:00:00.000Z", "location": "Meeting Room 3"}'
```

For LocalTunnel access, once you have set up a tunnel, you can use that URL:

```bash
curl -X GET https://your-subdomain.loca.lt/api/events
``` 