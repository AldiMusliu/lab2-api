import { Router } from 'express'
import { z } from 'zod'
import {
  getCurrentUser,
  login,
  logout,
  register,
} from '../controllers/authController.ts'
import { authenticateToken } from '../middleware/auth.ts'
import { validateBody } from '../middleware/validation.ts'

const router = Router()

const registerSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(120),
  email: z.email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const loginSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

router.post('/register', validateBody(registerSchema), register)
router.post('/login', validateBody(loginSchema), login)
router.get('/me', authenticateToken, getCurrentUser)
router.post('/logout', authenticateToken, logout)

export default router
