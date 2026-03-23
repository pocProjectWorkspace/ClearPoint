import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth'
import { loadQuestions } from '@mindssparc/question-bank'
import type { Domain } from '@mindssparc/shared-types'

const prisma = new PrismaClient()
export const engagementsRouter = Router()

engagementsRouter.use(authMiddleware)

// Helpers to serialize/deserialize JSON fields
function serializeEngagement(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data }
  if (data.domainsInScope !== undefined) {
    result.domainsInScope = JSON.stringify(data.domainsInScope)
  }
  if (data.interventionWeights !== undefined) {
    result.interventionWeights = JSON.stringify(data.interventionWeights)
  }
  if (data.ambitionTargets !== undefined) {
    result.ambitionTargets = JSON.stringify(data.ambitionTargets)
  }
  return result
}

function deserializeEngagement(row: Record<string, unknown>): Record<string, unknown> {
  const result = { ...row }
  try { result.domainsInScope = JSON.parse(row.domainsInScope as string) } catch { result.domainsInScope = [] }
  try { result.interventionWeights = JSON.parse(row.interventionWeights as string) } catch { result.interventionWeights = {} }
  try { result.ambitionTargets = JSON.parse(row.ambitionTargets as string) } catch { result.ambitionTargets = {} }
  return result
}

// POST /api/engagements
engagementsRouter.post('/', async (req, res) => {
  const consultantId = req.auth!.consultantId

  // Validate interventionWeights sum if provided
  if (req.body.interventionWeights) {
    const w = req.body.interventionWeights
    const sum = (w.process || 0) + (w.automation || 0) + (w.analytics || 0) + (w.ai || 0)
    if (sum !== 100) {
      res.status(400).json({ data: null, error: 'Intervention weights must sum to 100' })
      return
    }
  }

  // Validate domainsInScope if provided
  if (req.body.domainsInScope) {
    const domains = req.body.domainsInScope
    if (!Array.isArray(domains) || domains.length < 2 || domains.length > 8) {
      res.status(400).json({ data: null, error: 'Must select between 2 and 8 domains' })
      return
    }
  }

  const { domainsInScope, interventionWeights, ambitionTargets } = req.body
  const serialized = serializeEngagement({ domainsInScope, interventionWeights, ambitionTargets })

  // Pick only known fields — never spread raw body into Prisma
  const fields: Record<string, unknown> = { consultantId }
  const allowed = ['name', 'clientName', 'industry', 'companySize', 'revenueRange', 'geography', 'strategicPriorities', 'consultantHypothesis', 'confidenceLevel', 'status']
  for (const key of allowed) {
    if (req.body[key] !== undefined) fields[key] = req.body[key]
  }
  Object.assign(fields, serialized)

  try {
    const engagement = await prisma.engagement.create({ data: fields as any })
    res.status(201).json({ data: deserializeEngagement(engagement as unknown as Record<string, unknown>) })
  } catch (e) {
    console.error('Engagement create error:', (e as Error).message)
    res.status(500).json({ data: null, error: 'Failed to create engagement' })
  }
})

// GET /api/engagements
engagementsRouter.get('/', async (req, res) => {
  const consultantId = req.auth!.consultantId

  const engagements = await prisma.engagement.findMany({
    where: { consultantId },
    orderBy: { updatedAt: 'desc' },
  })

  const items = engagements.map((e) => deserializeEngagement(e as unknown as Record<string, unknown>))

  res.json({ data: { items, total: items.length } })
})

// GET /api/engagements/:id
engagementsRouter.get('/:id', async (req, res) => {
  const consultantId = req.auth!.consultantId
  const engagement = await prisma.engagement.findFirst({
    where: { id: req.params.id, consultantId },
  })

  if (!engagement) {
    res.status(404).json({ data: null, error: 'Engagement not found' })
    return
  }

  const parsed = deserializeEngagement(engagement as unknown as Record<string, unknown>)

  // Compute question count from question bank
  const domains = parsed.domainsInScope as Domain[]
  const allQuestions = loadQuestions()
  const questionCount = allQuestions.filter((q) => domains.includes(q.domain)).length

  res.json({ data: { ...parsed, questionCount } })
})

// PUT /api/engagements/:id
engagementsRouter.put('/:id', async (req, res) => {
  const consultantId = req.auth!.consultantId

  // Check ownership
  const existing = await prisma.engagement.findFirst({
    where: { id: req.params.id, consultantId },
  })
  if (!existing) {
    res.status(404).json({ data: null, error: 'Engagement not found' })
    return
  }

  // Validate interventionWeights sum if provided
  if (req.body.interventionWeights) {
    const w = req.body.interventionWeights
    const sum = (w.process || 0) + (w.automation || 0) + (w.analytics || 0) + (w.ai || 0)
    if (sum !== 100) {
      res.status(400).json({ data: null, error: 'Intervention weights must sum to 100' })
      return
    }
  }

  const { domainsInScope, interventionWeights, ambitionTargets } = req.body
  const serialized = serializeEngagement({ domainsInScope, interventionWeights, ambitionTargets })

  const updateData: Record<string, unknown> = {}
  const allowed = ['name', 'clientName', 'industry', 'companySize', 'revenueRange', 'geography', 'strategicPriorities', 'consultantHypothesis', 'confidenceLevel', 'status']
  for (const key of allowed) {
    if (req.body[key] !== undefined) updateData[key] = req.body[key]
  }
  if (domainsInScope !== undefined) updateData.domainsInScope = serialized.domainsInScope
  if (interventionWeights !== undefined) updateData.interventionWeights = serialized.interventionWeights
  if (ambitionTargets !== undefined) updateData.ambitionTargets = serialized.ambitionTargets

  try {
    const updated = await prisma.engagement.update({
      where: { id: req.params.id },
      data: updateData,
    })
    res.json({ data: deserializeEngagement(updated as unknown as Record<string, unknown>) })
  } catch (e) {
    console.error('Engagement update error:', (e as Error).message)
    res.status(500).json({ data: null, error: 'Failed to update engagement' })
  }
})
