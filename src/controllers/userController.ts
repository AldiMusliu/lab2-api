import type { Response } from 'express'
import { asc, eq } from 'drizzle-orm'
import { db } from '../db/connection.ts'
import { users, type NewUser, type User } from '../db/schema.ts'
import type { AuthenticatedRequest } from '../middleware/auth.ts'
import { comparePasswords, hashPassword } from '../utils/password.ts'

const toProfile = (user: User) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
})

const toUser = (user: User) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
})

const hasDbErrorCode = (error: unknown, code: string) => {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  if ('code' in error && error.code === code) {
    return true
  }

  const cause = 'cause' in error ? error.cause : undefined

  return (
    typeof cause === 'object' &&
    cause !== null &&
    'code' in cause &&
    cause.code === code
  )
}

const handleUserWriteError = (error: unknown, res: Response) => {
  if (hasDbErrorCode(error, '23505')) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Email is already registered',
    })
  }

  return undefined
}

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user!.userId))

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json(toProfile(user))
  } catch (error) {
    console.error('Get profile error:', error)
    return res.status(500).json({ error: 'Failed to fetch profile' })
  }
}

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { firstName, lastName } = req.body

    const [user] = await db
      .update(users)
      .set({
        firstName,
        lastName,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user!.userId))
      .returning()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json(toProfile(user))
  } catch (error) {
    console.error('Update profile error:', error)
    return res.status(500).json({ error: 'Failed to update profile' })
  }
}

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { currentPassword, newPassword } = req.body
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user!.userId))

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const isCurrentPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash,
    )

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }

    const passwordHash = await hashPassword(newPassword)

    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user!.userId))

    return res.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    return res.status(500).json({ error: 'Failed to change password' })
  }
}

export const listUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allUsers = await db.select().from(users).orderBy(asc(users.email))

    return res.json(allUsers.map(toUser))
  } catch (error) {
    console.error('List users error:', error)
    return res.status(500).json({ error: 'Failed to fetch users' })
  }
}

export const getUserById = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.params.id))

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json(toUser(user))
  } catch (error) {
    console.error('Get user error:', error)
    return res.status(500).json({ error: 'Failed to fetch user' })
  }
}

export const createUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { firstName, lastName, email, password, role } = req.body
    const passwordHash = await hashPassword(password)

    const [user] = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email,
        passwordHash,
        role,
      })
      .returning()

    return res.status(201).json(toUser(user))
  } catch (error) {
    const handled = handleUserWriteError(error, res)

    if (handled) {
      return handled
    }

    console.error('Create user error:', error)
    return res.status(500).json({ error: 'Failed to create user' })
  }
}

export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { firstName, lastName, email, role, password } = req.body

    if (req.params.id === req.user!.userId && role !== req.user!.role) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Admins cannot change their own role',
      })
    }

    const userData: Partial<NewUser> = {
      firstName,
      lastName,
      email,
      role,
      updatedAt: new Date(),
    }

    if (password) {
      userData.passwordHash = await hashPassword(password)
    }

    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, req.params.id))
      .returning()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json(toUser(user))
  } catch (error) {
    const handled = handleUserWriteError(error, res)

    if (handled) {
      return handled
    }

    console.error('Update user error:', error)
    return res.status(500).json({ error: 'Failed to update user' })
  }
}

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.params.id === req.user!.userId) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Admins cannot delete their own account',
      })
    }

    const [user] = await db
      .delete(users)
      .where(eq(users.id, req.params.id))
      .returning()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(204).send()
  } catch (error) {
    console.error('Delete user error:', error)
    return res.status(500).json({ error: 'Failed to delete user' })
  }
}
