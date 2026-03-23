import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as d3 from 'd3'
import { api } from '../../lib/api'
import { DOMAINS, INTERVENTION_TYPES } from '../../lib/constants'
import { useUIStore } from '../../store/uiStore'
import type { DiagnosticResult, InterventionMapEntry, Domain } from '@mindssparc/shared-types'

// ── Domain name lookup ────────────────────────────────────────────

const DOMAIN_NAMES: Record<string, string> = {
  CRV: 'Customer & Revenue',
  MKT: 'Marketing & Demand',
  SVC: 'Service & Retention',
  OPS: 'Operations & Fulfillment',
  PPL: 'People & Organisation',
  FIN: 'Finance & Risk',
  TEC: 'Technology & Data',
  PRD: 'Product & Innovation',
}

// ── Tab bar ───────────────────────────────────────────────────────

const TABS = [
  { label: 'Diagnosis', path: 'diagnosis' },
  { label: 'Intervention Map', path: 'intervention-map' },
  { label: 'Roadmap', path: 'roadmap' },
  { label: 'Business Case', path: 'business-case' },
  { label: 'Reasoning', path: 'reasoning' },
]

function TabBar({ engagementId, activeTab }: { engagementId: string; activeTab: string }) {
  return (
    <nav className="mb-8 flex gap-6 border-b border-navy-100">
      {TABS.map(tab => (
        <Link
          key={tab.path}
          to={`/output/${engagementId}/${tab.path}`}
          className={`pb-3 font-body text-body-sm transition-colors ${
            activeTab === tab.path
              ? 'border-b-2 border-navy-800 font-medium text-navy-900'
              : 'text-navy-400 hover:text-navy-600'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}

// ── Maturity band helper ──────────────────────────────────────────

function maturityBand(score: number): string {
  if (score < 20) return 'Nascent'
  if (score < 40) return 'Developing'
  if (score < 60) return 'Established'
  if (score < 80) return 'Advanced'
  return 'Leading'
}

// ── Selected cell type ────────────────────────────────────────────

type SelectedCell = {
  domain: string
  interventionType: string
  score: number
  questionCount: number
}

// ── Loading skeleton ──────────────────────────────────────────────

function LoadingSkeleton() {
  const leftMargin = 140
  const topMargin = 40
  const cellWidth = 70
  const cellHeight = 50
  const cellPadding = 2
  const cols = INTERVENTION_TYPES.length
  const rows = 6

  return (
    <div className="min-h-screen bg-warm-50">
      <div className="mx-auto max-w-content px-6 py-12">
        <div className="h-10 w-56 bg-navy-100 rounded animate-pulse mb-8" />
        <div className="flex gap-6 border-b border-navy-100 mb-8">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-6 w-24 bg-navy-50 rounded animate-pulse mb-3" />
          ))}
        </div>
        <svg
          width={leftMargin + cols * (cellWidth + cellPadding)}
          height={topMargin + rows * (cellHeight + cellPadding)}
        >
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((_, c) => (
              <rect
                key={`${r}-${c}`}
                x={leftMargin + c * (cellWidth + cellPadding)}
                y={topMargin + r * (cellHeight + cellPadding)}
                width={cellWidth}
                height={cellHeight}
                rx={4}
                fill="#F3F4F6"
                className="animate-pulse"
              />
            ))
          )}
        </svg>
      </div>
    </div>
  )
}

// ── Error state ───────────────────────────────────────────────────

function ErrorState({ message, engagementId }: { message: string; engagementId: string }) {
  const [running, setRunning] = useState(false)

  const handleGenerate = async () => {
    setRunning(true)
    try {
      await api.runDiagnostic(engagementId)
      window.location.reload()
    } catch {
      setRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <div className="mx-auto max-w-content px-6 py-12">
        <h1 className="font-display text-display-lg text-navy-900">Intervention map</h1>
        <div className="mt-8 rounded-lg border border-navy-100 bg-white p-8 text-center">
          <p className="font-body text-body-md text-navy-600 mb-4">
            {message.toLowerCase().includes('not found') || message.toLowerCase().includes('404')
              ? 'Diagnostic results have not been generated yet for this engagement.'
              : message}
          </p>
          <button
            onClick={handleGenerate}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg bg-navy-800 px-6 py-3 font-body text-body-sm font-medium text-warm-50 hover:bg-navy-700 transition-colors disabled:opacity-50"
          >
            {running ? 'Generating...' : 'Generate diagnostic'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Drawer panel ──────────────────────────────────────────────────

function CellDrawer({
  cell,
  onClose,
}: {
  cell: SelectedCell
  onClose: () => void
}) {
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[360px] bg-white shadow-xl border-l border-navy-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4">
        <div>
          <h3 className="font-display text-[16px] text-navy-900">
            {DOMAIN_NAMES[cell.domain] ?? cell.domain}
          </h3>
          <p className="font-body text-body-xs text-navy-500 mt-0.5">
            {cell.interventionType}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-navy-400 hover:bg-navy-50 hover:text-navy-700 transition-colors"
          aria-label="Close drawer"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Score */}
        <div className="mb-6">
          <p className="font-body text-body-xs text-navy-500 mb-1">Score</p>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[36px] text-navy-900 leading-none">
              {cell.score.toFixed(1)}
            </span>
            <span className="font-body text-body-sm text-navy-500">
              / 100
            </span>
          </div>
          <span
            className={`mt-2 inline-block rounded-full px-3 py-1 font-body text-body-xs font-medium ${
              cell.score < 20
                ? 'bg-red-50 text-red-700'
                : cell.score < 40
                ? 'bg-orange-50 text-orange-700'
                : cell.score < 60
                ? 'bg-amber-50 text-amber-700'
                : cell.score < 80
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-green-50 text-green-700'
            }`}
          >
            {maturityBand(cell.score)}
          </span>
        </div>

        {/* Question count */}
        <div className="rounded-lg border border-navy-100 bg-navy-50/50 p-4">
          <p className="font-body text-body-sm text-navy-700 font-medium mb-1">
            Questions contributing to this cell
          </p>
          <p className="font-body text-body-xs text-navy-500">
            {cell.questionCount > 0
              ? `${cell.questionCount} question${cell.questionCount !== 1 ? 's' : ''} contributed to this score.`
              : 'No questions directly mapped to this intervention type for this domain.'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────

export default function InterventionMap() {
  const { engagementId } = useParams()
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null)

  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const mode = useUIStore(s => s.mode)

  useEffect(() => {
    api
      .getDiagnosticResult(engagementId!)
      .then(res => setResult(res.data as DiagnosticResult))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [engagementId])

  // ── Build lookup data ───────────────────────────────────────────
  const scoreMap: Record<string, Record<string, { score: number; questionCount: number }>> = {}
  if (result) {
    result.interventionMap.forEach((entry: InterventionMapEntry & { questionCount?: number }) => {
      if (!scoreMap[entry.domain]) scoreMap[entry.domain] = {}
      scoreMap[entry.domain][entry.interventionType] = {
        score: entry.score,
        questionCount: (entry as any).questionCount ?? 0,
      }
    })
  }

  const domainsInMap = DOMAINS.filter(d => scoreMap[d.code])
  const interventionTypes = INTERVENTION_TYPES

  // ── D3 rendering ────────────────────────────────────────────────

  const renderHeatMap = useCallback(() => {
    if (!svgRef.current || domainsInMap.length === 0) return

    const leftMargin = 140
    const topMargin = 40
    const cellWidth = 70
    const cellHeight = 50
    const cellPadding = 2

    const cols = interventionTypes.length
    const rows = domainsInMap.length
    const svgWidth = leftMargin + cols * (cellWidth + cellPadding) + 20
    const svgHeight = topMargin + (rows + 1) * (cellHeight + cellPadding) + 60 // +1 for average row, +60 for legend

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', svgWidth).attr('height', svgHeight)

    const colorScale = d3.scaleLinear<string>()
      .domain([0, 20, 40, 60, 80, 100])
      .range(['#F3F4F6', '#FEE2E2', '#FEF3C7', '#DBEAFE', '#D1FAE5', '#065F46'])

    // ── X axis labels ───────────────────────────────────────────
    interventionTypes.forEach((it, i) => {
      svg
        .append('text')
        .attr('x', leftMargin + i * (cellWidth + cellPadding) + cellWidth / 2)
        .attr('y', topMargin - 12)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('fill', '#6B7280')
        .attr('font-family', 'inherit')
        .text(it.code)
    })

    // ── Y axis labels ───────────────────────────────────────────
    domainsInMap.forEach((domain, i) => {
      svg
        .append('text')
        .attr('x', leftMargin - 12)
        .attr('y', topMargin + i * (cellHeight + cellPadding) + cellHeight / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#374151')
        .attr('font-family', 'inherit')
        .text(DOMAIN_NAMES[domain.code] ?? domain.code)
    })

    // ── Data cells ──────────────────────────────────────────────
    domainsInMap.forEach((domain, rowIdx) => {
      interventionTypes.forEach((it, colIdx) => {
        const entry = scoreMap[domain.code]?.[it.code]
        const score = entry?.score ?? 0
        const questionCount = entry?.questionCount ?? 0

        const x = leftMargin + colIdx * (cellWidth + cellPadding)
        const y = topMargin + rowIdx * (cellHeight + cellPadding)

        const g = svg.append('g').attr('class', 'heat-cell').style('cursor', 'pointer')

        // Cell rectangle
        g.append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', cellWidth)
          .attr('height', cellHeight)
          .attr('rx', 4)
          .attr('fill', colorScale(score))
          .attr('stroke', '#E5E7EB')
          .attr('stroke-width', 1)
          .style('opacity', 0)
          .transition()
          .delay(colIdx * 30)
          .duration(300)
          .style('opacity', 1)

        // Score text (hidden in client mode)
        if (mode === 'consultant') {
          const textColor = score < 60 ? '#0F1B2D' : score >= 80 ? '#FFFFFF' : '#0F1B2D'
          g.append('text')
            .attr('x', x + cellWidth / 2)
            .attr('y', y + cellHeight / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '12px')
            .attr('fill', textColor)
            .attr('font-family', 'inherit')
            .text(score.toFixed(1))
            .style('opacity', 0)
            .transition()
            .delay(colIdx * 30 + 150)
            .duration(200)
            .style('opacity', 1)
        }

        // Click handler
        g.on('click', () => {
          setSelectedCell({
            domain: domain.code,
            interventionType: it.code,
            score,
            questionCount,
          })
        })

        // Hover effect
        g.on('mouseenter', function () {
          d3.select(this).select('rect').attr('stroke', '#374151').attr('stroke-width', 2)
        }).on('mouseleave', function () {
          d3.select(this).select('rect').attr('stroke', '#E5E7EB').attr('stroke-width', 1)
        })
      })
    })

    // ── Summary row (averages) ──────────────────────────────────
    const avgY = topMargin + domainsInMap.length * (cellHeight + cellPadding) + 8

    // Label
    svg
      .append('text')
      .attr('x', leftMargin - 12)
      .attr('y', avgY + cellHeight / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#374151')
      .attr('font-style', 'italic')
      .attr('font-family', 'inherit')
      .text('Average')

    interventionTypes.forEach((it, colIdx) => {
      // Compute column average
      let sum = 0
      let count = 0
      domainsInMap.forEach(domain => {
        const entry = scoreMap[domain.code]?.[it.code]
        if (entry) {
          sum += entry.score
          count++
        }
      })
      const avg = count > 0 ? sum / count : 0

      const x = leftMargin + colIdx * (cellWidth + cellPadding)

      // Background rect
      svg
        .append('rect')
        .attr('x', x)
        .attr('y', avgY)
        .attr('width', cellWidth)
        .attr('height', cellHeight)
        .attr('rx', 4)
        .attr('fill', '#F9FAFB')
        .attr('stroke', '#E5E7EB')
        .attr('stroke-width', 1)
        .style('opacity', 0)
        .transition()
        .delay(colIdx * 30 + 200)
        .duration(300)
        .style('opacity', 1)

      // Average text
      if (mode === 'consultant') {
        svg
          .append('text')
          .attr('x', x + cellWidth / 2)
          .attr('y', avgY + cellHeight / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', '12px')
          .attr('fill', '#374151')
          .attr('font-style', 'italic')
          .attr('font-family', 'inherit')
          .text(avg.toFixed(1))
          .style('opacity', 0)
          .transition()
          .delay(colIdx * 30 + 350)
          .duration(200)
          .style('opacity', 1)
      }
    })

    // ── Legend ───────────────────────────────────────────────────
    const legendY = avgY + cellHeight + 24
    const legendWidth = 200
    const legendHeight = 12
    const legendX = leftMargin

    // Gradient definition
    const defs = svg.append('defs')
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'heatmap-legend-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%')

    const stops = [
      { offset: '0%', color: '#F3F4F6' },
      { offset: '20%', color: '#FEE2E2' },
      { offset: '40%', color: '#FEF3C7' },
      { offset: '60%', color: '#DBEAFE' },
      { offset: '80%', color: '#D1FAE5' },
      { offset: '100%', color: '#065F46' },
    ]
    stops.forEach(s => {
      gradient.append('stop').attr('offset', s.offset).attr('stop-color', s.color)
    })

    svg
      .append('rect')
      .attr('x', legendX)
      .attr('y', legendY)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('rx', 3)
      .attr('fill', 'url(#heatmap-legend-gradient)')
      .attr('stroke', '#E5E7EB')
      .attr('stroke-width', 0.5)

    svg
      .append('text')
      .attr('x', legendX)
      .attr('y', legendY + legendHeight + 14)
      .attr('font-size', '11px')
      .attr('fill', '#6B7280')
      .attr('font-family', 'inherit')
      .text('0 — No data')

    svg
      .append('text')
      .attr('x', legendX + legendWidth)
      .attr('y', legendY + legendHeight + 14)
      .attr('text-anchor', 'end')
      .attr('font-size', '11px')
      .attr('fill', '#6B7280')
      .attr('font-family', 'inherit')
      .text('100 — Leading')
  }, [domainsInMap, interventionTypes, scoreMap, mode])

  // ── Effect: render and observe resize ───────────────────────────

  useEffect(() => {
    renderHeatMap()

    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      renderHeatMap()
    })
    observer.observe(container)

    return () => observer.disconnect()
  }, [renderHeatMap])

  // ── Render ──────────────────────────────────────────────────────

  if (loading) return <LoadingSkeleton />
  if (error || !result) return <ErrorState message={error || 'No data'} engagementId={engagementId!} />

  return (
    <div className="min-h-screen bg-warm-50">
      <div className="mx-auto max-w-content px-6 py-12">
        <h1 className="font-display text-display-lg text-navy-900 mb-2">Intervention map</h1>
        <p className="font-body text-body-sm text-navy-400 mb-8">
          Domain x intervention type score matrix
        </p>

        <TabBar engagementId={engagementId!} activeTab="intervention-map" />

        {domainsInMap.length === 0 ? (
          <div className="rounded-lg border border-navy-100 bg-white p-8 text-center">
            <p className="font-body text-body-sm text-navy-400 italic">
              Select domains in setup to see the intervention map
            </p>
          </div>
        ) : (
          <div ref={containerRef} className="overflow-x-auto rounded-lg border border-navy-100 bg-white p-6">
            <svg ref={svgRef} />
          </div>
        )}
      </div>

      {/* Cell detail drawer */}
      {selectedCell && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-navy-900/20"
            onClick={() => setSelectedCell(null)}
          />
          <CellDrawer cell={selectedCell} onClose={() => setSelectedCell(null)} />
        </>
      )}
    </div>
  )
}
