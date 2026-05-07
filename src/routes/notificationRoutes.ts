import { Router } from 'express'
import { z } from 'zod'
import {
  createUserNotification,
  getNotifications,
  getUnreadCount,
  readAllNotifications,
  readNotification,
  removeNotification,
} from '../controllers/notificationController.ts'
import { authenticateToken } from '../middleware/auth.ts'
import { requireRole } from '../middleware/requireRole.ts'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validation.ts'
import { isNotificationObjectId } from '../mongo/notificationModel.ts'

const router = Router()

const notificationBodySchema = z.object({
  userId: z.uuid('Invalid user ID format'),
  title: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(1000),
  type: z.string().trim().min(1).max(60).default('system'),
})

const notificationQuerySchema = z.object({
  unreadOnly: z.enum(['true', 'false']).optional(),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a positive integer')
    .optional(),
})

const notificationIdSchema = z.object({
  id: z.string().refine(isNotificationObjectId, {
    message: 'Invalid notification ID format',
  }),
})

router.use(authenticateToken)
router.get('/', validateQuery(notificationQuerySchema), getNotifications)
router.get('/unread-count', getUnreadCount)
router.post(
  '/',
  requireRole('admin'),
  validateBody(notificationBodySchema),
  createUserNotification,
)
router.patch('/read-all', readAllNotifications)
router.patch('/:id/read', validateParams(notificationIdSchema), readNotification)
router.delete('/:id', validateParams(notificationIdSchema), removeNotification)

export default router
