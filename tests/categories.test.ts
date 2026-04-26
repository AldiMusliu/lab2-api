import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { app } from '../src/server.ts'
import {
  cleanupDatabase,
  createTestCategory,
  createTestUser,
} from './helpers/dbHelpers.ts'

describe('Categories API', () => {
  afterEach(async () => {
    await cleanupDatabase()
  })

  it('lists categories publicly as an array', async () => {
    await createTestCategory('Software Engineering')
    await createTestCategory('Data & AI')

    const response = await request(app).get('/api/categories').expect(200)

    expect(response.body).toEqual([
      expect.objectContaining({ name: 'Data & AI' }),
      expect.objectContaining({ name: 'Software Engineering' }),
    ])
  })

  it('gets a category by id publicly', async () => {
    const category = await createTestCategory('Product Design')

    const response = await request(app)
      .get(`/api/categories/${category.id}`)
      .expect(200)

    expect(response.body).toEqual({
      id: category.id,
      name: category.name,
    })
  })

  it('allows admins to create categories', async () => {
    const { accessToken } = await createTestUser({ role: 'admin' })

    const response = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Modern Fiction' })
      .expect(201)

    expect(response.body).toEqual({
      id: expect.any(String),
      name: 'Modern Fiction',
    })
  })

  it('rejects category writes from normal users', async () => {
    const { accessToken } = await createTestUser()

    const response = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Business & Leadership' })
      .expect(403)

    expect(response.body).toHaveProperty('error', 'Forbidden')
  })

  it('allows admins to update categories', async () => {
    const category = await createTestCategory('Old Name')
    const { accessToken } = await createTestUser({ role: 'admin' })

    const response = await request(app)
      .put(`/api/categories/${category.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'New Name' })
      .expect(200)

    expect(response.body).toEqual({
      id: category.id,
      name: 'New Name',
    })
  })

  it('allows admins to delete categories', async () => {
    const category = await createTestCategory('Temporary Category')
    const { accessToken } = await createTestUser({ role: 'admin' })

    await request(app)
      .delete(`/api/categories/${category.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204)
  })

  it('returns 409 for duplicate category names', async () => {
    await createTestCategory('Data & AI')
    const { accessToken } = await createTestUser({ role: 'admin' })

    const response = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Data & AI' })
      .expect(409)

    expect(response.body).toHaveProperty('error', 'Conflict')
  })
})
