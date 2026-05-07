# Frontend Implementation: Profile And Dashboard

Use this guide in `lab2-web` to connect profile editing, password changes, and
role-aware dashboard statistics to the Smart Library API.

## Environment

Set the API base URL:

```env
VITE_API_URL=http://localhost:3000/api
```

All routes in this guide require:

```http
Authorization: Bearer <accessToken>
```

## Types

```ts
export type Profile = {
  id: string
  firstName: string
  lastName: string
  email: string
}

export type UpdateProfileBody = {
  firstName: string
  lastName: string
}

export type ChangePasswordBody = {
  currentPassword: string
  newPassword: string
}

export type AdminDashboardStats = {
  role: "admin"
  totalBooks: number
  totalCopies: number
  availableCopies: number
  borrowedCopies: number
  availableBooks: number
  totalCategories: number
  totalUsers: number
  adminUsers: number
  activeUsers: number
  totalBorrowings: number
  activeBorrowings: number
  overdueBorrowings: number
  returnedBorrowings: number
}

export type UserDashboardStats = {
  role: "user"
  totalBorrowings: number
  activeBorrowings: number
  overdueBorrowings: number
  returnedBorrowings: number
  currentBorrowings: number
  dueSoonBorrowings: number
}

export type DashboardStats = AdminDashboardStats | UserDashboardStats
```

## Profile Endpoints

```http
GET /profile/me
PUT /profile/me
PUT /profile/me/password
```

Update profile body:

```json
{
  "firstName": "Alex",
  "lastName": "Reader"
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

## Dashboard Endpoint

```http
GET /dashboard/stats
```

The response is role-aware. Admins receive the full library summary:

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

Regular users receive only their own borrowing summary:

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

`overdueBorrowings` is based on open borrowings with a past `dueAt`, so the UI
can trust it even when an old row still stores `status: "active"`.

## Suggested API Client Functions

This assumes the shared `apiRequest<T>()` helper from the users/categories guide
already attaches the bearer token.

```ts
export const getProfile = () => apiRequest<Profile>("/profile/me")

export const updateProfile = (body: UpdateProfileBody) =>
  apiRequest<Profile>("/profile/me", {
    method: "PUT",
    body: JSON.stringify(body),
  })

export const changePassword = (body: ChangePasswordBody) =>
  apiRequest<{ message: string }>("/profile/me/password", {
    method: "PUT",
    body: JSON.stringify(body),
  })

export const getDashboardStats = () =>
  apiRequest<DashboardStats>("/dashboard/stats")
```

## Suggested React Query Keys

```ts
export const profileKeys = {
  all: ["profile"] as const,
  me: () => [...profileKeys.all, "me"] as const,
}

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
}
```

## UI Integration Checklist

- Load profile data from `GET /profile/me` on the profile page.
- Submit name changes with `PUT /profile/me` and invalidate `profileKeys.me()`.
- Submit password changes with `PUT /profile/me/password`.
- Keep current password and new password fields local to the form; do not store
  them in global state.
- Load dashboard data from `GET /dashboard/stats` after login/session restore.
- Branch dashboard cards by `stats.role`.
- Use admin stats for total books, available copies, users, active users,
  borrowings, and overdue counts.
- Use user stats for current borrowings, due soon, overdue, returned, and total
  borrowing history.
- Invalidate `dashboardKeys.stats()` after borrowing, returning, creating a
  book, deleting a book, or changing categories.
- Surface backend `400` validation errors for profile/password forms.
