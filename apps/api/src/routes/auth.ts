import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { signToken } from '../middleware/auth'

const prisma = new PrismaClient()
export const authRouter = Router()

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ data: null, error: 'Email and password required' })
    return
  }

  const expectedEmail = process.env.CONSULTANT_EMAIL
  const expectedPassword = process.env.CONSULTANT_PASSWORD
  const consultantName = process.env.CONSULTANT_NAME || 'Consultant'

  if (email !== expectedEmail || password !== expectedPassword) {
    res.status(401).json({ data: null, error: 'Invalid credentials' })
    return
  }

  // Ensure consultant exists in DB (upsert on first login)
  let consultant = await prisma.consultant.findUnique({ where: { email } })
  if (!consultant) {
    consultant = await prisma.consultant.create({
      data: {
        email,
        name: consultantName,
        passwordHash: 'env-auth', // placeholder — auth via env vars
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
})
