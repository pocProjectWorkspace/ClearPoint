import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth'

const prisma = new PrismaClient()
export const annotationsRouter = Router()

annotationsRouter.use(authMiddleware)

// POST /api/engagements/:id/annotations
annotationsRouter.post('/:id/annotations', async (req, res) => {
  const consultantId = req.auth!.consultantId
  const engagementId = req.params.id

  const engagement = await prisma.engagement.findFirst({
    where: { id: engagementId, consultantId },
  })
  if (!engagement) {
    res.status(404).json({ data: null, error: 'Engagement not found' })
    return
  }

  const { type, itemId, text } = req.body
  if (!type || !itemId || !text) {
    res.status(400).json({ data: null, error: 'type, itemId, and text required' })
    return
  }

  const annotation = await prisma.annotation.upsert({
    where: { engagementId_type_itemId: { engagementId, type, itemId } },
    update: { text },
    create: { engagementId, type, itemId, text },
  })

  res.json({ data: annotation })
})

// GET /api/engagements/:id/annotations
annotationsRouter.get('/:id/annotations', async (req, res) => {
  const consultantId = req.auth!.consultantId
  const engagementId = req.params.id

  const engagement = await prisma.engagement.findFirst({
    where: { id: engagementId, consultantId },
  })
  if (!engagement) {
    res.status(404).json({ data: null, error: 'Engagement not found' })
    return
  }

  const annotations = await prisma.annotation.findMany({
    where: { engagementId },
    orderBy: { createdAt: 'asc' },
  })

  res.json({ data: { items: annotations, total: annotations.length } })
})

// DELETE /api/engagements/:id/annotations/:annotationId
annotationsRouter.delete('/:id/annotations/:annotationId', async (req, res) => {
  const consultantId = req.auth!.consultantId
  const engagementId = req.params.id

  const engagement = await prisma.engagement.findFirst({
    where: { id: engagementId, consultantId },
  })
  if (!engagement) {
    res.status(404).json({ data: null, error: 'Engagement not found' })
    return
  }

  try {
    await prisma.annotation.delete({ where: { id: req.params.annotationId } })
    res.json({ data: { deleted: true } })
  } catch {
    res.status(404).json({ data: null, error: 'Annotation not found' })
  }
})
