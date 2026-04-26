import type { Response } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../db/connection.ts'
import { users, type User } from '../db/schema.ts'
import type { AuthenticatedRequest } from '../middleware/auth.ts'

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
