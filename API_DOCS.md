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
PUT /profile/me/password
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
  "firstName": "Alex",
  "lastName": "Reader",
  "email": "alex@example.com"
}
```

Change password body:

```json
{
  "currentPassword": "password123",
  "newPassword": "newPassword123"
}
```

Successful password changes return:

```json
{
  "message": "Password changed successfully"
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

## Books

```http
GET /books
GET /books/:id
```

Optional list query params:

```text
q, categoryId, availability=available|online|waitlist|all, sort=title|author|newest|copies, page, pageSize
```

Book responses return the frontend shape directly:

```json
{
  "id": "book-id",
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "categoryId": "category-id",
  "availableCopies": 4,
  "totalCopies": 6,
  "publishedYear": 2008,
  "language": "English",
  "pages": 464,
  "isbn": "9780132350884",
  "shelfLocation": "A2-SW-014",
  "formats": ["Print", "E-book"],
  "readOnline": true,
  "description": "A practical guide...",
  "tags": ["Refactoring", "Testing"],
  "coverImage": "https://example.com/cover.jpg",
  "coverTone": "teal"
}
```

Admin-only write routes:

```http
POST /books
PUT /books/:id
DELETE /books/:id
```

Create/update uses the same book fields without `id`. Delete returns `204`.

## Borrowings

All borrowing routes require a JWT.

```http
GET /borrowings
GET /borrowings/:id
POST /borrowings
PATCH /borrowings/:id/return
```

Users see and return only their own borrowings. Admins can view and return all
borrowings, and can optionally pass `userId` when creating a borrowing for
someone else.

Create body:

```json
{
  "bookId": "book-id",
  "dueAt": "2026-05-04T10:00:00.000Z"
}
```

Borrowing responses return:

```json
{
  "id": "borrowing-id",
  "userId": "user-id",
  "user": {
    "id": "user-id",
    "firstName": "Alex",
    "lastName": "Reader",
    "name": "Alex Reader"
  },
  "bookId": "book-id",
  "borrowedAt": "2026-04-20T10:00:00.000Z",
  "dueAt": "2026-05-04T10:00:00.000Z",
  "returnedAt": null,
  "status": "active"
}
```

`user` is included on admin `GET /borrowings` responses so dashboards can show borrower names.

Borrowing decreases `availableCopies` by `1`; returning increases it by `1`.
Both operations run inside PostgreSQL transactions. A user cannot borrow the
same book again while their existing borrowing for that book is active or
overdue.

## Dashboard

```http
GET /dashboard/stats
```

This route requires a JWT. Admin users receive library-wide stats:

```json
{
  "role": "admin",
  "totalBooks": 12,
  "totalCopies": 40,
  "availableCopies": 28,
  "borrowedCopies": 12,
  "availableBooks": 10,
  "totalCategories": 5,
  "totalUsers": 17,
  "adminUsers": 2,
  "activeUsers": 6,
  "totalBorrowings": 31,
  "activeBorrowings": 8,
  "overdueBorrowings": 2,
  "returnedBorrowings": 21
}
```

Regular users receive stats for only their own borrowing history:

```json
{
  "role": "user",
  "totalBorrowings": 4,
  "activeBorrowings": 1,
  "overdueBorrowings": 1,
  "returnedBorrowings": 2,
  "currentBorrowings": 2,
  "dueSoonBorrowings": 1
}
```

`overdueBorrowings` is calculated from open borrowings whose `dueAt` is in the
past, even if the stored status has not been refreshed yet.

## Demo Seed Accounts

```text
aldi@admin.com / password123
aldi@user.com / password123
```
