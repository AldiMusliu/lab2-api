import { Router } from 'express'
import { z } from 'zod'
import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
} from '../controllers/userController.ts'
import { authenticateToken } from '../middleware/auth.ts'
import { requireRole } from '../middleware/requireRole.ts'
import { validateBody, validateParams } from '../middleware/validation.ts'

const router = Router()

const userRoleSchema = z.enum(['admin', 'user'])

const createUserSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(60),
  lastName: z.string().trim().min(1, 'Last name is required').max(60),
  email: z.email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: userRoleSchema.default('user'),
})

const updateUserSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(60),
  lastName: z.string().trim().min(1, 'Last name is required').max(60),
  email: z.email('Invalid email address').max(255),
  role: userRoleSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional(),
})

const uuidSchema = z.object({
  id: z.uuid('Invalid user ID format'),
})

router.use(authenticateToken)
router.use(requireRole('admin'))
router.get('/', listUsers)
router.post('/', validateBody(createUserSchema), createUser)
router.get('/:id', validateParams(uuidSchema), getUserById)
router.put('/:id', validateParams(uuidSchema), validateBody(updateUserSchema), updateUser)
router.delete('/:id', validateParams(uuidSchema), deleteUser)

export default router
