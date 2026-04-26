import request from 'supertest'
import app from '../src/server.ts'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanupDatabase, createTestUser } from './helpers/dbHelpers.ts'

describe('Authentication Endpoints', () => {
  afterEach(async () => {
    await cleanupDatabase()
  })

  describe('POST /api/auth/register', () => {
    it('registers a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Alex Reader',
          email: `test-${Date.now()}@example.com`,
          password: 'TestPassword123!',
        })
        .expect(201)

      expect(response.body).toHaveProperty('accessToken')
      expect(response.body.user).toMatchObject({
        fullName: 'Alex Reader',
        role: 'user',
      })
      expect(response.body.user).not.toHaveProperty('passwordHash')
    })

    it('returns 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Alex Reader',
          email: 'invalid-email',
          password: 'TestPassword123!',
        })
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Validation failed')
    })

    it('returns 409 for duplicate email', async () => {
      const { user } = await createTestUser()

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Duplicate User',
          email: user.email,
          password: 'TestPassword123!',
        })
        .expect(409)

      expect(response.body).toHaveProperty('error', 'Conflict')
    })
  })

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      const { user, rawPassword } = await createTestUser()

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: rawPassword,
        })
        .expect(200)

      expect(response.body).toHaveProperty('accessToken')
      expect(response.body.user).toMatchObject({
        id: user.id,
        email: user.email,
        role: user.role,
      })
      expect(response.body.user).not.toHaveProperty('passwordHash')
    })

    it('returns 401 for invalid credentials', async () => {
      const { user } = await createTestUser()

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'wrongpassword',
        })
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Invalid credentials')
    })
  })

  describe('GET /api/auth/me', () => {
    it('returns the current authenticated user', async () => {
      const { user, accessToken } = await createTestUser()

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      })
      expect(response.body).not.toHaveProperty('passwordHash')
    })

    it('returns 401 without a bearer token', async () => {
      await request(app).get('/api/auth/me').expect(401)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('returns 204 for an authenticated user', async () => {
      const { accessToken } = await createTestUser()

      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204)
    })
  })
})
