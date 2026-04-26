import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import app from '../src/server.ts'
import { cleanupDatabase, createTestUser } from './helpers/dbHelpers.ts'

describe('Profile API', () => {
  afterEach(async () => {
    await cleanupDatabase()
  })

  describe('PUT /api/profile/me/password', () => {
    it('changes the authenticated user password', async () => {
      const { user, accessToken, rawPassword } = await createTestUser()
      const newPassword = 'NewPassword123!'

      const response = await request(app)
        .put('/api/profile/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: rawPassword,
          newPassword,
        })
        .expect(200)

      expect(response.body).toEqual({
        message: 'Password changed successfully',
      })

      await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: newPassword,
        })
        .expect(200)
    })

    it('rejects an incorrect current password', async () => {
      const { accessToken } = await createTestUser()

      const response = await request(app)
        .put('/api/profile/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'NewPassword123!',
        })
        .expect(400)

      expect(response.body).toHaveProperty(
        'error',
        'Current password is incorrect',
      )
    })

    it('validates the new password length', async () => {
      const { accessToken, rawPassword } = await createTestUser()

      const response = await request(app)
        .put('/api/profile/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: rawPassword,
          newPassword: 'short',
        })
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Validation failed')
    })
  })
})
