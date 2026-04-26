import { createSecretKey } from 'crypto'
import { jwtVerify, SignJWT, type JWTPayload } from 'jose'
import env from '../../env.ts'
import type { UserRole } from '../db/schema.ts'

export interface JwtPayload extends JWTPayload {
  id: string
  userId: string
  email: string
  role: UserRole
}

export type TokenPayloadInput = Pick<JwtPayload, 'userId' | 'email' | 'role'>

export const generateToken = (payload: TokenPayloadInput): Promise<string> => {
  const secretKey = createSecretKey(env.JWT_SECRET, 'utf-8')

  return new SignJWT(payload)
    .setProtectedHeader({
      alg: 'HS256',
    })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secretKey)
}

export const verifyToken = async (token: string): Promise<JwtPayload> => {
  const secretKey = createSecretKey(env.JWT_SECRET, 'utf-8')
  const { payload } = await jwtVerify(token, secretKey)
  const userId = payload.userId as string

  return {
    ...payload,
    id: userId,
    userId,
    email: payload.email as string,
    role: payload.role as UserRole,
  }
}
