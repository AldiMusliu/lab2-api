import { env } from '../../env.ts'

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Smart Library API',
    version: '1.0.0',
    description:
      'Smart Library backend API for auth, profiles, categories, books, and borrowings.',
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: 'Local development server',
    },
  ],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Profile' },
    { name: 'Categories' },
    { name: 'Books' },
    { name: 'Borrowings' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'array', items: { type: 'object' } },
        },
      },
      AuthUser: {
        type: 'object',
        required: ['id', 'firstName', 'lastName', 'email', 'role'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['admin', 'user'] },
        },
      },
      AuthResponse: {
        type: 'object',
        required: ['accessToken', 'user'],
        properties: {
          accessToken: { type: 'string' },
          user: { $ref: '#/components/schemas/AuthUser' },
        },
      },
      Category: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
        },
      },
      Book: {
        type: 'object',
        required: [
          'id',
          'title',
          'author',
          'categoryId',
          'availableCopies',
          'totalCopies',
          'publishedYear',
          'language',
          'pages',
          'isbn',
          'shelfLocation',
          'formats',
          'readOnline',
          'description',
          'tags',
          'coverImage',
          'coverTone',
        ],
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          author: { type: 'string' },
          categoryId: { type: 'string', format: 'uuid' },
          availableCopies: { type: 'integer', minimum: 0 },
          totalCopies: { type: 'integer', minimum: 1 },
          publishedYear: { type: 'integer' },
          language: { type: 'string' },
          pages: { type: 'integer', minimum: 1 },
          isbn: { type: 'string' },
          shelfLocation: { type: 'string' },
          formats: {
            type: 'array',
            items: { type: 'string', enum: ['Print', 'E-book', 'Audiobook'] },
          },
          readOnline: { type: 'boolean' },
          description: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          coverImage: { type: 'string' },
          coverTone: { type: 'string' },
        },
      },
      BookInput: {
        type: 'object',
        required: [
          'title',
          'author',
          'categoryId',
          'availableCopies',
          'totalCopies',
          'publishedYear',
          'language',
          'pages',
          'formats',
          'description',
          'coverImage',
        ],
        properties: {
          title: { type: 'string' },
          author: { type: 'string' },
          categoryId: { type: 'string', format: 'uuid' },
          availableCopies: { type: 'integer', minimum: 0 },
          totalCopies: { type: 'integer', minimum: 1 },
          publishedYear: { type: 'integer' },
          language: { type: 'string' },
          pages: { type: 'integer', minimum: 1 },
          isbn: { type: 'string' },
          shelfLocation: { type: 'string' },
          formats: {
            type: 'array',
            items: { type: 'string', enum: ['Print', 'E-book', 'Audiobook'] },
          },
          readOnline: { type: 'boolean' },
          description: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          coverImage: { type: 'string' },
          coverTone: { type: 'string' },
        },
      },
      Borrowing: {
        type: 'object',
        required: [
          'id',
          'userId',
          'bookId',
          'borrowedAt',
          'dueAt',
          'returnedAt',
          'status',
        ],
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          user: {
            type: 'object',
            nullable: true,
            description:
              'Included for admin list responses to provide borrower identity details.',
            properties: {
              id: { type: 'string', format: 'uuid' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              name: { type: 'string' },
            },
          },
          bookId: { type: 'string', format: 'uuid' },
          borrowedAt: { type: 'string', format: 'date-time' },
          dueAt: { type: 'string', format: 'date-time' },
          returnedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          status: {
            type: 'string',
            enum: ['active', 'returned', 'overdue'],
          },
        },
      },
      BorrowingInput: {
        type: 'object',
        required: ['bookId', 'dueAt'],
        properties: {
          userId: {
            type: 'string',
            format: 'uuid',
            description:
              'Optional admin-only override. Regular users always borrow for themselves.',
          },
          bookId: { type: 'string', format: 'uuid' },
          dueAt: { type: 'string', format: 'date-time' },
        },
      },
      ChangePasswordBody: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: {
            type: 'string',
            example: 'password123',
          },
          newPassword: {
            type: 'string',
            minLength: 8,
            example: 'newPassword123',
          },
        },
      },
      MessageResponse: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check endpoint',
        responses: {
          200: {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Server is healthy' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'password'],
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          400: { description: 'Validation failed' },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and receive a JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Logged in',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Current user returned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthUser' },
              },
            },
          },
          401: { description: 'Missing or invalid token' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Stateless logout',
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: 'Logged out' },
          401: { description: 'Missing or invalid token' },
        },
      },
    },
    '/api/profile/me': {
      get: {
        tags: ['Profile'],
        summary: 'Get the authenticated profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Profile returned' },
          401: { description: 'Missing or invalid token' },
        },
      },
      put: {
        tags: ['Profile'],
        summary: 'Update the authenticated profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName'],
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile updated' },
          400: { description: 'Validation failed' },
          401: { description: 'Missing or invalid token' },
        },
      },
    },
    '/api/profile/me/password': {
      put: {
        tags: ['Profile'],
        summary: 'Change the authenticated user password',
        description:
          'Verifies the current password, hashes the new password, and updates the authenticated user.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChangePasswordBody' },
            },
          },
        },
        responses: {
          200: {
            description: 'Password changed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: { message: 'Password changed successfully' },
              },
            },
          },
          400: {
            description: 'Validation failed or current password is incorrect',
          },
          401: { description: 'Missing or invalid token' },
          404: { description: 'User not found' },
        },
      },
    },
    '/api/books': {
      get: {
        tags: ['Books'],
        summary: 'List books',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          {
            name: 'categoryId',
            in: 'query',
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'availability',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['available', 'online', 'waitlist', 'all'],
            },
          },
          {
            name: 'sort',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['title', 'author', 'newest', 'copies'],
            },
          },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          200: {
            description: 'Books returned',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Book' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Books'],
        summary: 'Create a book',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BookInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Book created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Book' },
              },
            },
          },
          400: { description: 'Validation failed' },
          401: { description: 'Missing or invalid token' },
          403: { description: 'Admin role required' },
          409: { description: 'Duplicate ISBN' },
        },
      },
    },
    '/api/books/{id}': {
      get: {
        tags: ['Books'],
        summary: 'Get a book',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Book returned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Book' },
              },
            },
          },
          404: { description: 'Book not found' },
        },
      },
      put: {
        tags: ['Books'],
        summary: 'Update a book',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BookInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Book updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Book' },
              },
            },
          },
          400: { description: 'Validation failed' },
          401: { description: 'Missing or invalid token' },
          403: { description: 'Admin role required' },
          404: { description: 'Book not found' },
          409: { description: 'Duplicate ISBN' },
        },
      },
      delete: {
        tags: ['Books'],
        summary: 'Delete a book',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          204: { description: 'Book deleted' },
          401: { description: 'Missing or invalid token' },
          403: { description: 'Admin role required' },
          404: { description: 'Book not found' },
          409: { description: 'Book is still referenced' },
        },
      },
    },
    '/api/borrowings': {
      get: {
        tags: ['Borrowings'],
        summary: 'List borrowings',
        description:
          'Admins receive all borrowings. Regular users receive only their own borrowings.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Borrowings returned',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Borrowing' },
                },
              },
            },
          },
          401: { description: 'Missing or invalid token' },
        },
      },
      post: {
        tags: ['Borrowings'],
        summary: 'Create a borrowing',
        description:
          'Borrows an available book and decrements availableCopies inside a PostgreSQL transaction.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BorrowingInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Borrowing created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Borrowing' },
              },
            },
          },
          400: { description: 'Validation failed' },
          401: { description: 'Missing or invalid token' },
          404: { description: 'User or book not found' },
          409: {
            description:
              'Book has no available copies or user already has an active borrowing for this book',
          },
        },
      },
    },
    '/api/borrowings/{id}': {
      get: {
        tags: ['Borrowings'],
        summary: 'Get a borrowing',
        description:
          'Admins can access any borrowing. Regular users can access only their own borrowing.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Borrowing returned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Borrowing' },
              },
            },
          },
          401: { description: 'Missing or invalid token' },
          403: { description: 'Borrowing belongs to another user' },
          404: { description: 'Borrowing not found' },
        },
      },
    },
    '/api/borrowings/{id}/return': {
      patch: {
        tags: ['Borrowings'],
        summary: 'Return a borrowing',
        description:
          'Marks a borrowing returned and increments availableCopies inside a PostgreSQL transaction.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Borrowing returned successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Borrowing' },
              },
            },
          },
          401: { description: 'Missing or invalid token' },
          403: { description: 'Borrowing belongs to another user' },
          404: { description: 'Borrowing not found' },
          409: { description: 'Borrowing has already been returned' },
        },
      },
    },
    '/api/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List categories',
        responses: {
          200: {
            description: 'Categories returned',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Category' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Categories'],
        summary: 'Create a category',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Category created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Category' },
              },
            },
          },
          401: { description: 'Missing or invalid token' },
          403: { description: 'Admin role required' },
          409: { description: 'Category already exists' },
        },
      },
    },
    '/api/categories/{id}': {
      get: {
        tags: ['Categories'],
        summary: 'Get a category',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Category returned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Category' },
              },
            },
          },
          404: { description: 'Category not found' },
        },
      },
      put: {
        tags: ['Categories'],
        summary: 'Update a category',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Category updated' },
          401: { description: 'Missing or invalid token' },
          403: { description: 'Admin role required' },
          404: { description: 'Category not found' },
        },
      },
      delete: {
        tags: ['Categories'],
        summary: 'Delete a category',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          204: { description: 'Category deleted' },
          401: { description: 'Missing or invalid token' },
          403: { description: 'Admin role required' },
          404: { description: 'Category not found' },
        },
      },
    },
  },
} as const
