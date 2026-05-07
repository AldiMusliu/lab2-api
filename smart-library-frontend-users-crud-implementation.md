# Frontend Implementation: User Management

Use this guide in `lab2-web` to add an admin-only users table with full CRUD
against the Smart Library API.

## Environment

Set the API base URL:

```env
VITE_API_URL=http://localhost:3000/api
```

All user-management routes require an admin JWT:

```http
Authorization: Bearer <accessToken>
```

## Types

```ts
export type UserRole = "admin" | "user"

export type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export type CreateUserBody = {
  firstName: string
  lastName: string
  email: string
  password: string
  role: UserRole
}

export type UpdateUserBody = {
  firstName: string
  lastName: string
  email: string
  role: UserRole
  password?: string
}
```

The backend never returns `passwordHash`.

## User Endpoints

Admin only:

```http
GET /users
GET /users/:id
POST /users
PUT /users/:id
DELETE /users/:id
```

Behavior:

- Only admins can access these routes.
- Normal users receive `403`.
- Admins can create `admin` or `user` accounts.
- Admins can update another user's name, email, role, and optional password.
- Admins cannot change their own role through this endpoint.
- Admins cannot delete their own account.
- Duplicate emails return `409`.

Create body:

```json
{
  "firstName": "Alex",
  "lastName": "Reader",
  "email": "alex@example.com",
  "password": "password123",
  "role": "user"
}
```

Update body:

```json
{
  "firstName": "Alex",
  "lastName": "Reader",
  "email": "alex@example.com",
  "role": "user",
  "password": "newPassword123"
}
```

Leave `password` out when the admin is not changing it.

User response:

```json
{
  "id": "user-id",
  "firstName": "Alex",
  "lastName": "Reader",
  "email": "alex@example.com",
  "role": "user",
  "createdAt": "2026-05-07T18:00:00.000Z",
  "updatedAt": "2026-05-07T18:00:00.000Z"
}
```

## Suggested API Client Functions

This assumes the shared `apiRequest<T>()` helper already attaches the bearer
token.

```ts
export const getUsers = () => apiRequest<User[]>("/users")

export const getUserById = (id: string) => apiRequest<User>(`/users/${id}`)

export const createUser = (body: CreateUserBody) =>
  apiRequest<User>("/users", {
    method: "POST",
    body: JSON.stringify(body),
  })

export const updateUser = (id: string, body: UpdateUserBody) =>
  apiRequest<User>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  })

export const deleteUser = (id: string) =>
  apiRequest<void>(`/users/${id}`, {
    method: "DELETE",
  })
```

## Suggested React Query Keys

```ts
export const userKeys = {
  all: ["users"] as const,
  list: () => [...userKeys.all, "list"] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
}
```

## Suggested Mutations

```ts
const queryClient = useQueryClient()

const invalidateUsers = () => {
  queryClient.invalidateQueries({ queryKey: userKeys.all })
  queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
}

export const useCreateUser = () =>
  useMutation({
    mutationFn: createUser,
    onSuccess: invalidateUsers,
  })

export const useUpdateUser = () =>
  useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserBody }) =>
      updateUser(id, body),
    onSuccess: invalidateUsers,
  })

export const useDeleteUser = () =>
  useMutation({
    mutationFn: deleteUser,
    onSuccess: invalidateUsers,
  })
```

## Users Table

Suggested columns:

| Column | Source | Notes |
|---|---|---|
| Name | `firstName`, `lastName` | Display as `${firstName} ${lastName}` |
| Email | `email` | Use as secondary identity/search text |
| Role | `role` | Show `admin` and `user` clearly |
| Created | `createdAt` | Format with local date/time |
| Updated | `updatedAt` | Optional, useful for admin audit context |
| Actions | `id` | Edit, reset password, delete |

Suggested row actions:

| Action | Endpoint | Notes |
|---|---|---|
| Create user | `POST /users` | Open a dialog/form |
| Edit user | `PUT /users/:id` | Name, email, role, optional password |
| Reset password | `PUT /users/:id` | Same update endpoint with only password changed in the form payload |
| Delete user | `DELETE /users/:id` | Confirm before deleting |

## UI Integration Checklist

- Add an admin-only users page or dashboard tab.
- Hide the users page/link unless `user.role === "admin"`.
- Load table rows from `GET /users`.
- Use a create-user dialog with first name, last name, email, password, and role.
- Use an edit-user dialog with first name, last name, email, role, and optional
  password.
- Do not prefill password fields.
- Do not send `password` on update unless the admin typed a new password.
- Disable role changes for the currently logged-in admin row, or surface the
  backend `400` message.
- Disable delete for the currently logged-in admin row, or surface the backend
  `400` message.
- Confirm before delete.
- Invalidate `userKeys.all` after create, update, and delete.
- Invalidate dashboard stats after create/delete because user counts may change.
- Surface backend `409` duplicate email errors near the email field.
- Surface backend `403` by redirecting non-admin users away from the page.

## Suggested Form Defaults

Create:

```ts
const createDefaults: CreateUserBody = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "user",
}
```

Update:

```ts
const toUpdateDefaults = (user: User): UpdateUserBody => ({
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
})
```
