import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth'
import { runDiagnostic } from '../engine'

const prisma = new PrismaClient()
export const diagnosticRouter = Router()

diagnosticRouter.use(authMiddleware)

// POST /api/diagnostic/:engagementId/run
diagnosticRouter.post('/:engagementId/run', async (req, res) => {
  try {
    const forceRerun = req.body?.forceRerun === true
    const result = await runDiagnostic(req.params.engagementId, req.auth!.consultantId, forceRerun)
    res.json({ data: result })
  } catch (e) {
    const msg = (e as Error).message
    console.error(`Diagnostic error for ${req.params.engagementId}:`, msg)
    res.status(400).json({ data: null, error: msg })
  }
})

// GET /api/diagnostic/:engagementId
diagnosticRouter.get('/:engagementId', async (req, res) => {
  const engagement = await prisma.engagement.findFirst({
    where: { id: req.params.engagementId, consultantId: req.auth!.consultantId },
  })
  if (!engagement) {
    res.status(404).json({ data: null, error: 'Engagement not found' })
    return
  }

  const result = await prisma.diagnosticResult.findUnique({
    where: { engagementId: req.params.engagementId },
  })
  if (!result) {
    res.status(404).json({ data: null, error: 'Diagnostic result not yet generated' })
    return
  }

  res.json({
    data: {
      engagementId: result.engagementId,
      domainScores: JSON.parse(result.domainScores),
      patterns: JSON.parse(result.patterns),
      rootCauses: JSON.parse(result.rootCauses),
      interventionMap: JSON.parse(result.interventionMap),
      roadmap: JSON.parse(result.roadmap),
      businessCase: JSON.parse(result.businessCase),
      reasoningLog: JSON.parse(result.reasoningLog),
      generatedAt: result.generatedAt.toISOString(),
    },
  })
})
