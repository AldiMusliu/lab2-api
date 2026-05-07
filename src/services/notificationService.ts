import { type Filter, ObjectId } from 'mongodb'
import { isTest } from '../../env.ts'
import {
  getNotificationsCollection,
  type NotificationDocument,
} from '../mongo/notificationModel.ts'

export type NotificationDto = {
  id: string
  userId: string
  title: string
  message: string
  type: string
  readAt: string | null
  createdAt: string
}

export type CreateNotificationInput = {
  userId: string
  title: string
  message: string
  type?: string
}

type StoredNotification = NotificationDocument & { _id: ObjectId }

const toNotification = (
  notification: StoredNotification,
): NotificationDto => ({
  id: notification._id.toHexString(),
  userId: notification.userId,
  title: notification.title,
  message: notification.message,
  type: notification.type,
  readAt: notification.readAt?.toISOString() ?? null,
  createdAt: notification.createdAt.toISOString(),
})

export const createNotification = async (
  input: CreateNotificationInput,
): Promise<NotificationDto> => {
  const collection = await getNotificationsCollection()
  const now = new Date()
  const notification: NotificationDocument = {
    userId: input.userId,
    title: input.title,
    message: input.message,
    type: input.type ?? 'system',
    readAt: null,
    createdAt: now,
  }
  const result = await collection.insertOne(notification)

  return toNotification({ ...notification, _id: result.insertedId })
}

export const createNotificationSafely = async (
  input: CreateNotificationInput,
) => {
  if (isTest()) {
    return
  }

  try {
    await createNotification(input)
  } catch (error) {
    console.warn('Notification write skipped:', error)
  }
}

export const listNotifications = async (
  userId: string,
  options: { unreadOnly?: boolean; limit?: number } = {},
) => {
  const collection = await getNotificationsCollection()
  const filter: Filter<NotificationDocument> = { userId }

  if (options.unreadOnly) {
    filter.readAt = null
  }

  const notifications = await collection
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(options.limit ?? 50)
    .toArray()

  return notifications.map(toNotification)
}

export const getUnreadNotificationCount = async (userId: string) => {
  const collection = await getNotificationsCollection()

  return collection.countDocuments({ userId, readAt: null })
}

export const markNotificationRead = async (id: string, userId: string) => {
  const collection = await getNotificationsCollection()
  const notification = await collection.findOneAndUpdate(
    {
      _id: new ObjectId(id),
      userId,
    },
    {
      $set: {
        readAt: new Date(),
      },
    },
    {
      returnDocument: 'after',
    },
  )

  return notification ? toNotification(notification) : null
}

export const markAllNotificationsRead = async (userId: string) => {
  const collection = await getNotificationsCollection()
  const result = await collection.updateMany(
    {
      userId,
      readAt: null,
    },
    {
      $set: {
        readAt: new Date(),
      },
    },
  )

  return result.modifiedCount
}

export const deleteNotification = async (id: string, userId: string) => {
  const collection = await getNotificationsCollection()
  const result = await collection.deleteOne({
    _id: new ObjectId(id),
    userId,
  })

  return result.deletedCount > 0
}
