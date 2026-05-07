import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import app from '../src/server.ts'
import { cleanupDatabase, createTestUser } from './helpers/dbHelpers.ts'

describe('Users API', () => {
  afterEach(async () => {
    await cleanupDatabase()
  })

  it('requires admin role to list users', async () => {
    const { accessToken } = await createTestUser()

    await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403)
  })

  it('lists users for admins without password hashes', async () => {
    const admin = await createTestUser({ role: 'admin' })
    const user = await createTestUser({
      firstName: 'Library',
      lastName: 'User',
    })

    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200)

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: user.user.id,
          firstName: 'Library',
          lastName: 'User',
          email: user.user.email,
          role: 'user',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      ]),
    )
    expect(response.body[0]).not.toHaveProperty('passwordHash')
  })

  it('allows admins to create users', async () => {
    const admin = await createTestUser({ role: 'admin' })

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        firstName: 'New',
        lastName: 'Admin',
        email: 'new-admin@example.com',
        password: 'Password123!',
        role: 'admin',
      })
      .expect(201)

    expect(response.body).toEqual(
      expect.objectContaining({
        firstName: 'New',
        lastName: 'Admin',
        email: 'new-admin@example.com',
        role: 'admin',
      }),
    )
    expect(response.body).not.toHaveProperty('passwordHash')
  })

  it('returns 409 for duplicate user emails', async () => {
    const admin = await createTestUser({ role: 'admin' })
    const existing = await createTestUser()

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        firstName: 'Duplicate',
        lastName: 'Email',
        email: existing.user.email,
        password: 'Password123!',
        role: 'user',
      })
      .expect(409)

    expect(response.body).toEqual({
      error: 'Conflict',
      message: 'Email is already registered',
    })
  })

  it('allows admins to update users and change their password', async () => {
    const admin = await createTestUser({ role: 'admin' })
    const user = await createTestUser()

    const response = await request(app)
      .put(`/api/users/${user.user.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        firstName: 'Updated',
        lastName: 'Reader',
        email: 'updated-reader@example.com',
        role: 'user',
        password: 'NewPassword123!',
      })
      .expect(200)

    expect(response.body).toEqual(
      expect.objectContaining({
        id: user.user.id,
        firstName: 'Updated',
        lastName: 'Reader',
        email: 'updated-reader@example.com',
        role: 'user',
      }),
    )

    await request(app)
      .post('/api/auth/login')
      .send({
        email: 'updated-reader@example.com',
        password: 'NewPassword123!',
      })
      .expect(200)
  })

  it('prevents admins from changing their own role', async () => {
    const admin = await createTestUser({ role: 'admin' })

    await request(app)
      .put(`/api/users/${admin.user.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        firstName: admin.user.firstName,
        lastName: admin.user.lastName,
        email: admin.user.email,
        role: 'user',
      })
      .expect(400)
  })

  it('allows admins to delete other users but not themselves', async () => {
    const admin = await createTestUser({ role: 'admin' })
    const user = await createTestUser()

    await request(app)
      .delete(`/api/users/${user.user.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(204)

    await request(app)
      .delete(`/api/users/${admin.user.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(400)
  })
})
