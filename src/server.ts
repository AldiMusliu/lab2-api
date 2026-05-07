import express from 'express'
import authRoutes from './routes/authRoutes.ts'
import bookRoutes from './routes/bookRoutes.ts'
import borrowingRoutes from './routes/borrowingRoutes.ts'
import categoryRoutes from './routes/categoryRoutes.ts'
import dashboardRoutes from './routes/dashboardRoutes.ts'
import notificationRoutes from './routes/notificationRoutes.ts'
import userRoutes from './routes/userRoutes.ts'
import usersRoutes from './routes/usersRoutes.ts'
import swaggerUi from 'swagger-ui-express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import { isDev, isTest } from '../env.ts'
import { openApiSpec } from './docs/openapi.ts'
import { errorHandler } from './middleware/errorHandler.ts'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  morgan('dev', {
    skip: () => isTest(),
  }),
)

app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is healthy' })
})

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is healthy' })
})

app.get('/api/docs.json', (req, res) => {
  res.status(200).json(openApiSpec)
})

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec))

app.use('/api/auth', authRoutes)
app.use('/api/books', bookRoutes)
app.use('/api/borrowings', borrowingRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/profile', userRoutes)
app.use('/api/users', usersRoutes)

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err.stack)
    res.status(500).json({
      error: 'Something went wrong!',
      ...(isDev() && { details: err.message }),
    })
  },
)

//We export in both ways to allow for flexibility in importing the app in other modules,
// such as for testing or further configuration.
export { app }
export default app
