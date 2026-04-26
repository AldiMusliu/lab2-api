import type { NextFunction, Request, Response } from 'express'
import { verifyToken, type JwtPayload } from '../utils/jwt.ts'

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization
    const [scheme, token] = authHeader?.split(' ') ?? []

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    req.user = await verifyToken(token)
    next()
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}
