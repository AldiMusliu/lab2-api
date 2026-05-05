# Frontend Implementation: Books And Borrowings

Use this guide in `lab2-web` to connect the book catalogue and borrowing flows
to the Smart Library API.

## Environment

Set the API base URL:

```env
VITE_API_URL=http://localhost:3000/api
```

Protected borrowing and admin book requests must send:

```http
Authorization: Bearer <accessToken>
```

## Types

```ts
export type BookFormat = "Print" | "E-book" | "Audiobook"

export type Book = {
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
  formats: BookFormat[]
  readOnline: boolean
  description: string
  tags: string[]
  coverImage: string
  coverTone: string
}

export type BookBody = Omit<Book, "id">

export type BookQuery = {
  q?: string
  categoryId?: string
  availability?: "available" | "online" | "waitlist" | "all"
  sort?: "title" | "author" | "newest" | "copies"
  page?: number
  pageSize?: number
}

export type BorrowingStatus = "active" | "returned" | "overdue"

export type Borrowing = {
  id: string
  userId: string
  bookId: string
  borrowedAt: string
  dueAt: string
  returnedAt: string | null
  status: BorrowingStatus
}

export type CreateBorrowingBody = {
  bookId: string
  dueAt: string
  userId?: string
}
```

## Book Endpoints

Public:

```http
GET /books
GET /books/:id
```

Admin only:

```http
POST /books
PUT /books/:id
DELETE /books/:id
```

List query params:

```ts
q, categoryId, availability, sort, page, pageSize
```

`GET /books` returns an array directly:

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

## Borrowing Endpoints

All borrowing routes require a logged-in user.

```http
GET /borrowings
GET /borrowings/:id
POST /borrowings
PATCH /borrowings/:id/return
```

Behavior:

- Normal users receive only their own borrowings.
- Admins receive all borrowings.
- Normal users cannot borrow on behalf of another user.
- Admins may pass `userId` when creating a borrowing for someone else.
- A user cannot borrow the same book again while their existing borrowing is
  active or overdue.
- Creating a borrowing decrements `availableCopies`.
- Returning a borrowing increments `availableCopies`.

Create borrowing body:

```json
{
  "bookId": "book-id",
  "dueAt": "2026-05-19T10:00:00.000Z"
}
```

Borrowing response:

```json
{
  "id": "borrowing-id",
  "userId": "user-id",
  "bookId": "book-id",
  "borrowedAt": "2026-05-05T10:00:00.000Z",
  "dueAt": "2026-05-19T10:00:00.000Z",
  "returnedAt": null,
  "status": "active"
}
```

## Suggested API Client Functions

This assumes the shared `apiRequest<T>()` helper from the users/categories guide
already exists.

```ts
const toQueryString = (query: BookQuery = {}) => {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value))
    }
  })

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ""
}

export const getBooks = (query?: BookQuery) =>
  apiRequest<Book[]>(`/books${toQueryString(query)}`)

export const getBookById = (id: string) => apiRequest<Book>(`/books/${id}`)

export const createBook = (body: BookBody) =>
  apiRequest<Book>("/books", {
    method: "POST",
    body: JSON.stringify(body),
  })

export const updateBook = (id: string, body: BookBody) =>
  apiRequest<Book>(`/books/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  })

export const deleteBook = (id: string) =>
  apiRequest<void>(`/books/${id}`, {
    method: "DELETE",
  })

export const getBorrowings = () => apiRequest<Borrowing[]>("/borrowings")

export const getBorrowingById = (id: string) =>
  apiRequest<Borrowing>(`/borrowings/${id}`)

export const createBorrowing = (body: CreateBorrowingBody) =>
  apiRequest<Borrowing>("/borrowings", {
    method: "POST",
    body: JSON.stringify(body),
  })

export const returnBorrowing = (id: string) =>
  apiRequest<Borrowing>(`/borrowings/${id}/return`, {
    method: "PATCH",
  })
```

## Suggested React Query Keys

```ts
export const bookKeys = {
  all: ["books"] as const,
  list: (query?: BookQuery) => [...bookKeys.all, "list", query] as const,
  detail: (id: string) => [...bookKeys.all, "detail", id] as const,
}

export const borrowingKeys = {
  all: ["borrowings"] as const,
  list: () => [...borrowingKeys.all, "list"] as const,
  detail: (id: string) => [...borrowingKeys.all, "detail", id] as const,
}
```

## UI Integration Checklist

- Replace mock book catalogue reads with `GET /books`.
- Send filters and search text as `/books` query params.
- Fetch category options from `/categories` for book forms and catalogue filters.
- Show admin book create/update/delete controls only when `user.role === "admin"`.
- Disable or hide the borrow button when `availableCopies === 0`.
- On borrow success, invalidate `bookKeys` and `borrowingKeys`.
- On return success, invalidate `bookKeys` and `borrowingKeys`.
- Use `status === "overdue"` to style overdue history rows.
- Use `returnedAt === null` to decide whether a return action should be visible.
- Disable the borrow button when the user already has an active/overdue
  borrowing for that book.
- Surface backend `409` errors for unavailable books, duplicate active
  borrowings, or already returned borrowings.

## Suggested Borrow Button Flow

```ts
const dueAt = new Date()
dueAt.setDate(dueAt.getDate() + 14)

await createBorrowing({
  bookId: book.id,
  dueAt: dueAt.toISOString(),
})
```

After the mutation succeeds, refresh the book list/detail so the user sees the
new `availableCopies` value.
