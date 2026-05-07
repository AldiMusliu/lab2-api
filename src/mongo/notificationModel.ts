import { type Collection, ObjectId } from 'mongodb'
import { getMongoDb } from './connection.ts'

export type NotificationDocument = {
  _id?: ObjectId
  userId: string
  title: string
  message: string
  type: string
  readAt: Date | null
  createdAt: Date
}

let indexesReady: Promise<unknown> | null = null

const ensureIndexes = (collection: Collection<NotificationDocument>) => {
  indexesReady ??= Promise.all([
    collection.createIndex({ userId: 1, createdAt: -1 }),
    collection.createIndex({ userId: 1, readAt: 1 }),
  ])

  return indexesReady
}

export const getNotificationsCollection = async () => {
  const db = await getMongoDb()
  const collection = db.collection<NotificationDocument>('notifications')

  await ensureIndexes(collection)

  return collection
}

export const isNotificationObjectId = (value: string) => {
  return /^[0-9a-fA-F]{24}$/.test(value)
}
