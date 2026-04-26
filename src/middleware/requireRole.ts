import type { NextFunction, Response } from 'express'
import type { UserRole } from '../db/schema.ts'
import type { AuthenticatedRequest } from './auth.ts'

export const requireRole = (role: UserRole) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    next()
  }
}
