# Smart Library Backend Overview

## Purpose

This backend belongs to the **Smart Library Management System**. The frontend is in the separate `lab2-web` project, and the backend should live in the separate API project, such as `lab2-api`.

The backend must provide a REST API for:

- user registration and login
- authenticated user sessions
- admin book management
- category management
- borrowing and returning books
- profile data
- dashboard statistics
- activity logs and notifications

The frontend already has API client files prepared for these features, so the backend response shapes should match the frontend TypeScript types.

## Current API Project Note

The existing `lab2-api` backend appears to be based on a Habit Tracker API template. It already has useful backend infrastructure:

- Express server
- TypeScript
- Drizzle ORM
- PostgreSQL connection
- JWT helpers
- bcrypt password helpers
- auth middleware
- route/controller structure
- test setup

Keep the useful infrastructure, but replace the habit/tag domain with the Smart Library domain:

- replace `habits` with `books`
- replace `tags` with `categories`
- add `borrowings`
- adjust `users`
- add optional MongoDB models for logs and notifications

## Tech Stack

Use:

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Drizzle ORM
- MongoDB for logs/notifications/future AI history
- JWT authentication
- bcrypt password hashing
- Zod validation
- Vitest/Supertest for API tests

## Base URL

The API should be mounted under:

```text
http://localhost:<api-port>/api
```

The frontend should use:

```env
VITE_API_URL=http://localhost:<api-port>/api
```

Example:

```env
VITE_API_URL=http://localhost:3001/api
```

Then a frontend call to `/auth/login` becomes:

```text
http://localhost:3001/api/auth/login
```

## Roles

There are two roles:

```ts
"admin" | "user"
```

Use these exact role names everywhere. Do not use `"member"` unless the frontend is also changed.

### Admin Can

- manage books
- manage categories
- view all borrowings
- return any borrowing
- view dashboard statistics
- view users if user management is added

### User Can

- register and log in
- browse books
- borrow available books
- return their own borrowed books
- view their own borrowing history
- view and update their profile

## PostgreSQL Data Model

### `users`

Stores authenticated users.

Fields:

| Field | Type | Notes |
|---|---|---|
| `id` | UUID/string | Primary key |
| `firstName` | string | Required |
| `lastName` | string | Required |
| `email` | string | Required, unique |
| `passwordHash` | string | Required, never return to frontend |
| `role` | enum | `"admin"` or `"user"` |
| `createdAt` | timestamp | Default now |
| `updatedAt` | timestamp | Updated on change |

Frontend shape:

```ts
type AuthUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: "admin" | "user"
}
```

### `categories`

Stores book categories.

Fields:

| Field | Type | Notes |
|---|---|---|
| `id` | UUID/string | Primary key |
| `name` | string | Required, unique |
| `createdAt` | timestamp | Default now |
| `updatedAt` | timestamp | Updated on change |

Frontend shape:

```ts
type Category = {
  id: string
  name: string
}
```

### `books`

Stores catalogue records.

Fields:

| Field | Type | Notes |
|---|---|---|
| `id` | UUID/string | Primary key |
| `title` | string | Required |
| `author` | string | Required |
| `categoryId` | UUID/string | Foreign key to `categories.id` |
| `availableCopies` | integer | Must be `>= 0` |
| `totalCopies` | integer | Must be `>= 1` |
| `publishedYear` | integer | Required |
| `language` | string | Required |
| `pages` | integer | Required, must be `>= 1` |
| `isbn` | string | Unique if provided |
| `shelfLocation` | string | Example: `A2-SW-014` |
| `formats` | array/json | Values: `"Print"`, `"E-book"`, `"Audiobook"` |
| `readOnline` | boolean | Whether digital access exists |
| `description` | text | Required |
| `tags` | array/json | Search/discovery tags |
| `coverImage` | string | URL/path to cover image |
| `coverTone` | string | Optional UI color tone |
| `createdAt` | timestamp | Default now |
| `updatedAt` | timestamp | Updated on change |

Frontend shape:

```ts
type Book = {
  id: string
  title: string
  author: string
  categoryId: string
  availableCopies: number
  totalCopies: number
  publishedYear: number
  language: string
  pages: number
  isbn: string
  shelfLocation: string
  formats: Array<"Print" | "E-book" | "Audiobook">
  readOnline: boolean
  description: string
  tags: string[]
  coverImage: string
  coverTone: string
}
```

Important rule:

```text
availableCopies must never be greater than totalCopies.
availableCopies must never be negative.
```

### `borrowings`

Stores book checkout records.

Fields:

| Field | Type | Notes |
|---|---|---|
| `id` | UUID/string | Primary key |
| `userId` | UUID/string | Foreign key to `users.id` |
| `bookId` | UUID/string | Foreign key to `books.id` |
| `borrowedAt` | timestamp | Default now |
| `dueAt` | timestamp | Required |
| `returnedAt` | timestamp/null | Null until returned |
| `status` | enum | `"active"`, `"returned"`, `"overdue"` |
| `createdAt` | timestamp | Default now |
| `updatedAt` | timestamp | Updated on change |

Frontend shape:

```ts
type Borrowing = {
  id: string
  userId: string
  bookId: string
  borrowedAt: string
  dueAt: string
  returnedAt: string | null
  status: "active" | "returned" | "overdue"
}
```

Borrowing rules:

- users can only borrow books with `availableCopies > 0`
- borrowing a book decreases `availableCopies` by `1`
- returning a book increases `availableCopies` by `1`
- borrowing and returning must use PostgreSQL transactions
- a returned borrowing cannot be returned again
- regular users can only view and return their own borrowings
- admins can view all borrowings

## MongoDB Collections

MongoDB is optional for the first backend phase, but it should be planned because the project overview includes both SQL and NoSQL.

### `activity_logs`

Used for flexible system events.

Fields:

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | MongoDB primary key |
| `userId` | string/null | User who caused the action |
| `action` | string | Example: `book.created`, `borrowing.returned` |
| `entityType` | string | Example: `book`, `category`, `borrowing` |
| `entityId` | string/null | Related entity |
| `metadata` | object | Flexible details |
| `createdAt` | date | Default now |

### `notifications`

Used for user notices.

Fields:

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | MongoDB primary key |
| `userId` | string | Target user |
| `title` | string | Required |
| `message` | string | Required |
| `type` | string | Example: `due-soon`, `overdue`, `system` |
| `readAt` | date/null | Null until read |
| `createdAt` | date | Default now |

### `ai_history`

Future feature for AI recommendations or smart search.

Fields:

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | MongoDB primary key |
| `userId` | string/null | Optional |
| `prompt` | string | User/system prompt |
| `response` | string | AI response |
| `relatedBookIds` | string[] | Optional related books |
| `createdAt` | date | Default now |

## Required REST Endpoints

The frontend currently calls simple JSON endpoints and expects the JSON response directly. Prefer returning the entity directly for simple queries instead of wrapping everything in `{ data: ... }`.

### Health

```http
GET /api/health
```

Response:

```json
{
  "message": "Server is healthy"
}
```

## Auth Endpoints

### Register

```http
POST /api/auth/register
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

Response:

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

### Login

```http
POST /api/auth/login
```

Body:

```json
{
  "email": "alex@example.com",
  "password": "password123"
}
```

Response:

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

### Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

Response:

```json
{
  "id": "user-id",
  "firstName": "Alex",
  "lastName": "Reader",
  "email": "alex@example.com",
  "role": "user"
}
```

### Logout

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

Response:

```http
204 No Content
```

If JWT is stateless, logout can simply return `204`. The frontend can remove the token locally.

## Book Endpoints

### List Books

```http
GET /api/books
```

Optional query params:

| Param | Example | Notes |
|---|---|---|
| `q` | `clean` | Search title, author, description, tags |
| `categoryId` | `cat-software` | Filter by category |
| `availability` | `available` | `available`, `online`, `waitlist`, `all` |
| `sort` | `title` | `title`, `author`, `newest`, `copies` |
| `page` | `1` | Optional |
| `pageSize` | `10` | Optional |

Simple response for current frontend:

```json
[
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
]
```

If paginated responses are added later, update the frontend first or provide a separate endpoint such as `/api/books/paginated`.

### Get Book By ID

```http
GET /api/books/:id
```

Response:

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

### Create Book

```http
POST /api/books
Authorization: Bearer <admin-token>
```

Admin only.

Body:

```json
{
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

Response:

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

### Update Book

```http
PUT /api/books/:id
Authorization: Bearer <admin-token>
```

Admin only. Return the updated book.

### Delete Book

```http
DELETE /api/books/:id
Authorization: Bearer <admin-token>
```

Admin only.

Response:

```http
204 No Content
```

## Category Endpoints

### List Categories

```http
GET /api/categories
```

Response:

```json
[
  {
    "id": "category-id",
    "name": "Software Engineering"
  }
]
```

### Get Category By ID

```http
GET /api/categories/:id
```

Response:

```json
{
  "id": "category-id",
  "name": "Software Engineering"
}
```

### Create Category

```http
POST /api/categories
Authorization: Bearer <admin-token>
```

Admin only.

Body:

```json
{
  "name": "Software Engineering"
}
```

Response:

```json
{
  "id": "category-id",
  "name": "Software Engineering"
}
```

### Update Category

```http
PUT /api/categories/:id
Authorization: Bearer <admin-token>
```

Admin only.

### Delete Category

```http
DELETE /api/categories/:id
Authorization: Bearer <admin-token>
```

Admin only.

Response:

```http
204 No Content
```

Do not delete a category if books still reference it unless the product decision is to reassign those books first.

## Borrowing Endpoints

### List Borrowings

```http
GET /api/borrowings
Authorization: Bearer <token>
```

Behavior:

- admin receives all borrowings
- user receives only their own borrowings

Response:

```json
[
  {
    "id": "borrowing-id",
    "userId": "user-id",
    "bookId": "book-id",
    "borrowedAt": "2026-04-20T10:00:00.000Z",
    "dueAt": "2026-05-04T10:00:00.000Z",
    "returnedAt": null,
    "status": "active"
  }
]
```

### Get Borrowing By ID

```http
GET /api/borrowings/:id
Authorization: Bearer <token>
```

Behavior:

- admin can access any borrowing
- user can access only their own borrowing

### Create Borrowing

```http
POST /api/borrowings
Authorization: Bearer <token>
```

Body for normal user:

```json
{
  "bookId": "book-id",
  "dueAt": "2026-05-04T10:00:00.000Z"
}
```

Optional admin body if admins can create borrowings for users:

```json
{
  "userId": "user-id",
  "bookId": "book-id",
  "dueAt": "2026-05-04T10:00:00.000Z"
}
```

Response:

```json
{
  "id": "borrowing-id",
  "userId": "user-id",
  "bookId": "book-id",
  "borrowedAt": "2026-04-20T10:00:00.000Z",
  "dueAt": "2026-05-04T10:00:00.000Z",
  "returnedAt": null,
  "status": "active"
}
```

Important:

- use the authenticated user ID by default
- do not trust `userId` from regular users
- reject borrowing when the book has `availableCopies === 0`
- update `availableCopies` inside the same transaction

### Return Borrowing

```http
PATCH /api/borrowings/:id/return
Authorization: Bearer <token>
```

Response:

```json
{
  "id": "borrowing-id",
  "userId": "user-id",
  "bookId": "book-id",
  "borrowedAt": "2026-04-20T10:00:00.000Z",
  "dueAt": "2026-05-04T10:00:00.000Z",
  "returnedAt": "2026-04-26T12:30:00.000Z",
  "status": "returned"
}
```

Important:

- do not allow returning the same borrowing twice
- increase the book `availableCopies` by `1`
- never increase `availableCopies` beyond `totalCopies`

## Profile Endpoints

### Get My Profile

```http
GET /api/profile/me
Authorization: Bearer <token>
```

Response:

```json
{
  "id": "user-id",
  "firstName": "Alex",
  "lastName": "Reader",
  "email": "alex@example.com"
}
```

### Update My Profile

```http
PUT /api/profile/me
Authorization: Bearer <token>
```

Body:

```json
{
  "firstName": "Alex",
  "lastName": "Reader"
}
```

Response:

```json
{
  "id": "user-id",
  "firstName": "Alex",
  "lastName": "Reader",
  "email": "alex@example.com"
}
```

## Dashboard Endpoints

### Get Dashboard Stats

```http
GET /api/dashboard/stats
Authorization: Bearer <token>
```

Admin response:

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

User response:

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

## Validation Rules

Validate all request bodies with Zod or Drizzle-Zod.

Important validation:

- `email` must be valid and unique
- `password` should be at least 8 characters
- `firstName` and `lastName` are required
- `role` must be `"admin"` or `"user"`
- category `name` is required and unique
- book `title`, `author`, `categoryId`, `language`, `description`, and `coverImage` are required
- `availableCopies >= 0`
- `totalCopies >= 1`
- `availableCopies <= totalCopies`
- `publishedYear` should be reasonable
- `pages >= 1`
- `formats` must contain at least one valid format
- borrowing `bookId` and `dueAt` are required
- users cannot borrow unavailable books

## Authentication And Security

Use JWT bearer tokens:

```http
Authorization: Bearer <token>
```

JWT payload should include:

```ts
{
  userId: string
  email: string
  role: "admin" | "user"
}
```

Security requirements:

- hash passwords with bcrypt
- never return `passwordHash`
- protect private endpoints with auth middleware
- add role middleware for admin endpoints
- configure CORS for the frontend URL
- keep secrets in `.env`
- use clear HTTP status codes

Required `.env` values:

```env
PORT=3001
DATABASE_URL=postgresql://...
JWT_SECRET=...
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/smart-library
```

## Error Response Format

Use consistent errors:

```json
{
  "error": "Validation failed",
  "message": "Available copies cannot be greater than total copies",
  "details": []
}
```

Recommended status codes:

| Status | Use |
|---|---|
| `200` | Successful read/update |
| `201` | Created |
| `204` | Deleted/logout success |
| `400` | Bad input |
| `401` | Missing/invalid authentication |
| `403` | Authenticated but not allowed |
| `404` | Entity not found |
| `409` | Conflict, duplicate email/name, unavailable book |
| `500` | Server error |

## Seed Data

Create seed data matching the current frontend mock data:

- one admin user
- initial categories:
  - Software Engineering
  - Data & AI
  - Product Design
  - Business & Leadership
  - Modern Fiction
- initial books based on the frontend mock books
- example borrowings for testing active, overdue, and returned statuses

Suggested users:

```text
admin@library.local / password123 / admin
user@library.local / password123 / user
```

## Frontend Integration Notes

The frontend currently has these API files:

- `src/features/authentication/api.mutation.ts`
- `src/features/authentication/api.queries.ts`
- `src/features/books/api.queries.ts`
- `src/features/books/api.mutation.ts`
- `src/features/categories/api.queries.ts`
- `src/features/categories/api.mutation.ts`
- `src/features/borrowings/api.queries.ts`
- `src/features/borrowings/api.mutation.ts`
- `src/features/profile/api.queries.ts`
- `src/features/profile/api.mutation.ts`
- `src/features/dashboard/api.queries.ts`
- `src/features/dashboard/api.mutation.ts`

The frontend still needs a few integration changes after the backend exists:

- replace the books mock store with HTTP calls
- replace public collection mock data with `/books` and `/categories`
- connect real login/register forms to `/auth/login` and `/auth/register`
- store the JWT token after login
- send `Authorization: Bearer <token>` from the frontend HTTP client
- replace demo Zustand auth with real `/auth/me` session loading
- align all frontend roles to `"admin" | "user"`

## Suggested Backend Folder Structure

```text
src/
  controllers/
    authController.ts
    bookController.ts
    categoryController.ts
    borrowingController.ts
    profileController.ts
    dashboardController.ts
  db/
    connection.ts
    schema.ts
    seed.ts
  middleware/
    auth.ts
    requireRole.ts
    validation.ts
    errorHandler.ts
  mongo/
    connection.ts
    activityLogModel.ts
    notificationModel.ts
  routes/
    authRoutes.ts
    bookRoutes.ts
    categoryRoutes.ts
    borrowingRoutes.ts
    profileRoutes.ts
    dashboardRoutes.ts
  services/
    authService.ts
    bookService.ts
    borrowingService.ts
    activityLogService.ts
  utils/
    jwt.ts
    password.ts
  server.ts
  index.ts
```

## Suggested Implementation Order

1. Rename/refactor the existing Habit Tracker API into Smart Library API.
2. Update PostgreSQL schema for `users`, `categories`, `books`, and `borrowings`.
3. Update auth to return `{ accessToken, user }`.
4. Add role-based middleware.
5. Implement categories endpoints.
6. Implement books endpoints.
7. Implement borrowing/return transactions.
8. Implement profile endpoints.
9. Implement dashboard stats.
10. Add MongoDB logging for key actions.
11. Seed database with library data.
12. Connect frontend to real backend.
13. Add tests for auth, books, categories, borrowings, and permissions.

## Minimum Backend Needed First

For the frontend to start working with real data, build these first:

```text
POST /api/auth/login
POST /api/auth/register
GET /api/auth/me
GET /api/books
GET /api/books/:id
POST /api/books
PUT /api/books/:id
DELETE /api/books/:id
GET /api/categories
POST /api/borrowings
PATCH /api/borrowings/:id/return
GET /api/profile/me
GET /api/dashboard/stats
```

After those are working, add MongoDB logs, notifications, and future AI features.
