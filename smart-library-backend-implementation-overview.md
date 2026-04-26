# Smart Library Backend Implementation Overview

## Purpose

This file describes how the current `lab2-api` backend should be reshaped from the copied Habit Tracker template into the backend for the Smart Library Management System.

Use this document as the working backend guide when implementing the project in parts:

1. Auth
2. Categories
3. Books
4. Borrowings
5. Profile and dashboard
6. MongoDB logs and notifications
7. Tests, seed data, and frontend integration

The existing `smart-library-backend-overview.md` describes the product/API target. This file focuses on the actual backend repo structure, what should be kept, what should be replaced, and how to implement the work safely step by step.

## Current Backend Snapshot

The backend is currently a Node.js, Express, TypeScript, Drizzle, PostgreSQL API copied from a Habit Tracker project.

Current useful infrastructure:

- `src/index.ts` starts the Express app.
- `src/server.ts` creates the app, adds middleware, adds `/health`, and mounts routes.
- `src/db/connection.ts` creates the PostgreSQL pool and Drizzle client.
- `src/db/schema.ts` defines Drizzle tables and relations.
- `src/middleware/auth.ts` verifies JWT bearer tokens.
- `src/middleware/validation.ts` validates bodies, params, and query strings with Zod.
- `src/middleware/errorHandler.ts` has reusable error handling helpers.
- `src/utils/password.ts` hashes and compares passwords with bcrypt.
- `src/utils/jwt.ts` signs and verifies JWT tokens with `jose`.
- `tests/` already uses Vitest and Supertest.

Current template domain that should be replaced:

- `habits`
- `entries`
- `tags`
- `habit_tags`
- habit routes/controllers/tests
- old Habit Tracker API docs

Current route modules:

```text
src/routes/
  authRoutes.ts
  userRoutes.ts
  habitRoutes.ts
  tagRoutes.ts
```

Current controller modules:

```text
src/controllers/
  authController.ts
  userController.ts
  habitController.ts
  tagController.ts
```

Current database tables:

```text
users
habits
entries
tags
habit_tags
```

Target Smart Library tables:

```text
users
categories
books
borrowings
```

Optional MongoDB collections for later:

```text
activity_logs
notifications
ai_history
```

## Keep, Refactor, Replace

## Keep

Keep these parts because they are good project infrastructure:

- Express app setup
- TypeScript configuration
- Drizzle/PostgreSQL setup
- `env.ts` validation pattern
- JWT helper pattern
- bcrypt password helper
- Zod validation middleware
- route/controller organization
- Vitest/Supertest testing approach
- Drizzle scripts in `package.json`

## Refactor

These files are useful but need Smart Library changes:

```text
src/server.ts
src/db/schema.ts
src/db/seed.ts
src/controllers/authController.ts
src/controllers/userController.ts
src/routes/authRoutes.ts
src/routes/userRoutes.ts
src/middleware/auth.ts
src/utils/jwt.ts
tests/helpers/dbHelpers.ts
tests/setup/globalSetup.ts
```

## Replace

These files are Habit Tracker specific and should be replaced by Smart Library equivalents:

```text
src/controllers/habitController.ts -> src/controllers/bookController.ts and src/controllers/borrowingController.ts
src/controllers/tagController.ts -> src/controllers/categoryController.ts
src/routes/habitRoutes.ts -> src/routes/bookRoutes.ts and src/routes/borrowingRoutes.ts
src/routes/tagRoutes.ts -> src/routes/categoryRoutes.ts
tests/habits.test.ts -> tests/books.test.ts, tests/categories.test.ts, tests/borrowings.test.ts
```

## Target Backend Folder Structure

The backend can stay close to the current structure. Services are optional, but adding them for borrowing transactions will make the code cleaner.

Recommended target:

```text
src/
  controllers/
    authController.ts
    bookController.ts
    borrowingController.ts
    categoryController.ts
    dashboardController.ts
    profileController.ts
  db/
    connection.ts
    schema.ts
    seed.ts
  middleware/
    auth.ts
    errorHandler.ts
    requireRole.ts
    validation.ts
  mongo/
    connection.ts
    activityLogModel.ts
    notificationModel.ts
  routes/
    authRoutes.ts
    bookRoutes.ts
    borrowingRoutes.ts
    categoryRoutes.ts
    dashboardRoutes.ts
    profileRoutes.ts
  services/
    borrowingService.ts
    dashboardService.ts
  utils/
    jwt.ts
    password.ts
  index.ts
  server.ts
```

Minimum target for the first implementation phases:

```text
src/
  controllers/
    authController.ts
    bookController.ts
    borrowingController.ts
    categoryController.ts
    profileController.ts
  db/
    connection.ts
    schema.ts
    seed.ts
  middleware/
    auth.ts
    requireRole.ts
    validation.ts
    errorHandler.ts
  routes/
    authRoutes.ts
    bookRoutes.ts
    borrowingRoutes.ts
    categoryRoutes.ts
    profileRoutes.ts
  utils/
    jwt.ts
    password.ts
  index.ts
  server.ts
```

## Target Server Mounts

Update `src/server.ts` so routes are mounted under `/api`.

Target route mounts:

```text
GET /api/health

/api/auth
/api/categories
/api/books
/api/borrowings
/api/profile
/api/dashboard
```

Optional compatibility:

```text
GET /health
```

The frontend should use:

```env
VITE_API_URL=http://localhost:3001/api
```

## Target Data Model

## Users

Purpose:

- authentication
- profile data
- role-based authorization

Target fields:

```text
id
fullName
email
passwordHash
role: "admin" | "user"
createdAt
updatedAt
```

Current template fields to remove or replace:

```text
username
password
firstName
lastName
```

Recommended Drizzle enums:

```text
user_role: admin, user
```

Frontend user shape:

```ts
type AuthUser = {
  id: string
  fullName: string
  email: string
  role: 'admin' | 'user'
}
```

## Categories

Purpose:

- organize books
- provide filtering options in the frontend

Target fields:

```text
id
name
createdAt
updatedAt
```

Rules:

- `name` is required.
- `name` is unique.
- categories can be listed publicly.
- create/update/delete should be admin only.
- do not delete a category while books reference it.

## Books

Purpose:

- main library catalog
- searchable and filterable resource
- availability source for borrowings

Target fields:

```text
id
title
author
categoryId
availableCopies
totalCopies
publishedYear
language
pages
isbn
shelfLocation
formats
readOnline
description
tags
coverImage
coverTone
createdAt
updatedAt
```

Recommended PostgreSQL types:

- Use `integer` for copy counts, published year, and pages.
- Use `jsonb` for `formats` and `tags`, unless the frontend is changed to model them as separate tables.
- Use `boolean` for `readOnline`.
- Use `text` for long descriptions.
- Use a foreign key from `books.categoryId` to `categories.id`.

Rules:

- `availableCopies >= 0`
- `totalCopies >= 1`
- `availableCopies <= totalCopies`
- `isbn` should be unique when provided.
- public users can list/read books.
- admins can create/update/delete books.

## Borrowings

Purpose:

- track book checkout and return records
- drive user history and admin monitoring

Target fields:

```text
id
userId
bookId
borrowedAt
dueAt
returnedAt
status: "active" | "returned" | "overdue"
createdAt
updatedAt
```

Recommended Drizzle enums:

```text
borrowing_status: active, returned, overdue
```

Rules:

- users can borrow only available books.
- borrowing decreases `books.availableCopies` by 1.
- returning increases `books.availableCopies` by 1.
- create and return operations must use PostgreSQL transactions.
- users can view and return only their own borrowings.
- admins can view and return any borrowing.
- returned borrowings cannot be returned again.
- returning must never increase `availableCopies` above `totalCopies`.

## MongoDB Collections

MongoDB should be added after the SQL API works.

Planned collections:

```text
activity_logs
notifications
ai_history
```

Suggested use:

- `activity_logs`: flexible events such as `book.created`, `borrowing.created`, `borrowing.returned`.
- `notifications`: due-date or system notifications for users.
- `ai_history`: future AI recommendation/search history.

Do not block the core SQL API on MongoDB. It is a later phase.

## API Response Conventions

Keep responses simple and aligned with the frontend types.

Auth responses:

```json
{
  "accessToken": "jwt-token",
  "user": {
    "id": "user-id",
    "fullName": "Alex Reader",
    "email": "alex@example.com",
    "role": "user"
  }
}
```

List responses should return arrays directly unless the frontend is changed to expect pagination wrappers:

```json
[
  {
    "id": "book-id",
    "title": "Clean Code"
  }
]
```

Error responses should stay consistent:

```json
{
  "error": "Validation failed",
  "message": "Available copies cannot be greater than total copies",
  "details": []
}
```

## Required Route Surface

## Auth

```text
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
POST /api/auth/logout
```

## Categories

```text
GET /api/categories
GET /api/categories/:id
POST /api/categories
PUT /api/categories/:id
DELETE /api/categories/:id
```

## Books

```text
GET /api/books
GET /api/books/:id
POST /api/books
PUT /api/books/:id
DELETE /api/books/:id
```

Supported query params for `GET /api/books`:

```text
q
categoryId
availability
sort
page
pageSize
```

## Borrowings

```text
GET /api/borrowings
GET /api/borrowings/:id
POST /api/borrowings
PATCH /api/borrowings/:id/return
```

## Profile

```text
GET /api/profile/me
PUT /api/profile/me
```

## Dashboard

```text
GET /api/dashboard/stats
POST /api/dashboard/stats/refresh
```

Dashboard can be implemented after books and borrowings exist.

## Implementation Parts

## Part 1: Auth Foundation

Goal:

- make the API authenticate Smart Library users, not Habit Tracker users.

Files to update:

```text
src/db/schema.ts
src/utils/jwt.ts
src/middleware/auth.ts
src/middleware/requireRole.ts
src/controllers/authController.ts
src/routes/authRoutes.ts
src/server.ts
tests/auth.test.ts
tests/helpers/dbHelpers.ts
tests/setup/globalSetup.ts
```

Work:

- Replace the current user shape with `fullName`, `email`, `passwordHash`, and `role`.
- Add `role` to JWT payload.
- Add `requireRole('admin')` middleware.
- Replace `/sign-up` and `/sign-in` with `/register` and `/login`.
- Add `/me`.
- Add stateless `/logout` returning `204`.
- Return `{ accessToken, user }`, not `{ token, user }`.
- Never return `passwordHash`.
- Update auth tests.

Prompt to use:

```text
Implement Part 1 of the Smart Library backend: auth foundation. Use smart-library-backend-implementation-overview.md as the guide. Keep the existing Express, Drizzle, Zod, JWT, bcrypt, and test patterns, but change users to fullName/email/passwordHash/role, update auth routes to /register, /login, /me, /logout, add role-aware JWT payloads, add requireRole middleware, and update tests.
```

Done when:

- `POST /api/auth/register` works.
- `POST /api/auth/login` works.
- `GET /api/auth/me` works with a bearer token.
- `POST /api/auth/logout` returns `204`.
- auth tests pass.

## Part 2: Categories

Goal:

- replace Habit Tracker tags with Smart Library categories.

Files to update/create:

```text
src/db/schema.ts
src/controllers/categoryController.ts
src/routes/categoryRoutes.ts
src/server.ts
tests/categories.test.ts
tests/helpers/dbHelpers.ts
```

Work:

- Add `categories` table.
- Add public list/read endpoints.
- Add admin-only create/update/delete.
- Validate category name.
- Prevent deleting categories that books reference once books exist.
- Remove or stop mounting `tagRoutes`.

Prompt to use:

```text
Implement Part 2 of the Smart Library backend: categories. Use the implementation overview. Replace the tag domain with categories, add category schema/relations, create category routes/controllers, mount /api/categories, protect write operations with admin role middleware, and add category tests.
```

Done when:

- `GET /api/categories` returns an array.
- admins can create/update/delete categories.
- normal users cannot write categories.
- category tests pass.

## Part 3: Books

Goal:

- replace habits with the Smart Library book catalog.

Files to update/create:

```text
src/db/schema.ts
src/controllers/bookController.ts
src/routes/bookRoutes.ts
src/server.ts
tests/books.test.ts
tests/helpers/dbHelpers.ts
```

Work:

- Add `books` table with a category foreign key.
- Add list/read endpoints.
- Add search and filters for `q`, `categoryId`, `availability`, and `sort`.
- Add admin-only create/update/delete.
- Validate copy counts and required fields.
- Use `jsonb` for `formats` and `tags`.
- Remove or stop mounting `habitRoutes`.

Prompt to use:

```text
Implement Part 3 of the Smart Library backend: books. Replace the habit catalog with books, add the books table and relations, implement /api/books list/read/create/update/delete, support search/filter/sort query params, enforce copy-count validation, protect writes with admin role middleware, and add book tests.
```

Done when:

- `GET /api/books` returns an array of frontend-ready book objects.
- `GET /api/books/:id` returns one book.
- admins can create/update/delete books.
- normal users can only read books.
- book tests pass.

## Part 4: Borrowings

Goal:

- implement borrowing and returning books with correct inventory changes.

Files to update/create:

```text
src/db/schema.ts
src/controllers/borrowingController.ts
src/routes/borrowingRoutes.ts
src/services/borrowingService.ts
src/server.ts
tests/borrowings.test.ts
tests/helpers/dbHelpers.ts
```

Work:

- Add `borrowings` table.
- Add `borrowing_status` enum.
- Implement list/read with role-aware access.
- Implement create borrowing transaction.
- Implement return borrowing transaction.
- Decrease/increase `availableCopies` safely.
- Reject unavailable books.
- Reject double returns.
- Add permission tests.

Prompt to use:

```text
Implement Part 4 of the Smart Library backend: borrowings. Add the borrowings table and borrowing status enum, implement /api/borrowings endpoints, use transactions when borrowing and returning books, enforce inventory and ownership rules, allow admins to view/return all borrowings, and add borrowing tests.
```

Done when:

- users can borrow available books.
- available copies decrease on borrow.
- users can return their own borrowings.
- available copies increase on return.
- admins can view/return all borrowings.
- borrowing tests pass.

## Part 5: Profile And Dashboard

Goal:

- finish user-facing profile endpoints and admin stats.

Files to update/create:

```text
src/controllers/profileController.ts
src/routes/profileRoutes.ts
src/controllers/dashboardController.ts
src/routes/dashboardRoutes.ts
src/services/dashboardService.ts
src/server.ts
tests/profile.test.ts
tests/dashboard.test.ts
```

Work:

- Move profile routes from `/api/users/profile` to `/api/profile/me`.
- Allow users to update `fullName`.
- Keep email changes optional and carefully validated.
- Add admin-only dashboard stats.
- Count books, borrowings, active users, and overdue borrowings.

Prompt to use:

```text
Implement Part 5 of the Smart Library backend: profile and dashboard. Add /api/profile/me get/update routes, add admin-only /api/dashboard/stats and /api/dashboard/stats/refresh, compute stats from users/books/borrowings, and add tests for profile and dashboard permissions.
```

Done when:

- users can read/update their profile.
- admins can read dashboard stats.
- normal users cannot access dashboard stats.
- profile and dashboard tests pass.

## Part 6: MongoDB Logs And Notifications

Goal:

- add NoSQL usage after the main SQL backend is stable.

Files to create:

```text
src/mongo/connection.ts
src/mongo/activityLogModel.ts
src/mongo/notificationModel.ts
src/services/activityLogService.ts
src/services/notificationService.ts
```

Environment updates:

```text
MONGODB_URI
```

Work:

- Add MongoDB dependency if needed.
- Add Mongo connection helper.
- Log key events such as book creation and borrowing return.
- Add notification storage for due-soon or overdue notices.
- Keep Mongo failures from breaking core SQL flows unless required by the feature.

Prompt to use:

```text
Implement Part 6 of the Smart Library backend: MongoDB logs and notifications. Add MongoDB connection/config, create activity log and notification models/services, record logs for major book/category/borrowing actions, and add focused tests or documented manual verification.
```

Done when:

- activity logs are stored for key actions.
- notifications can be created/read.
- SQL flows still work if Mongo logging is disabled for development.

## Part 7: Seed Data, Docs, And Integration

Goal:

- make the backend easy to run and connect to the frontend.

Files to update:

```text
src/db/seed.ts
API_DOCS.md
README.md
package.json
```

Work:

- Replace Habit Tracker seed data with library seed data.
- Seed one admin and one regular user.
- Seed frontend-matching categories and books.
- Document `.env` values.
- Update API docs from Habit Tracker to Smart Library.
- Remove stale habit/tag wording from README and package metadata.

Prompt to use:

```text
Implement Part 7 of the Smart Library backend: seed data, docs, and integration cleanup. Replace old Habit Tracker seed/docs/package wording with Smart Library data and instructions, seed admin/user accounts plus categories/books/borrowings, and document how the frontend should configure VITE_API_URL.
```

Done when:

- `npm run db:seed` creates usable Smart Library demo data.
- README and API docs match the implemented API.
- frontend can log in and fetch books/categories.

## Recommended Implementation Order

Do the work in this order:

1. Auth foundation
2. Categories
3. Books
4. Borrowings
5. Profile
6. Dashboard
7. Seed data
8. API docs and README cleanup
9. MongoDB logs and notifications
10. Frontend integration fixes

This order avoids circular problems:

- Auth must exist before admin permissions.
- Categories should exist before books.
- Books must exist before borrowings.
- Borrowings must exist before dashboard stats are meaningful.
- MongoDB should wait until core SQL flows are stable.

## Testing Strategy

Keep the current Vitest/Supertest approach.

Minimum tests by part:

```text
auth.test.ts
categories.test.ts
books.test.ts
borrowings.test.ts
profile.test.ts
dashboard.test.ts
```

Important test helpers:

```text
createTestUser
createTestAdmin
createTestCategory
createTestBook
createTestBorrowing
cleanupDatabase
```

Test database cleanup order:

```text
borrowings
books
categories
users
```

Optional Mongo cleanup later:

```text
activity_logs
notifications
ai_history
```

## Backend Definition Of Done

The backend is ready for frontend integration when:

- the server starts without Habit Tracker route/domain references.
- `/api/health` works.
- auth returns `{ accessToken, user }`.
- JWT payload includes `id`, `email`, and `role`.
- admin-only routes reject normal users.
- categories can be listed and managed by admins.
- books can be listed publicly and managed by admins.
- borrow and return operations update inventory in transactions.
- profile endpoints return frontend-ready user data.
- dashboard stats work for admins.
- seed data creates demo admin/user accounts and initial books.
- tests pass for auth, categories, books, borrowings, and permissions.

## Demo Accounts To Seed

Use these predictable credentials for local development:

```text
admin@library.local / password123 / admin
user@library.local / password123 / user
```

## Important Compatibility Notes

- Use role names exactly as `"admin"` and `"user"`.
- Use `accessToken` in auth responses, not `token`, unless the frontend is changed.
- Use `/api/auth/register` and `/api/auth/login`, not `/sign-up` and `/sign-in`.
- Prefer returning arrays directly for `GET /api/books` and `GET /api/categories`.
- Do not return `passwordHash` from any endpoint.
- Keep `availableCopies` and `totalCopies` consistent at all times.
- Do not add MongoDB until the core PostgreSQL flows are implemented.
