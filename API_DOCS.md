# Smart Library API Documentation

Base URL:

```text
http://localhost:3000/api
```

JWT-protected routes use:

```http
Authorization: Bearer <accessToken>
```

## Health

```http
GET /health
```

Response:

```json
{ "message": "Server is healthy" }
```

## Auth

```http
POST /auth/register
```

Body:

```json
{
  "firstName": "Alex",
  "lastName": "Reader",
  "email": "alex@example.com",
  "password": "password123"
}
```

Response `201`:

```json
{
  "accessToken": "jwt-token",
  "user": {
    "id": "user-id",
    "fullName": "Alex Reader",
    "firstName": "Alex",
    "lastName": "Reader",
    "email": "alex@example.com",
    "role": "user"
  }
}
```

```http
POST /auth/login
```

Body:

```json
{
  "email": "alex@example.com",
  "password": "password123"
}
```

Response `200`:

```json
{
  "accessToken": "jwt-token",
  "user": {
    "id": "user-id",
    "fullName": "Alex Reader",
    "firstName": "Alex",
    "lastName": "Reader",
    "email": "alex@example.com",
    "role": "user"
  }
}
```

```http
GET /auth/me
POST /auth/logout
```

`GET /auth/me` returns the current user. `POST /auth/logout` returns `204`.

## Profile

```http
GET /profile/me
PUT /profile/me
```

Update body:

```json
{
  "firstName": "Alex",
  "lastName": "Reader"
}
```

Profile responses return:

```json
{
  "id": "user-id",
  "fullName": "Alex Reader",
  "firstName": "Alex",
  "lastName": "Reader",
  "email": "alex@example.com"
}
```

## Categories

```http
GET /categories
GET /categories/:id
```

Public read response:

```json
[
  {
    "id": "category-id",
    "name": "Software Engineering"
  }
]
```

Admin-only write routes:

```http
POST /categories
PUT /categories/:id
DELETE /categories/:id
```

Create/update body:

```json
{
  "name": "Software Engineering"
}
```

Create/update responses return the category directly. Delete returns `204`.

## Demo Seed Accounts

```text
admin@library.local / password123
user@library.local / password123
```
