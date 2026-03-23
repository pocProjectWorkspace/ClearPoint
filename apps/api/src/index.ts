import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import { loadQuestions } from '@mindssparc/question-bank'
import { authRouter } from './routes/auth'
import { engagementsRouter } from './routes/engagements'
import { sessionRouter } from './routes/sessions'
import { answersRouter } from './routes/answers'
import { diagnosticRouter } from './routes/diagnostic'
import { exportRouter } from './routes/export'
import { annotationsRouter } from './routes/annotations'

const app = express()
const PORT = process.env.PORT || 3001
const isProduction = process.env.NODE_ENV === 'production'
const prisma = new PrismaClient()

// CORS — restrictive in production, permissive in dev
const corsOptions = isProduction
  ? {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        const allowed = process.env.VITE_APP_URL || ''
        if (!origin || origin === allowed || origin.endsWith('.vercel.app')) {
          callback(null, true)
        } else {
          callback(null, false)
        }
      },
    }
  : {}
app.use(cors(corsOptions))
app.use(express.json())

// Request logging (skip health checks to reduce noise)
app.use((req, res, next) => {
  if (req.path === '/api/health') return next()
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`)
  })
  next()
})

// Simple in-memory rate limiting for auth endpoints
const authAttempts = new Map<string, { count: number; resetAt: number }>()

function rateLimitAuth(req: any, res: any, next: any) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  const now = Date.now()
  const record = authAttempts.get(ip)
  if (record && record.resetAt > now) {
    if (record.count >= 10) {
      res.status(429).json({ data: null, error: 'Too many requests' })
      return
    }
    record.count++
  } else {
    authAttempts.set(ip, { count: 1, resetAt: now + 60000 })
  }
  next()
}

// Routes
app.use('/api/auth', rateLimitAuth, authRouter)
app.use('/api/engagements', engagementsRouter)
app.use('/api/engagements', sessionRouter)
app.use('/api/engagements', answersRouter)
app.use('/api/engagements', annotationsRouter)
app.use('/api/diagnostic', diagnosticRouter)
app.use('/api/export', exportRouter)

// Enhanced health check
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'connected'
  try { await prisma.consultant.count() } catch { dbStatus = 'error' }

  const questions = loadQuestions()
  const domains = new Set(questions.map(q => q.domain))

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    name: 'ClearPoint',
    version: '1.0.0',
    database: dbStatus,
    questionBank: { total: questions.length, domains: domains.size },
    environment: isProduction ? 'production' : 'development',
  })
})

// Startup
if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('dev'))) {
  console.warn('WARNING: Using default JWT_SECRET in production is insecure')
}

app.listen(PORT, () => {
  console.log(`ClearPoint API running on port ${PORT} [${isProduction ? 'production' : 'development'}]`)
})

export default app
