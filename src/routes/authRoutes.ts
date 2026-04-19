import { Router } from 'express'
import { signIn, signUp } from '../controllers/authController.ts'
import { validateBody } from '../middleware/validation.ts'
import z from 'zod'

const signInSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

const signUpSchema = z.object({
  email: z.email('Invalid email format'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username too long'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

const router = Router()

//for more complex validation we should create or extend our schema not this one that we have done from the db validation
//for example if we want to do a regex for password, the db does not have option to do that
router.post('/sign-up', validateBody(signUpSchema), signUp)

router.post('/sign-in', validateBody(signInSchema), signIn)

export default router
