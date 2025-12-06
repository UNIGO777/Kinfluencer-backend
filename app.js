import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { connectDB } from './src/config/db.js'
import userRoutes from './src/routes/userRoutes.js'
import adminRoutes from './src/routes/adminRoutes.js'
import uploadRoutes from './src/routes/uploadRoutes.js'
import path from 'path'

const app = express()

app.use(cors())
app.use(express.json())
app.use(morgan('tiny'))

// serve uploaded files
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')))

const mongoUri = process.env.MONGODB_URI
if (mongoUri) {
  connectDB(mongoUri)
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/users', userRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/upload', uploadRoutes)

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use((err, req, res, next) => {
  const status = err.status || 500
  res.status(status).json({ error: err.message || 'Server error' })
})

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
