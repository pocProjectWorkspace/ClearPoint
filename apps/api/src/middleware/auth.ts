import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export type AuthPayload = {
  consultantId: string
  email: string
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ data: null, error: 'Unauthorized' })
    return
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload
    req.auth = payload
    next()
  } catch {
    res.status(401).json({ data: null, error: 'Unauthorized' })
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' })
}
