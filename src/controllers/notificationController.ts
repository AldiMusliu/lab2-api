import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.ts'
import {
  createNotification,
  deleteNotification,
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService.ts'

const parseLimit = (value: unknown) => {
  if (typeof value !== 'string') {
    return 50
  }

  const limit = Number(value)

  return Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 100) : 50
}

const handleNotificationError = (
  error: unknown,
  res: Response,
  message: string,
) => {
  console.error(message, error)

  return res.status(503).json({
    error: 'MongoDB unavailable',
    message: 'Notifications require a running MongoDB connection',
  })
}

export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const notifications = await listNotifications(req.user!.userId, {
      unreadOnly: req.query.unreadOnly === 'true',
      limit: parseLimit(req.query.limit),
    })

    return res.json(notifications)
  } catch (error) {
    return handleNotificationError(
      error,
      res,
      'List notifications error:',
    )
  }
}

export const getUnreadCount = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const count = await getUnreadNotificationCount(req.user!.userId)

    return res.json({ count })
  } catch (error) {
    return handleNotificationError(
      error,
      res,
      'Unread notification count error:',
    )
  }
}

export const createUserNotification = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const notification = await createNotification(req.body)

    return res.status(201).json(notification)
  } catch (error) {
    return handleNotificationError(
      error,
      res,
      'Create notification error:',
    )
  }
}

export const readNotification = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const notification = await markNotificationRead(
      req.params.id,
      req.user!.userId,
    )

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    return res.json(notification)
  } catch (error) {
    return handleNotificationError(
      error,
      res,
      'Read notification error:',
    )
  }
}

export const readAllNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const updatedCount = await markAllNotificationsRead(req.user!.userId)

    return res.json({ updatedCount })
  } catch (error) {
    return handleNotificationError(
      error,
      res,
      'Read all notifications error:',
    )
  }
}

export const removeNotification = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const deleted = await deleteNotification(req.params.id, req.user!.userId)

    if (!deleted) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    return res.status(204).send()
  } catch (error) {
    return handleNotificationError(
      error,
      res,
      'Delete notification error:',
    )
  }
}
