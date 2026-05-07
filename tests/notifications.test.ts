import request from 'supertest'
import { afterEach, describe, it } from 'vitest'
import { app } from '../src/server.ts'
import { cleanupDatabase, createTestUser } from './helpers/dbHelpers.ts'

describe('Notifications API', () => {
  afterEach(async () => {
    await cleanupDatabase()
  })

  it('requires authentication to list notifications', async () => {
    await request(app).get('/api/notifications').expect(401)
  })

  it('requires admin role to create notifications', async () => {
    const { accessToken, user } = await createTestUser()

    await request(app)
      .post('/api/notifications')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        userId: user.id,
        title: 'Book due soon',
        message: 'Your borrowed book is due soon.',
        type: 'due-soon',
      })
      .expect(403)
  })

  it('validates notification creation payloads before writing to MongoDB', async () => {
    const { accessToken } = await createTestUser({ role: 'admin' })

    await request(app)
      .post('/api/notifications')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: '',
        message: '',
      })
      .expect(400)
  })

  it('validates MongoDB ObjectId params', async () => {
    const { accessToken } = await createTestUser()

    await request(app)
      .patch('/api/notifications/not-an-object-id/read')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400)
  })
})
