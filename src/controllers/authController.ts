import type { Request, Response } from 'express'
import { db } from '../db/connection.ts'
import { users, type NewUser } from '../db/schema.ts'
import { comparePasswords, hashPassword } from '../utils/password.ts'
import { generateToken } from '../utils/jwt.ts'
import { eq } from 'drizzle-orm'

export const signUp = async (
  req: Request<any, NewUser, NewUser>,
  res: Response,
) => {
  try {
    const hashtedPassword = await hashPassword(req.body.password)
    const [user] = await db
      .insert(users)
      .values({
        ...req.body,
        password: hashtedPassword,
      })
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        createdAt: users.createdAt,
      })
    const token = await generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
    })

    return res.status(201).json({
      message: 'User created',
      user,
      token,
    })
  } catch (e) {
    console.log('Sign up error', e)
    res.status(500).json({ error: 'Failed to create user' })
  }
}

export const signIn = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentails',
      })
    }
    const isValidatedPassword = await comparePasswords(password, user.password)

    if (!isValidatedPassword) {
      return res.status(401).json({
        error: 'Invalid credentails',
      })
    }

    const token = await generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
    })
    return res.status(201).json({
      message: 'Sign in successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      },
      token,
    })
  } catch (e) {
    console.log('Sign in error')
    res.status(500).json({
      error: 'Failed to sign in',
    })
  }
}
