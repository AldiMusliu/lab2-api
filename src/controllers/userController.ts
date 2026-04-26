import type { Response } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../db/connection.ts'
import { users, type User } from '../db/schema.ts'
import type { AuthenticatedRequest } from '../middleware/auth.ts'
import { comparePasswords, hashPassword } from '../utils/password.ts'

const toProfile = (user: User) => ({
  id: user.id,
  fullName: user.fullName,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
})

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
    const fullName = `${firstName} ${lastName}`.trim()

    const [user] = await db
      .update(users)
      .set({
        fullName,
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
