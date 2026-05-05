# Frontend Implementation: Books

Use this guide in `lab2-web` to connect the frontend books feature to the backend.

## Environment

Set the API base URL:

```env
VITE_API_URL=http://localhost:3000/api
```

All admin-only book write requests must send:

```http
Authorization: Bearer <accessToken>
```

Public book read requests do not require a token.

## Types

```ts
export type BookFormat = "Print" | "E-book" | "Audiobook"

export type BookAvailability = "available" | "online" | "waitlist" | "all"

export type BookSort = "title" | "author" | "newest" | "copies"

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

export type BookBody = {
  title: string
  author: string
  categoryId: string
  availableCopies: number
  totalCopies: number
  publishedYear: number
  language: string
  pages: number
  isbn?: string
  shelfLocation?: string
  formats: BookFormat[]
  readOnline?: boolean
  description: string
  tags?: string[]
  coverImage: string
  coverTone?: string
}

export type BookFilters = {
  q?: string
  categoryId?: string
  availability?: BookAvailability
  sort?: BookSort
  page?: number
  pageSize?: number
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

## List Books

```http
GET /books
```

Optional query params:

```text
q
categoryId
availability=available|online|waitlist|all
sort=title|author|newest|copies
page
pageSize
```

Response:

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
    "description": "A practical guide to writing readable, maintainable software.",
    "tags": ["Refactoring", "Testing"],
    "coverImage": "https://example.com/cover.jpg",
    "coverTone": "teal"
  }
]
```

## Get Book

```http
GET /books/:id
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
  "description": "A practical guide to writing readable, maintainable software.",
  "tags": ["Refactoring", "Testing"],
  "coverImage": "https://example.com/cover.jpg",
  "coverTone": "teal"
}
```

## Create Or Update Book

```http
POST /books
PUT /books/:id
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
  "description": "A practical guide to writing readable, maintainable software.",
  "tags": ["Refactoring", "Testing"],
  "coverImage": "https://example.com/cover.jpg",
  "coverTone": "teal"
}
```

Rules:

- `title`, `author`, `categoryId`, `language`, `formats`, `description`, and `coverImage` are required.
- `availableCopies` must be `>= 0`.
- `totalCopies` must be `>= 1`.
- `availableCopies` cannot be greater than `totalCopies`.
- `pages` must be `>= 1`.
- `formats` must contain at least one of `"Print"`, `"E-book"`, or `"Audiobook"`.
- `isbn`, `shelfLocation`, `tags`, `readOnline`, and `coverTone` are optional.

Create returns `201` with the created book. Update returns `200` with the updated book.

## Delete Book

```http
DELETE /books/:id
```

Admin only. Successful delete returns `204`.

## Suggested API Client Functions

This assumes you already have the shared `apiRequest` helper from the users/categories guide.

```ts
function toQueryString(filters: BookFilters = {}) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  })

  const query = params.toString()
  return query ? `?${query}` : ""
}

export const getBooks = (filters?: BookFilters) =>
  apiRequest<Book[]>(`/books${toQueryString(filters)}`)

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
```

## Suggested React Query Hooks

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const bookKeys = {
  all: ["books"] as const,
  lists: () => [...bookKeys.all, "list"] as const,
  list: (filters?: BookFilters) => [...bookKeys.lists(), filters] as const,
  detail: (id: string) => [...bookKeys.all, "detail", id] as const,
}

export function useBooks(filters?: BookFilters) {
  return useQuery({
    queryKey: bookKeys.list(filters),
    queryFn: () => getBooks(filters),
  })
}

export function useBook(id: string) {
  return useQuery({
    queryKey: bookKeys.detail(id),
    queryFn: () => getBookById(id),
    enabled: Boolean(id),
  })
}

export function useCreateBook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.all })
    },
  })
}

export function useUpdateBook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: BookBody }) =>
      updateBook(id, body),
    onSuccess: (book) => {
      queryClient.invalidateQueries({ queryKey: bookKeys.all })
      queryClient.setQueryData(bookKeys.detail(book.id), book)
    },
  })
}

export function useDeleteBook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.all })
    },
  })
}
```

## Form Defaults

Use safe defaults when opening a create form:

```ts
export const defaultBookBody: BookBody = {
  title: "",
  author: "",
  categoryId: "",
  availableCopies: 1,
  totalCopies: 1,
  publishedYear: new Date().getFullYear(),
  language: "English",
  pages: 1,
  isbn: "",
  shelfLocation: "",
  formats: ["Print"],
  readOnline: false,
  description: "",
  tags: [],
  coverImage: "",
  coverTone: "",
}
```

## UI Integration Checklist

- Replace mock book list data with `getBooks`.
- Use `/books/:id` for book detail pages or detail drawers.
- Fetch `/categories` for the category filter and book create/edit category select.
- Show book write controls only when `user.role === "admin"`.
- Send `BookBody` to create and update endpoints.
- Convert tag text input to `string[]` before submit.
- Convert format checkboxes to `BookFormat[]` before submit.
- Disable submit when `availableCopies > totalCopies`.
- After create/update/delete, invalidate the books query.
- Treat `availableCopies === 0` as unavailable or waitlist state in the UI.
- Use `readOnline` to show online-reading badges/actions.

## Error Cases To Handle

- `400 Validation failed`: show field validation messages where possible.
- `401 Unauthorized`: clear token or ask user to log in again.
- `403 Forbidden`: hide admin controls or show a permission message.
- `404 Book not found`: show a not-found state.
- `409 Conflict`: usually duplicate ISBN.
