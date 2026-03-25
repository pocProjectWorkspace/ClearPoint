import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { signToken } from '../middleware/auth'

const prisma = new PrismaClient()
export const authRouter = Router()

// Built-in user accounts (checked before DB lookup)
const BUILTIN_USERS: Array<{ email: string; password: string; name: string }> = [
  {
    email: 'lakshmi.nair@mindssparc.com',
    password: 'Password@123',
    name: 'Lakshmi Nair',
  },
  {
    email: 'rajeshp@mindssparc.com',
    password: 'Password@123',
    name: 'Rajesh P',
  },
]

// Also support the env-var user if configured
if (process.env.CONSULTANT_EMAIL && process.env.CONSULTANT_PASSWORD) {
  BUILTIN_USERS.push({
    email: process.env.CONSULTANT_EMAIL,
    password: process.env.CONSULTANT_PASSWORD,
    name: process.env.CONSULTANT_NAME || 'Consultant',
  })
}

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ data: null, error: 'Email and password required' })
    return
  }

  // Check against built-in users
  const matchedUser = BUILTIN_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  )

  if (!matchedUser) {
    res.status(401).json({ data: null, error: 'Invalid credentials' })
    return
  }

  // Ensure consultant exists in DB (upsert on first login)
  try {
    let consultant = await prisma.consultant.findUnique({
      where: { email: matchedUser.email },
    })
    if (!consultant) {
      consultant = await prisma.consultant.create({
        data: {
          email: matchedUser.email,
          name: matchedUser.name,
          passwordHash: 'builtin-auth',
        },
      })
    }

    const token = signToken({ consultantId: consultant.id, email: consultant.email })

    res.json({
      data: {
        token,
        consultant: { id: consultant.id, name: consultant.name, email: consultant.email },
      },
    })
  } catch (err) {
    console.error('Login DB error:', err)
    res.status(503).json({ data: null, error: 'Database unavailable — please try again shortly' })
  }
})
