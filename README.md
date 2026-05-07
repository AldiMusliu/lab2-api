# Smart Library API

Smart Library API is the backend for a library management application. It
provides authentication, profile management, admin user management, categories,
books, borrowings, dashboard statistics, and user notifications.

The API is designed for a frontend library dashboard where readers can browse
books, manage their profile, borrow and return titles, and receive
notifications. Admin users can manage users, categories, books, and system notifications.

## Main Features

- JWT authentication with register, login, logout, and current-user endpoints.
- Role-based access control for admin-only actions.
- Reader profile and password management.
- Category and book catalog management.
- Book browsing with search, category, availability, sorting, and pagination
  query support.
- Borrowing workflows for creating loans, listing loans, viewing details, and
  returning books.
- Dashboard statistics for authenticated users.
- MongoDB-backed notifications with unread counts, read state, and deletion.
- Swagger UI and raw OpenAPI documentation.
- Automated endpoint tests with Vitest and Supertest.

## Tech Stack

- Runtime: Node.js
- Language: TypeScript using native Node execution for `.ts` files
- Web framework: Express 5
- Relational database: PostgreSQL
- ORM and schema tooling: Drizzle ORM and Drizzle Kit
- Validation: Zod and Drizzle Zod
- Authentication: JWT using `jose`
- Password hashing: bcrypt
- Notifications database: MongoDB
- API documentation: OpenAPI 3 and Swagger UI
- Security and middleware: Helmet, CORS, Morgan

## Project Structure

```text
src/
  controllers/      Request handlers for each API area
  db/               PostgreSQL connection, schema, and seed script
  docs/             OpenAPI specification
  middleware/       Auth, role checks, validation, and error helpers
  mongo/            MongoDB connection and notification model
  routes/           Express route definitions
  services/         Shared business services
  utils/            JWT and password utilities
tests/              API integration tests and test database setup
env.ts              Environment loading and validation
drizzle.config.ts   Drizzle Kit configuration
```

## Requirements

Install these before running the app:

- Node.js `24.3.0` or newer
- npm
- PostgreSQL
- MongoDB, required for notification endpoints

## Environment Variables

The app loads `.env` in development and `.env.test` when `APP_STAGE=test`.
Environment values are validated on startup with Zod.

Create a `.env` file in the project root:

```env
APP_STAGE=dev
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smart_library

JWT_SECRET=replace-with-at-least-32-characters
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

MONGODB_URI=mongodb://127.0.0.1:27017/smart-library
MONGODB_DB_NAME=smart-library
```

Required values:

- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: secret used to sign JWTs. It must be at least 32 characters.

Optional values:

- `PORT`: defaults to `3000`.
- `JWT_EXPIRES_IN`: defaults to `7d`.
- `BCRYPT_ROUNDS`: defaults to `12`; allowed range is `10` to `20`.
- `MONGODB_URI`: defaults to `mongodb://127.0.0.1:27017/smart-library`.
- `MONGODB_DB_NAME`: defaults to `smart-library`.

## Setup

Install dependencies:

```bash
npm install
```

Push the Drizzle schema to PostgreSQL:

```bash
npm run db:push
```

Optionally seed demo data:

```bash
npm run db:seed
```

The seed script creates demo accounts:

```text
aldi@admin.com / password123
aldi@user.com / password123
```

Start the development server:

```bash
npm run dev
```

The API runs at:

```text
http://localhost:3000
```

Health checks:

```text
GET /health
GET /api/health
```

## API Documentation

After starting the server, open:

- `http://localhost:3000/api/docs` for Swagger UI
- `http://localhost:3000/api/docs.json` for the raw OpenAPI spec

## API Areas

Base API URL:

```text
http://localhost:3000/api
```

Authentication:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`

Profile:

- `GET /profile/me`
- `PUT /profile/me`
- `PUT /profile/me/password`

Admin user management:

- `GET /users`
- `POST /users`
- `GET /users/:id`
- `PUT /users/:id`
- `DELETE /users/:id`

Categories:

- `GET /categories`
- `GET /categories/:id`
- `POST /categories` admin only
- `PUT /categories/:id` admin only
- `DELETE /categories/:id` admin only

Books:

- `GET /books`
- `GET /books/:id`
- `POST /books` admin only
- `PUT /books/:id` admin only
- `DELETE /books/:id` admin only

Borrowings:

- `GET /borrowings`
- `POST /borrowings`
- `GET /borrowings/:id`
- `PATCH /borrowings/:id/return`

Dashboard:

- `GET /dashboard/stats`

Notifications:

- `GET /notifications`
- `GET /notifications/unread-count`
- `POST /notifications` admin only
- `PATCH /notifications/read-all`
- `PATCH /notifications/:id/read`
- `DELETE /notifications/:id`

JWT-protected routes require:

```http
Authorization: Bearer <accessToken>
```

## Data Storage

PostgreSQL stores the core library data:

- `users`: reader and admin accounts.
- `categories`: book categories.
- `books`: catalog records, inventory, formats, tags, and cover metadata.
- `borrowings`: loans with active, returned, and overdue statuses.

MongoDB stores notification documents in the `notifications` collection. The app
creates indexes for user-based notification lookups and unread counts.

## Available Scripts

- `npm run dev`: start the API in watch mode.
- `npm start`: start the API without watch mode.
- `npm test`: run the Vitest test suite with `APP_STAGE=test`.
- `npm run db:push`: push the current schema to the database.
- `npm run db:migrate`: run Drizzle migrations.
- `npm run db:studio`: open Drizzle Studio.
- `npm run db:seed`: seed demo users, categories, books, and borrowings.

## Notes

- Public read endpoints are available for categories and books.
- Most write operations require authentication.
- Admin-only actions are protected with role checks.
- Validation errors return structured JSON responses from Zod.
- Notification endpoints require MongoDB to be running.
