# Frontend Implementation: Users And Categories

Use this guide in `lab2-web` to connect the frontend to the first backend slice.

## Environment

Set the API base URL:

```env
VITE_API_URL=http://localhost:3000/api
```

All protected requests must send:

```http
Authorization: Bearer <accessToken>
```

## Types

```ts
export type UserRole = "admin" | "user"

export type AuthUser = {
  id: string
  fullName: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
}

export type AuthResponse = {
  accessToken: string
  user: AuthUser
}

export type RegisterBody = {
  firstName: string
  lastName: string
  email: string
  password: string
}

export type LoginBody = {
  email: string
  password: string
}

export type Profile = {
  id: string
  fullName: string
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

export type Category = {
  id: string
  name: string
}
```

## Auth Endpoints

### Register

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

Response:

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

Frontend changes:

- Update the register form to collect `firstName` and `lastName`.
- Submit `firstName`, `lastName`, `email`, and `password`.
- Store `accessToken` after successful registration.
- Store the returned `user` in auth state.

### Login

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

Response is the same `AuthResponse` shape as register.

### Current User

```http
GET /auth/me
```

Use this when the app loads and a saved token exists. If it returns `401`, clear the saved token and user state.

### Logout

```http
POST /auth/logout
```

The backend returns `204`. The frontend should clear the local token and auth state.

## Profile Endpoints

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

Profile response:

```json
{
  "id": "user-id",
  "fullName": "Alex Reader",
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

Successful password change response:

```json
{
  "message": "Password changed successfully"
}
```

## Category Endpoints

Public:

```http
GET /categories
GET /categories/:id
```

Admin only:

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

`GET /categories` returns an array directly:

```json
[
  {
    "id": "category-id",
    "name": "Software Engineering"
  }
]
```

## Suggested API Client

```ts
const API_URL = import.meta.env.VITE_API_URL

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("accessToken")
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json()

  if (!response.ok) {
    throw data
  }

  return data as T
}
```

## Suggested Functions

```ts
export const register = (body: RegisterBody) =>
  apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  })

export const login = (body: LoginBody) =>
  apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  })

export const getCurrentUser = () => apiRequest<AuthUser>("/auth/me")

export const logout = () =>
  apiRequest<void>("/auth/logout", {
    method: "POST",
  })

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

export const getCategories = () => apiRequest<Category[]>("/categories")

export const createCategory = (body: { name: string }) =>
  apiRequest<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(body),
  })

export const updateCategory = (id: string, body: { name: string }) =>
  apiRequest<Category>(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  })

export const deleteCategory = (id: string) =>
  apiRequest<void>(`/categories/${id}`, {
    method: "DELETE",
  })
```

## Integration Checklist

- Replace register form `fullName` input with `firstName` and `lastName`.
- Keep displaying `user.fullName` where a single display name is needed.
- Persist `accessToken` after login/register.
- Add the bearer token in the shared API client.
- Load `/auth/me` on app startup when a token exists.
- Add a profile password form that submits `currentPassword` and `newPassword`.
- Use `user.role === "admin"` to show category create/update/delete controls.
- Fetch categories from `/categories` anywhere filters or book forms need category options.
