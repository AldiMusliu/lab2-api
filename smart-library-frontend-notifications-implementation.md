# Frontend Implementation: Notifications

Use this guide in `lab2-web` to connect notification UI to the Smart Library
API. Notifications are stored in MongoDB on the backend, but the frontend only
talks to the normal REST endpoints.

## Environment

Set the API base URL:

```env
VITE_API_URL=http://localhost:3000/api
```

All notification routes require:

```http
Authorization: Bearer <accessToken>
```

MongoDB is only configured in the backend `.env`. The frontend does not need a
MongoDB connection string.

## Types

```ts
export type NotificationType = "due-soon" | "overdue" | "system" | string

export type Notification = {
  id: string
  userId: string
  title: string
  message: string
  type: NotificationType
  readAt: string | null
  createdAt: string
}

export type NotificationQuery = {
  unreadOnly?: boolean
  limit?: number
}

export type CreateNotificationBody = {
  userId: string
  title: string
  message: string
  type?: NotificationType
}

export type UnreadNotificationCount = {
  count: number
}

export type MarkAllNotificationsReadResponse = {
  updatedCount: number
}
```

## Notification Endpoints

All routes require a logged-in user.

```http
GET /notifications
GET /notifications/unread-count
PATCH /notifications/read-all
PATCH /notifications/:id/read
DELETE /notifications/:id
```

Admin only:

```http
POST /notifications
```

Behavior:

- Normal users only see, mark, and delete their own notifications.
- Admins can create notifications for any user.
- `GET /notifications` returns newest notifications first.
- `unreadOnly=true` returns only notifications where `readAt === null`.
- `limit` accepts `1` to `100`; the backend defaults to `50`.
- Marking one notification as read returns the updated notification.
- Marking all notifications as read returns `{ updatedCount }`.
- Delete returns `204`.

List query params:

```text
unreadOnly=true|false, limit=1..100
```

Notification response:

```json
{
  "id": "663bf1f5e3f1a7a6f6c4e001",
  "userId": "user-id",
  "title": "Book due soon",
  "message": "Your borrowed book is due on 2026-05-19T10:00:00.000Z.",
  "type": "due-soon",
  "readAt": null,
  "createdAt": "2026-05-07T18:00:00.000Z"
}
```

Admin create body:

```json
{
  "userId": "user-id",
  "title": "Book due soon",
  "message": "Your borrowed book is due soon.",
  "type": "due-soon"
}
```

Unread count response:

```json
{
  "count": 3
}
```

Mark all read response:

```json
{
  "updatedCount": 3
}
```

## Automatic Notifications

The backend creates notifications when borrowing flows happen:

- Borrowing a due-soon book creates `type: "due-soon"`.
- Borrowing an already overdue/past-due book creates `type: "overdue"`.
- Borrowing a normal book creates `type: "system"`.
- Returning a book creates `type: "system"`.

After a successful borrow or return mutation, invalidate notification queries so
the notification badge and dropdown refresh.

## Suggested API Client Functions

This assumes the shared `apiRequest<T>()` helper from the users/categories guide
already attaches the bearer token.

```ts
const toNotificationQueryString = (query: NotificationQuery = {}) => {
  const params = new URLSearchParams()

  if (query.unreadOnly !== undefined) {
    params.set("unreadOnly", String(query.unreadOnly))
  }

  if (query.limit !== undefined) {
    params.set("limit", String(query.limit))
  }

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ""
}

export const getNotifications = (query?: NotificationQuery) =>
  apiRequest<Notification[]>(
    `/notifications${toNotificationQueryString(query)}`,
  )

export const getUnreadNotificationCount = () =>
  apiRequest<UnreadNotificationCount>("/notifications/unread-count")

export const createNotification = (body: CreateNotificationBody) =>
  apiRequest<Notification>("/notifications", {
    method: "POST",
    body: JSON.stringify(body),
  })

export const markNotificationRead = (id: string) =>
  apiRequest<Notification>(`/notifications/${id}/read`, {
    method: "PATCH",
  })

export const markAllNotificationsRead = () =>
  apiRequest<MarkAllNotificationsReadResponse>("/notifications/read-all", {
    method: "PATCH",
  })

export const deleteNotification = (id: string) =>
  apiRequest<void>(`/notifications/${id}`, {
    method: "DELETE",
  })
```

## Suggested React Query Keys

```ts
export const notificationKeys = {
  all: ["notifications"] as const,
  list: (query?: NotificationQuery) =>
    [...notificationKeys.all, "list", query] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
}
```

## Suggested Mutations

```ts
const queryClient = useQueryClient()

const invalidateNotifications = () => {
  queryClient.invalidateQueries({ queryKey: notificationKeys.all })
}

export const useMarkNotificationRead = () =>
  useMutation({
    mutationFn: markNotificationRead,
    onSuccess: invalidateNotifications,
  })

export const useMarkAllNotificationsRead = () =>
  useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidateNotifications,
  })

export const useDeleteNotification = () =>
  useMutation({
    mutationFn: deleteNotification,
    onSuccess: invalidateNotifications,
  })
```

Also call `invalidateNotifications()` after successful borrow and return
mutations.

## UI Integration Checklist

- Add a notification bell or menu in the authenticated app header.
- Load unread badge data from `GET /notifications/unread-count`.
- Load dropdown/list data from `GET /notifications?limit=10`.
- Show unread notifications differently when `readAt === null`.
- Mark a notification read when the user opens it or clicks a read action.
- Add a mark-all-read action that calls `PATCH /notifications/read-all`.
- Add a delete action for individual notifications.
- Hide admin notification creation UI unless `user.role === "admin"`.
- Invalidate `notificationKeys.all` after borrow, return, mark read, mark all
  read, delete, or admin create notification.
- Handle `503` by showing a quiet unavailable state, because it means MongoDB is
  not running or the backend cannot reach it.
- Do not store MongoDB connection details in the frontend.

## Suggested Empty States

- No notifications: show a simple empty state in the dropdown/list.
- No unread notifications: keep the badge hidden or show `0`.
- MongoDB unavailable: show a short message such as `Notifications unavailable`
  and keep the rest of the app usable.
