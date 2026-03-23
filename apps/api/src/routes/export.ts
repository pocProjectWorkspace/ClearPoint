import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { authMiddleware } from '../middleware/auth'
import { generateReport } from '../services/pdfExport'

const prisma = new PrismaClient()
export const exportRouter = Router()

exportRouter.use(authMiddleware)

// POST /api/export/:engagementId/pdf
exportRouter.post('/:engagementId/pdf', async (req, res) => {
  const consultantId = req.auth!.consultantId
  const engagementId = req.params.engagementId

  const engagement = await prisma.engagement.findFirst({
    where: { id: engagementId, consultantId },
  })
  if (!engagement) {
    res.status(404).json({ data: null, error: 'Engagement not found' })
    return
  }

  // Check diagnostic result exists
  const result = await prisma.diagnosticResult.findUnique({ where: { engagementId } })
  if (!result) {
    res.status(400).json({ data: null, error: 'Diagnostic result not yet generated' })
    return
  }

  // Generate short-lived export token (5 min)
  const exportToken = jwt.sign(
    { engagementId, purpose: 'report-export' },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '5m' }
  )

  try {
    const pdfBuffer = await generateReport(engagementId, exportToken)

    const clientName = engagement.clientName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="clearpoint-report-${clientName}.pdf"`)
    res.send(pdfBuffer)
  } catch (e) {
    console.error(`PDF export failed for ${engagementId}:`, (e as Error).message)
    res.status(500).json({ data: null, error: 'PDF generation failed. Please try again.' })
  }
})
