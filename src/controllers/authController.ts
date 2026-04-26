import type { Request, Response } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../db/connection.ts'
import { users, type User } from '../db/schema.ts'
import { comparePasswords, hashPassword } from '../utils/password.ts'
import { generateToken } from '../utils/jwt.ts'
import type { AuthenticatedRequest } from '../middleware/auth.ts'

const toAuthUser = (user: User) => ({
  id: user.id,
  fullName: user.fullName,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
})

const createAccessToken = (user: User) => {
  return generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  })
}

const isUniqueViolation = (error: unknown) => {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  if ('code' in error && error.code === '23505') {
    return true
  }

  const cause = 'cause' in error ? error.cause : undefined

  return (
    typeof cause === 'object' &&
    cause !== null &&
    'code' in cause &&
    cause.code === '23505'
  )
}

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body
    const fullName = `${firstName} ${lastName}`.trim()
    const passwordHash = await hashPassword(password)

    const [user] = await db
      .insert(users)
      .values({
        fullName,
        firstName,
        lastName,
        email,
        passwordHash,
        role: 'user',
      })
      .returning()

    const accessToken = await createAccessToken(user)

    return res.status(201).json({
      accessToken,
      user: toAuthUser(user),
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email is already registered',
      })
    }

    console.error('Register error:', error)
    return res.status(500).json({ error: 'Failed to register user' })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isValidPassword = await comparePasswords(password, user.passwordHash)

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const accessToken = await createAccessToken(user)

    return res.json({
      accessToken,
      user: toAuthUser(user),
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Failed to login' })
  }
}

export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user!.userId))

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json(toAuthUser(user))
  } catch (error) {
    console.error('Current user error:', error)
    return res.status(500).json({ error: 'Failed to fetch current user' })
  }
}

export const logout = (req: AuthenticatedRequest, res: Response) => {
  return res.status(204).send()
}
