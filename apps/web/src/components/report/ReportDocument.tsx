import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type {
  DiagnosticResult,
  DomainScore,
  RootCause,
  RoadmapItem,
  ReasoningEntry,
} from '@mindssparc/shared-types'

// ── Fonts ─────────────────────────────────────────────────────────
// Using standard PDF fonts for reliability (no external font loading)

// ── Colors ────────────────────────────────────────────────────────
const C = {
  navy900: '#0f172a',
  navy800: '#1e293b',
  navy700: '#334155',
  navy600: '#475569',
  navy500: '#64748b',
  navy400: '#94a3b8',
  navy200: '#e2e8f0',
  navy100: '#f1f5f9',
  navy50: '#f8fafc',
  accent: '#0891b2',
  red: '#dc2626',
  amber: '#d97706',
  yellow: '#ca8a04',
  blue: '#2563eb',
  green: '#059669',
  white: '#ffffff',
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: C.red,
  high: C.amber,
  medium: C.blue,
  low: C.navy400,
}

const MATURITY_COLORS: Record<string, string> = {
  nascent: C.red,
  developing: C.amber,
  established: C.yellow,
  advanced: C.blue,
  leading: C.green,
}

const MATURITY_LABELS: Record<string, string> = {
  nascent: 'Foundational',
  developing: 'Emerging',
  established: 'Developing',
  advanced: 'Advanced',
  leading: 'Leading',
}

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

const INTERVENTION_LABELS: Record<string, string> = {
  PROCESS: 'Process',
  DIGITIZE: 'Digitize',
  INTEGRATE: 'Integrate',
  AUTOMATE: 'Automate',
  ANALYTICS: 'Analytics',
  AI: 'AI',
}

// ── Styles ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.navy800,
    backgroundColor: C.white,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: C.navy200,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: C.navy400,
    fontFamily: 'Helvetica',
  },
  // Cover page
  coverPage: {
    paddingTop: 180,
    paddingBottom: 60,
    paddingHorizontal: 60,
    backgroundColor: C.navy900,
    justifyContent: 'space-between',
    height: '100%',
  },
  coverTitle: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    marginBottom: 12,
  },
  coverSubtitle: {
    fontSize: 14,
    color: C.navy400,
    marginBottom: 40,
  },
  coverMeta: {
    fontSize: 10,
    color: C.navy500,
    marginBottom: 4,
  },
  coverBrand: {
    fontSize: 10,
    color: C.navy400,
    marginTop: 'auto',
  },
  // Section headings
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: C.navy900,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 9,
    color: C.navy500,
    marginBottom: 20,
  },
  h3: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: C.navy800,
    marginBottom: 8,
    marginTop: 16,
  },
  // Content
  body: {
    fontSize: 9,
    lineHeight: 1.5,
    color: C.navy700,
  },
  label: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.navy500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  value: {
    fontSize: 9,
    color: C.navy800,
    marginBottom: 8,
  },
  // Tables
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.navy200,
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.navy500,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: C.navy100,
    paddingVertical: 5,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 9,
    color: C.navy700,
  },
  tableCellBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.navy800,
  },
  // Cards
  card: {
    backgroundColor: C.navy50,
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
  },
  rootCauseCard: {
    borderLeftWidth: 3,
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
    backgroundColor: C.navy50,
  },
  // Score bar
  scoreBarBg: {
    height: 8,
    backgroundColor: C.navy100,
    borderRadius: 4,
    marginTop: 3,
    marginBottom: 2,
  },
  scoreBarFill: {
    height: 8,
    borderRadius: 4,
  },
  // Roadmap
  phaseHeader: {
    backgroundColor: C.navy800,
    borderRadius: 4,
    padding: 10,
    marginBottom: 6,
    marginTop: 12,
  },
  phaseHeaderText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
  },
  // Business case
  bigNumber: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: C.navy900,
  },
  tierCard: {
    borderLeftWidth: 3,
    borderRadius: 4,
    padding: 12,
    marginBottom: 6,
    backgroundColor: C.navy50,
  },
  totalsBar: {
    backgroundColor: C.navy800,
    borderRadius: 4,
    padding: 16,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Divider
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: C.navy200,
    marginVertical: 16,
  },
  // Two column
  twoCol: {
    flexDirection: 'row',
    gap: 20,
  },
  col: {
    flex: 1,
  },
  // Badge
  badge: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
})

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

// ── Page Footer ───────────────────────────────────────────────────
function PageFooter({ clientName }: { clientName: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>ClearPoint Assessment Report</Text>
      <Text style={s.footerText}>{clientName}</Text>
      <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  )
}

// ── Cover Page ────────────────────────────────────────────────────
function CoverPage({ engagement }: { engagement: any }) {
  return (
    <Page size="A4" style={{ ...s.page, padding: 0 }}>
      <View style={s.coverPage}>
        <View>
          <Text style={s.coverTitle}>ClearPoint</Text>
          <Text style={s.coverSubtitle}>AI Readiness Assessment Report</Text>
          <View style={s.divider} />
          <Text style={{ ...s.coverMeta, color: C.white, fontSize: 16, marginBottom: 8 }}>
            {engagement.clientName}
          </Text>
          <Text style={s.coverMeta}>{engagement.name}</Text>
          <Text style={s.coverMeta}>
            {engagement.industry} | {engagement.companySize} | {engagement.geography || 'Global'}
          </Text>
          <Text style={{ ...s.coverMeta, marginTop: 12 }}>
            Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <Text style={s.coverBrand}>powered by mindssparc</Text>
      </View>
    </Page>
  )
}

// ── Configuration Page ────────────────────────────────────────────
function ConfigPage({ engagement }: { engagement: any }) {
  const weights = engagement.interventionWeights || {}
  const targets = engagement.ambitionTargets || {}
  const domains = engagement.domainsInScope || []

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>Engagement configuration</Text>
      <Text style={s.sectionSubtitle}>Pre-session setup — confirmed by consultant and client</Text>

      <View style={s.twoCol}>
        <View style={s.col}>
          <Text style={s.h3}>Client details</Text>
          <Text style={s.label}>Client</Text>
          <Text style={s.value}>{engagement.clientName}</Text>
          <Text style={s.label}>Industry</Text>
          <Text style={s.value}>{engagement.industry}</Text>
          <Text style={s.label}>Company size</Text>
          <Text style={s.value}>{engagement.companySize}</Text>
          <Text style={s.label}>Revenue range</Text>
          <Text style={s.value}>{engagement.revenueRange}</Text>
          <Text style={s.label}>Geography</Text>
          <Text style={s.value}>{engagement.geography || '—'}</Text>

          <Text style={s.h3}>Strategic priorities</Text>
          <Text style={s.body}>{engagement.strategicPriorities || 'Not specified'}</Text>

          <Text style={s.h3}>Consultant hypothesis</Text>
          <Text style={s.body}>{engagement.consultantHypothesis || 'Not specified'}</Text>
        </View>

        <View style={s.col}>
          <Text style={s.h3}>Domains in scope</Text>
          {domains.map((d: string) => (
            <Text key={d} style={s.value}>{DOMAIN_NAMES[d] || d}</Text>
          ))}

          <Text style={s.h3}>Intervention weights</Text>
          {Object.entries(weights).map(([key, val]) => (
            <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={s.body}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
              <Text style={s.tableCellBold}>{String(val)}%</Text>
            </View>
          ))}

          <Text style={s.h3}>Ambition targets (12-month)</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={s.body}>Cost reduction</Text>
            <Text style={s.tableCellBold}>{targets.costReductionPct || 0}%</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={s.body}>Productivity gain</Text>
            <Text style={s.tableCellBold}>{targets.productivityGainPct || 0}%</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={s.body}>Revenue impact</Text>
            <Text style={s.tableCellBold}>{targets.revenueImpactPct || 0}%</Text>
          </View>

          <Text style={s.h3}>Confidence level</Text>
          <Text style={s.value}>{engagement.confidenceLevel || 'medium'}</Text>
        </View>
      </View>

      <PageFooter clientName={engagement.clientName} />
    </Page>
  )
}

// ── Domain Scores Page ────────────────────────────────────────────
function DomainScoresPage({
  domainScores,
  clientName,
}: {
  domainScores: DomainScore[]
  clientName: string
}) {
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>Domain scores</Text>
      <Text style={s.sectionSubtitle}>Maturity assessment across selected domains</Text>

      {domainScores.map((ds) => {
        const color = MATURITY_COLORS[ds.maturityBand] || C.navy400
        const label = MATURITY_LABELS[ds.maturityBand] || ds.maturityBand
        return (
          <View key={ds.domain} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.tableCellBold}>{DOMAIN_NAMES[ds.domain] || ds.domain}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ ...s.badge, backgroundColor: color, color: C.white }}>
                  {label}
                </Text>
                <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.navy800 }}>
                  {Math.round(ds.percentage)}/100
                </Text>
              </View>
            </View>
            <View style={s.scoreBarBg}>
              <View
                style={{
                  ...s.scoreBarFill,
                  width: `${Math.max(ds.percentage, 2)}%`,
                  backgroundColor: color,
                }}
              />
            </View>
            <Text style={{ fontSize: 7, color: C.navy400, marginTop: 2 }}>
              {ds.questionCount} questions assessed
            </Text>
          </View>
        )
      })}

      <PageFooter clientName={clientName} />
    </Page>
  )
}

// ── Root Causes Page ──────────────────────────────────────────────
function RootCausesPage({
  rootCauses,
  reasoningLog,
  clientName,
}: {
  rootCauses: RootCause[]
  reasoningLog: ReasoningEntry[]
  clientName: string
}) {
  const reasoningMap = new Map(reasoningLog.filter(r => r.outputType === 'rootCause').map(r => [r.outputId, r]))

  return (
    <Page size="A4" style={s.page} wrap>
      <Text style={s.sectionTitle}>Diagnosis</Text>
      <Text style={s.sectionSubtitle}>
        {rootCauses.length} root cause{rootCauses.length !== 1 ? 's' : ''} identified from assessment data
      </Text>

      {rootCauses.length === 0 ? (
        <Text style={s.body}>No significant root causes were identified. All assessed domains appear healthy.</Text>
      ) : (
        rootCauses.map((rc, i) => {
          const color = SEVERITY_COLORS[rc.severity] || C.navy400
          const reasoning = reasoningMap.get(rc.id)
          return (
            <View
              key={rc.id}
              style={{ ...s.rootCauseCard, borderLeftColor: color }}
              wrap={false}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.navy900 }}>
                  {i + 1}. {rc.name}
                </Text>
                <Text style={{ ...s.badge, backgroundColor: color, color: C.white }}>
                  {rc.severity}
                </Text>
              </View>
              <Text style={{ ...s.body, marginBottom: 6 }}>{rc.description}</Text>
              {reasoning && (
                <Text style={{ ...s.body, fontStyle: 'italic', color: C.navy600 }}>
                  {reasoning.explanation}
                </Text>
              )}
              <Text style={{ fontSize: 7, color: C.navy400, marginTop: 6 }}>
                Evidence: {rc.evidenceQuestionIds.length} questions | Domain: {DOMAIN_NAMES[rc.domain] || rc.domain} | Pattern: {rc.evidencePattern}
              </Text>
            </View>
          )
        })
      )}

      <PageFooter clientName={clientName} />
    </Page>
  )
}

// ── Roadmap Page ──────────────────────────────────────────────────
function RoadmapPage({
  roadmap,
  clientName,
}: {
  roadmap: RoadmapItem[]
  clientName: string
}) {
  const phases: Array<{ days: 30 | 60 | 90; label: string }> = [
    { days: 30, label: '30 Days — Quick Wins' },
    { days: 60, label: '60 Days — Build Capability' },
    { days: 90, label: '90 Days — Scale & Sustain' },
  ]

  return (
    <Page size="A4" style={s.page} wrap>
      <Text style={s.sectionTitle}>Roadmap</Text>
      <Text style={s.sectionSubtitle}>Sequenced actions across 30, 60, and 90 days</Text>

      {roadmap.length === 0 ? (
        <Text style={s.body}>No roadmap actions generated. This typically means no diagnostic patterns were triggered.</Text>
      ) : (
        phases.map(({ days, label }) => {
          const items = roadmap.filter(r => r.phase === days)
          return (
            <View key={days}>
              <View style={s.phaseHeader}>
                <Text style={s.phaseHeaderText}>{label}</Text>
                <Text style={{ fontSize: 8, color: C.navy400 }}>{items.length} action{items.length !== 1 ? 's' : ''}</Text>
              </View>
              {items.length === 0 ? (
                <Text style={{ ...s.body, fontStyle: 'italic', marginBottom: 8 }}>No actions in this phase.</Text>
              ) : (
                items.map((item) => (
                  <View key={item.id} style={s.card} wrap={false}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={s.tableCellBold}>{item.title}</Text>
                      <Text style={{ ...s.badge, backgroundColor: C.navy200, color: C.navy700 }}>
                        {INTERVENTION_LABELS[item.interventionType] || item.interventionType}
                      </Text>
                    </View>
                    <Text style={s.body}>{item.description}</Text>
                    <View style={{ flexDirection: 'row', gap: 16, marginTop: 6 }}>
                      <Text style={{ fontSize: 7, color: C.navy400 }}>Effort: {item.estimatedEffort}</Text>
                    </View>
                    <Text style={{ fontSize: 8, color: C.green, marginTop: 4 }}>
                      Expected outcome: {item.expectedOutcome}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )
        })
      )}

      <PageFooter clientName={clientName} />
    </Page>
  )
}

// ── Business Case Page ────────────────────────────────────────────
function BusinessCasePage({
  businessCase,
  clientName,
}: {
  businessCase: any
  clientName: string
}) {
  const bc = businessCase
  const tiers = [
    { label: 'Tier 0-1: Process & Digitise', value: bc.tier01Value, color: C.navy600, desc: 'Fixing broken workflows and capturing invisible data' },
    { label: 'Tier 2: Automate & Integrate', value: bc.tier2Value, color: C.blue, desc: 'Connecting systems and removing manual bottlenecks' },
    { label: 'Tier 3-4: Analytics & AI', value: bc.tier3Value, color: C.amber, desc: 'Surfacing insights and applying machine learning' },
  ]

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>Business case</Text>
      <Text style={s.sectionSubtitle}>Value stack by intervention tier</Text>

      {/* Problem cost + total value */}
      <View style={{ ...s.card, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <View>
          <Text style={s.label}>Total problem cost</Text>
          <Text style={s.bigNumber}>{formatCurrency(bc.problemCost)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.label}>Total addressable value</Text>
          <Text style={s.bigNumber}>{formatCurrency(bc.totalValue)}</Text>
        </View>
      </View>

      {/* Tier breakdown */}
      {tiers.map((tier) => (
        <View key={tier.label} style={{ ...s.tierCard, borderLeftColor: tier.color }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={s.tableCellBold}>{tier.label}</Text>
              <Text style={{ fontSize: 8, color: C.navy500, marginTop: 2 }}>{tier.desc}</Text>
            </View>
            <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.navy900 }}>
              {formatCurrency(tier.value)}
            </Text>
          </View>
        </View>
      ))}

      {/* Totals */}
      <View style={s.totalsBar}>
        <View>
          <Text style={{ fontSize: 8, color: C.navy400 }}>Conservative (12-month)</Text>
          <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.white, marginTop: 4 }}>
            {formatCurrency(bc.conservative12Month)}
          </Text>
          <Text style={{ fontSize: 7, color: C.navy400, marginTop: 2 }}>x0.65 of total value</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 8, color: C.navy400 }}>Realistic (24-month)</Text>
          <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.white, marginTop: 4 }}>
            {formatCurrency(bc.realistic24Month)}
          </Text>
          <Text style={{ fontSize: 7, color: C.navy400, marginTop: 2 }}>x1.30 of total value</Text>
        </View>
      </View>

      <PageFooter clientName={clientName} />
    </Page>
  )
}

// ── Main Document ─────────────────────────────────────────────────
type ReportProps = {
  engagement: any
  result: DiagnosticResult
}

export default function ReportDocument({ engagement, result }: ReportProps) {
  return (
    <Document
      title={`ClearPoint Report — ${engagement.clientName}`}
      author="mindssparc"
      subject="AI Readiness Assessment"
    >
      <CoverPage engagement={engagement} />
      <ConfigPage engagement={engagement} />
      <DomainScoresPage domainScores={result.domainScores} clientName={engagement.clientName} />
      <RootCausesPage
        rootCauses={result.rootCauses}
        reasoningLog={result.reasoningLog}
        clientName={engagement.clientName}
      />
      <RoadmapPage roadmap={result.roadmap} clientName={engagement.clientName} />
      <BusinessCasePage businessCase={result.businessCase} clientName={engagement.clientName} />
    </Document>
  )
}
