# CLAUDE.md — mindssparc AI Assessment Portal
> Diagnostic-to-Action Engine for Enterprise AI Readiness Consulting
> Version 1.0 | Built for Claude Code

---

## 1. Project Identity

**Product Name:** mindssparc AI Assessment Portal  
**Type:** Full-stack web application (React + Node/Express + SQLite or Postgres)  
**Purpose:** A consultant-operated diagnostic tool that helps enterprises understand what is going wrong in their operations, what kind of intervention is needed (process fix, automation, or AI), and what the sequenced business case looks like — in 30/60/90-day terms.  
**Owner:** mindssparc (Sutharsan Parthasarathy)  
**Design Ethos:** Refined, editorial, high-trust. This is used in boardrooms and client workshops. Every screen must feel like a premium consulting deliverable, not a SaaS product.

---

## 2. The Problem This Solves

Most AI readiness tools produce a score. This tool produces a **diagnosis with a chain of reasoning**. The core insight is:

> Before recommending AI, you must understand whether the problem is a broken process (Tier 0), missing data (Tier 1), a repetitive manual task (Tier 2), or a genuine judgment-at-scale problem (Tier 3 — where AI belongs).

The tool serves two audiences simultaneously:
- **The Consultant** — who configures the assessment, facilitates the session, and delivers the output
- **The Client** — who answers questions and receives a transparent, evidence-backed diagnosis

Every number, recommendation, and roadmap item must be explainable in one plain-language sentence that traces back to something the client themselves said. Think SHAP values for a business assessment — every output has a visible reasoning chain.

---

## 3. Core Architecture

### 3.1 Technology Stack

```
Frontend:       React 18 + TypeScript + Vite
Styling:        Tailwind CSS v3 (utility-first, no component libraries)
State:          Zustand (global session state) + React Query (server state)
Routing:        React Router v6
Backend:        Node.js + Express + TypeScript
Database:       SQLite (dev) / PostgreSQL (prod) via Prisma ORM
Auth:           JWT — consultant login only (clients do not have accounts)
AI Layer:       Anthropic Claude API (claude-sonnet-4-20250514) for
                diagnostic narrative generation and reasoning summaries
Export:         PDF generation via Puppeteer (server-side rendered report)
Charts:         Recharts (scoring visuals) + D3 (intervention heat map)
```

### 3.2 Monorepo Structure

```
mindssparc-assessment/
├── apps/
│   ├── web/                    # React frontend
│   │   ├── src/
│   │   │   ├── pages/          # Route-level pages
│   │   │   ├── components/     # Shared UI components
│   │   │   ├── features/       # Feature-scoped modules (see §4)
│   │   │   ├── store/          # Zustand stores
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── lib/            # Utilities, formatters, constants
│   │   │   └── types/          # Shared TypeScript types
│   └── api/                    # Express backend
│       ├── src/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── engine/         # Diagnostic engine (core logic)
│       │   └── prisma/
├── packages/
│   ├── shared-types/           # Types shared between web and api
│   ├── question-bank/          # JSON question bank + loader
│   └── diagnostic-rules/      # Pattern matching rules (see §7)
└── CLAUDE.md                   # This file
```

---

## 4. Feature Modules

The application has five major feature modules. Build them in this order — each one is a prerequisite for the next.

### Module 1 — Engagement Setup (`/features/setup`)
Pre-session configuration. Consultant-only. Completed before the client arrives.

**Screens:**
- `EngagementForm` — Engagement name, client name, industry, company size, revenue band, geography, known strategic priorities, hypothesis notes
- `DomainScoping` — From 8 domains, select 4–6 in scope. Shows estimated question count dynamically.
- `WeightConfiguration` — Visual sliders for intervention type priority. Four sliders (Process / Automation / Analytics / AI) that must sum to 100. Client and consultant configure this together.
- `AmbitionCalibration` — Target state in 12 months (cost reduction %, productivity gain %, revenue impact). Sets the business case benchmark.
- `ConfidenceLevel` — Engagement-level confidence setting (High / Medium / Low). Affects all score multipliers.
- `SetupSummary` — Full configuration review. Both consultant and client confirm before proceeding. This page becomes Page 1 of the final report.

**State:** Persisted to DB as `Engagement` record. Every subsequent action is scoped to this engagement ID.

### Module 2 — Assessment Session (`/features/assessment`)
The live question-and-answer session. Consultant facilitates, client answers.

**Screens:**
- `SessionDashboard` — Domain progress overview, live running scores per domain, session timer
- `QuestionCard` — Single question view (see §6 for question schema). Shows:
  - Pre-answer context: *why this question matters, what it diagnoses*
  - 5-point scale with behavioural anchors (not just numbers)
  - Confidence selector (High / Medium / Low) per answer
  - Optional notes field for qualitative context
  - Diagnostic signal preview: *"This answer contributes to: Customer & Revenue → Data Access pattern"*
- `DomainComplete` — After each domain: running diagnosis summary, pattern flags raised so far, option to revisit any question
- `SessionPause` — Save and resume. Full state persisted. Shareable resume link.

### Module 3 — Diagnostic Engine (`/engine`)
Backend service. Not a UI module — pure logic.

Runs after all questions are answered. Produces:
1. **Pattern matches** — which diagnostic rules fired, with evidence (question IDs + scores)
2. **Root cause list** — named, ranked, evidence-backed
3. **Intervention tier map** — per domain, per capability area
4. **Reasoning log** — plain-language explanation for every finding (see §7)

This is the core IP of the product. See §7 for full engine specification.

### Module 4 — Output & Report (`/features/output`)
The deliverable. Consultant reviews, can annotate, then presents to client.

**Screens:**
- `DiagnosisSummary` — What's wrong and why. Each root cause shown with evidence trail. Client can click any finding to see exactly which questions produced it.
- `InterventionMap` — Heat map (domains × intervention types). Colour coded. D3 visualisation.
- `Roadmap3060-90` — Three-column card layout. Each action card shows: what, why (traces to root cause), estimated effort, expected outcome. Fully traceable.
- `BusinessCase` — Problem cost + intervention value + priority logic. Three-tier value stack (Process savings / Automation savings / AI uplift). Conservative and realistic ranges.
- `ReasoningLog` — Full explainability view. Every score, every pattern, every recommendation with complete evidence chain. Consultant-facing.
- `ReportExport` — Generates branded PDF. Includes setup configuration page, all four output sections, reasoning appendix.

### Module 5 — Consultant Dashboard (`/features/dashboard`)
Engagement management and (future) benchmarking.

**Screens:**
- `EngagementList` — All past and active engagements
- `EngagementDetail` — Full engagement history, ability to re-run or fork
- `BenchmarkView` — (Phase 2) Cross-engagement comparisons. "This client is in the 40th percentile for Operations maturity across your GCC engagements."

---

## 5. Data Models

```typescript
// Engagement — top-level container
type Engagement = {
  id: string
  clientName: string
  industry: Industry
  companySize: CompanySize
  revenueRange: RevenueRange
  geography: string
  strategicPriorities: string       // free text, consultant input
  consultantHypothesis: string      // pre-session hypothesis notes
  confidenceLevel: 'high' | 'medium' | 'low'
  domainsInScope: Domain[]
  interventionWeights: InterventionWeights  // must sum to 100
  ambitionTargets: AmbitionTargets
  status: 'setup' | 'in_progress' | 'complete'
  createdAt: Date
  updatedAt: Date
}

// InterventionWeights — client-configured priority
type InterventionWeights = {
  process: number      // 0-100, all four must sum to 100
  automation: number
  analytics: number
  ai: number
}

// AmbitionTargets — client's 12-month success definition
type AmbitionTargets = {
  costReductionPct: number
  productivityGainPct: number
  revenueImpactPct: number
  customMetric?: string
  customTarget?: number
}

// Question — from the question bank
type Question = {
  id: string                  // e.g. "CRV-01"
  text: string
  preAnswerContext: string    // why this question matters
  domain: Domain
  capabilityArea: string
  interventionSignal: InterventionType   // what tier this question diagnoses
  diagnosticPatterns: string[]           // which patterns this contributes to
  baseWeight: number         // 0.5 – 2.0
  anchors: ScaleAnchor[]     // 5 behavioural anchors for the scale
}

// ScaleAnchor — behavioural description per score point
type ScaleAnchor = {
  value: 1 | 2 | 3 | 4 | 5
  label: string              // e.g. "No defined process exists"
  description: string        // 1-sentence behavioural description
}

// Answer — client's response to a question
type Answer = {
  engagementId: string
  questionId: string
  rawScore: 1 | 2 | 3 | 4 | 5
  confidence: 'high' | 'medium' | 'low'
  notes?: string
  weightedScore: number      // computed: rawScore × weight × confidenceMultiplier
  timestamp: Date
}

// DiagnosticResult — output of the engine
type DiagnosticResult = {
  engagementId: string
  domainScores: DomainScore[]
  patterns: PatternMatch[]
  rootCauses: RootCause[]
  interventionMap: InterventionMapEntry[]
  roadmap: RoadmapItem[]
  businessCase: BusinessCase
  reasoningLog: ReasoningEntry[]
  generatedAt: Date
}

// RootCause — named diagnosis with evidence
type RootCause = {
  id: string
  name: string                   // e.g. "Siloed Systems Problem"
  description: string            // plain language explanation
  domain: Domain
  severity: 'critical' | 'high' | 'medium' | 'low'
  evidenceQuestionIds: string[]  // which questions produced this finding
  evidencePattern: string        // the pattern that fired
  recommendedInterventionTier: InterventionType
  prevalence?: string            // e.g. "seen in 70% of similar engagements"
}

// RoadmapItem — a specific recommended action
type RoadmapItem = {
  id: string
  phase: 30 | 60 | 90
  title: string
  description: string
  rootCauseIds: string[]         // which root causes this addresses
  questionIds: string[]          // which answers produced this recommendation
  interventionType: InterventionType
  estimatedEffort: 'days' | 'weeks' | 'months'
  expectedOutcome: string
  prerequisiteIds: string[]      // sequencing dependencies
}

// ReasoningEntry — the SHAP-equivalent log
type ReasoningEntry = {
  outputType: 'score' | 'pattern' | 'rootCause' | 'roadmapItem' | 'businessCase'
  outputId: string
  explanation: string            // plain language, 1-3 sentences
  contributingFactors: Array<{
    questionId?: string
    patternId?: string
    weight: number
    direction: 'positive' | 'negative'
    description: string
  }>
}
```

---

## 6. The Question Bank

### 6.1 Domains (8 total)

| Code | Domain |
|------|--------|
| CRV | Customer & Revenue |
| MKT | Marketing & Demand |
| SVC | Service & Retention |
| OPS | Operations & Fulfillment |
| PPL | People & Organisation |
| FIN | Finance & Risk |
| TEC | Technology & Data |
| PRD | Product & Innovation |

### 6.2 Question Philosophy

Questions are **behavioural and situational**, not capability surveys. Three archetypes:

**Type A — "How does it actually work today?"**
Reveals current state without inflating maturity. Example:
> *"When a field sales agent prepares for a client meeting, walk me through what they look at, where the information comes from, and roughly how long that preparation takes."*

**Type B — "What breaks, what's slow, what's inconsistent?"**
Pain-first, not technology-first. Example:
> *"Which decisions does your team make regularly that feel like they're based on incomplete or outdated information?"*

**Type C — "What does good look like to you?"**
Calibrates ambition and surfaces implicit expectations. Example:
> *"If you could eliminate one recurring manual task in your team tomorrow, what would it be?"*

### 6.3 Intervention Signals

Every question is tagged with a primary intervention signal:

| Signal | Meaning |
|--------|---------|
| `PROCESS` | Answer reveals a workflow design problem |
| `DIGITIZE` | Answer reveals data isn't being captured |
| `INTEGRATE` | Answer reveals systems exist but don't connect |
| `AUTOMATE` | Answer reveals repetitive manual work |
| `ANALYTICS` | Answer reveals insight/visibility gaps |
| `AI` | Answer reveals genuine judgment-at-scale opportunity |

### 6.4 Scale Anchors (example for CRV-01)

Question: *"When a field sales agent prepares for a client meeting, how complete and accessible is the information they need?"*

| Score | Label | Description |
|-------|-------|-------------|
| 1 | No preparation | Agents go in with no structured information; it's entirely from memory |
| 2 | Partial, manual | Some info exists but requires manual searching across multiple tools |
| 3 | Accessible but incomplete | A CRM record exists but misses recent interactions or context |
| 4 | Mostly complete | Most info is in one place; minor gaps or occasional staleness |
| 5 | Complete and real-time | Full context auto-surfaced before every meeting, zero manual effort |

### 6.5 Question Bank File Format

Questions stored as JSON in `packages/question-bank/questions.json`:

```json
{
  "id": "CRV-01",
  "text": "When a field sales agent prepares for a client meeting, how complete and accessible is the information they need?",
  "preAnswerContext": "This question tells us whether your sales process is supported by the right information infrastructure. A low score here almost always means one of three things: the data exists but isn't integrated, the process doesn't mandate preparation, or nobody owns the data quality. Your answer directly feeds the 'Customer & Revenue — Data Access' diagnosis.",
  "domain": "CRV",
  "capabilityArea": "Sales Execution",
  "interventionSignal": "INTEGRATE",
  "diagnosticPatterns": ["siloed-systems", "manual-prep-bottleneck"],
  "baseWeight": 1.4,
  "anchors": [...]
}
```

---

## 7. The Diagnostic Engine

This is the core IP. Located in `apps/api/src/engine/`.

### 7.1 Scoring Pipeline

```
Raw Score (1-5)
  × Confidence Multiplier (High: 1.0 / Medium: 0.85 / Low: 0.70)
  × Question Base Weight (0.5 – 2.0)
  × Intervention Weight Multiplier (from client's pre-session configuration)
= Weighted Score

Domain Score = (Σ Weighted Scores / Max Possible) × 100

Intervention Tier Score = Domain Score filtered by intervention signal tags
```

### 7.2 Pattern Matching Rules

Located in `packages/diagnostic-rules/rules.json`. Each rule is:

```typescript
type DiagnosticRule = {
  id: string                       // e.g. "siloed-systems"
  name: string                     // "Siloed Systems Problem"
  description: string              // plain language explanation of what this pattern means
  triggerConditions: Array<{
    questionIds: string[]          // which questions to evaluate
    operator: 'AND' | 'OR' | 'AVG_BELOW' | 'CONTRAST'
    threshold?: number             // for AVG_BELOW
    contrastGroup?: string[]       // for CONTRAST (high-scoring vs low-scoring group)
  }>
  firesWhen: string                // human-readable condition description
  diagnosis: string                // the named root cause this produces
  severity: 'critical' | 'high' | 'medium' | 'low'
  recommendedActions: string[]     // roadmap item IDs this rule generates
  explanationTemplate: string      // template for reasoning log entry
                                   // use {Q:CRV-01} syntax to inject actual scores
}
```

### 7.3 Core Diagnostic Patterns (seed set — expand over time)

| Pattern ID | Name | Trigger | Meaning |
|---|---|---|---|
| `siloed-systems` | Siloed Systems | Process questions high, data-access questions low | Data exists but isn't connected |
| `dark-process` | Dark Process | Process definition low + data capture low | Work happening entirely off-system |
| `manual-bottleneck` | Manual Decision Bottleneck | Volume questions high, speed/approval questions low | Human approval is the constraint |
| `data-trust-deficit` | Data Trust Deficit | Scores moderate but confidence flags consistently Low | People don't trust the data they have |
| `insight-action-gap` | Insight-Action Gap | Reporting/analytics questions high, outcome questions low | Insight exists but doesn't drive decisions |
| `inconsistency-signal` | Process Inconsistency | High variance across same-domain questions | Process defined but not enforced |
| `foundation-gap` | Foundation Gap | Both process AND data questions below 2.0 avg | No stable base; AI is premature |
| `automation-ready` | Automation Ready | Process high + data high + frequency high | Clear automation opportunity |
| `ai-candidate` | Genuine AI Candidate | All lower tiers solid + judgment-variability high | AI adds real value here |

### 7.4 Reasoning Log Generation

After every engine decision, write a `ReasoningEntry`. Use the Claude API to generate the plain-language explanation from the structured evidence. Prompt template:

```
You are the reasoning engine for a business diagnostic tool. 
Given the following evidence, write a 2-3 sentence plain-language explanation 
that a senior executive would understand. Be specific — reference the actual 
patterns found, not generic statements. Do not use AI jargon.

Finding: {rootCauseName}
Evidence questions: {questionTexts with scores}
Pattern fired: {patternDescription}
Engagement context: {industry}, {companySize}, {domainsInScope}

Output only the explanation. No preamble.
```

### 7.5 Business Case Formula

```
Problem Cost = f(domain scores, companySize, revenueRange)
  // Calculated per domain using parametric formulas scaled to client's actual numbers

Tier 0-1 Value (Process + Digitize) = Problem Cost × Process Opportunity Rate
Tier 2 Value (Automate)             = Tier 0-1 Value × Automation Lift Factor
Tier 3 Value (AI)                   = Tier 2 Value × AI Uplift Factor

Conservative (12-month)  = Total Value × 0.65
Realistic (24-month)     = Total Value × 1.30

Priority Score per Initiative = 
  Revenue Impact (40%) + Feasibility (25%) + Data Readiness (15%) + 
  Time-to-Value (10%) + Cross-Domain Reuse (10%)
```

All formula parameters are visible in the UI and editable by the consultant. No black boxes.

---

## 8. Explainability Requirements (Non-Negotiable)

Every piece of output must satisfy the **One-Sentence Rule**:

> Any number, recommendation, or roadmap item must be explainable in one plain-language sentence that traces back to a specific client answer.

Implementation checklist:
- [ ] Every question card shows `preAnswerContext` before the client answers
- [ ] Every domain score page shows which questions dragged it down and why
- [ ] Every root cause shows the pattern that fired + the specific question IDs
- [ ] Every roadmap item shows the root cause(s) it addresses + the questions behind them
- [ ] Every business case number shows the formula, the inputs, and where the inputs came from
- [ ] The full reasoning log is always accessible (consultant view) and a summary version is in the report

---

## 9. UX & Design Principles

### 9.1 Two UX Modes

**Consultant Mode** (default)
- Full configuration controls visible
- Live scoring panel always present
- Reasoning log accessible at any point
- Can annotate any question or finding
- Can override any score with a written justification

**Client Mode** (toggle available during session)
- Clean, distraction-free
- No raw scores visible — only maturity labels
- Pre-answer context shown prominently
- Progress indicator per domain
- No machinery exposed

### 9.2 Visual Design Direction

- **Palette:** Deep navy / slate with warm white. Single accent colour (amber or teal — pick one, stay consistent). No gradients on UI chrome. Reserve colour for data.
- **Typography:** Editorial. A strong display serif for headings, clean sans for body. Never Inter or Roboto.
- **Layout:** Generous whitespace. Left-rail navigation for session flow. Content always centred with max-width constraint.
- **Data Visualisation:** Recharts for scores (restrained, not chart-junk). D3 for the intervention heat map. Every chart has a plain-language caption.
- **Motion:** Subtle. Score animations on reveal. No gratuitous transitions.
- **Tone:** Premium consulting deliverable. Think McKinsey deck meets thoughtful SaaS product.

### 9.3 Component Library Approach

Build a minimal internal component library in `web/src/components/ui/`:
- `ScoreCard` — domain score with maturity band label
- `QuestionCard` — full question UI with anchors, confidence, notes
- `RootCauseCard` — finding with evidence chain expandable
- `RoadmapColumn` — 30/60/90 phase column with action cards
- `WeightSlider` — intervention weight allocator (sums to 100)
- `HeatMap` — D3 domain × intervention matrix
- `ReasoningDrawer` — slide-out explainability panel
- `ProgressRail` — session progress indicator

Do not use shadcn/ui, Radix, or any pre-built component library. Every component is custom to maintain the design language.

---

## 10. Build Sequence

Build in this exact order. Each phase must be functionally complete before the next begins.

### Phase 1 — Foundation (Week 1)
- [ ] Monorepo setup (Turborepo + pnpm)
- [ ] Shared types package
- [ ] Prisma schema + SQLite dev setup
- [ ] Express API skeleton with auth
- [ ] React + Vite + Tailwind setup
- [ ] Question bank JSON (first 40 questions across CRV + OPS domains)
- [ ] Question bank loader service

### Phase 2 — Setup Flow (Week 1-2)
- [ ] All 6 engagement setup screens
- [ ] Setup state persisted to DB
- [ ] SetupSummary confirmation page
- [ ] Consultant dashboard (engagement list only)

### Phase 3 — Assessment Session (Week 2-3)
- [ ] QuestionCard component with all features
- [ ] Session routing logic (domain by domain)
- [ ] Answer persistence (auto-save on every answer)
- [ ] Live scoring panel
- [ ] Save/resume functionality

### Phase 4 — Diagnostic Engine (Week 3-4)
- [ ] Scoring pipeline
- [ ] Pattern matching rules (seed set of 9 patterns)
- [ ] Root cause generation
- [ ] Roadmap generation
- [ ] Business case calculator
- [ ] Reasoning log with Claude API narrative generation

### Phase 5 — Output & Report (Week 4-5)
- [ ] All 5 output screens
- [ ] Reasoning drawer (explainability panel)
- [ ] PDF export via Puppeteer
- [ ] Report branding (mindssparc)

### Phase 6 — Polish & Question Bank (Week 5-6)
- [ ] Complete question bank (all 8 domains, ~200 questions)
- [ ] Full design pass (typography, spacing, colour)
- [ ] Client mode toggle
- [ ] Annotation system for consultant
- [ ] Error states and empty states

---

## 11. Environment Variables

```bash
# apps/api/.env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-here"
ANTHROPIC_API_KEY="your-key-here"
PORT=3001

# apps/web/.env
VITE_API_URL="http://localhost:3001"
```

---

## 12. Key Constraints & Rules for Claude Code

1. **Never generate a question without** `preAnswerContext`, `diagnosticPatterns`, and `anchors`. Incomplete questions break the explainability chain.

2. **Never output a root cause without** at least 2 contributing question IDs. Single-question diagnoses are not credible.

3. **Never hard-code revenue impact numbers.** All business case values must flow from the `AmbitionTargets` and `revenueRange` set in the engagement setup.

4. **The reasoning log is mandatory.** Every engine output must produce a corresponding `ReasoningEntry`. If the engine runs without generating reasoning, it is incomplete.

5. **Consultant override always requires a written note.** If a consultant overrides a score or a recommendation, that note must appear in the reasoning log and in the report.

6. **Session state is sacred.** Auto-save on every answer. The tool must be resumable from any point. Never lose a client's responses.

7. **Two-mode UI is non-negotiable.** Client mode must never expose raw numbers, scoring logic, or configuration controls.

8. **All weight sliders must validate to sum = 100** before the setup session can be completed.

9. **PDF export must be server-side rendered.** Do not use client-side PDF libraries — the output quality is insufficient for a consulting deliverable.

10. **Question bank is a package, not a DB table.** Questions are authored content, not user data. They live in JSON in the `question-bank` package. Answers live in the DB.

---

## 13. Claude API Usage in the Engine

Used in two places only:

**1. Reasoning log narrative generation**
After the engine produces structured findings, Claude generates plain-language explanations for each root cause and roadmap item. Input is structured JSON. Output is 2-3 sentence paragraph. Temperature: 0.3. Max tokens: 200 per entry.

**2. Executive summary generation**
After the full diagnostic is complete, Claude generates a 4-6 paragraph executive summary from the complete findings. Input is the full `DiagnosticResult` object. Output is the opening section of the report. Temperature: 0.4. Max tokens: 600.

In both cases: Claude is the narrator, not the judge. The diagnostic logic is deterministic rule-based code. Claude only translates structured findings into readable prose.

---

## 14. Future Phases (Do Not Build Yet)

- **Benchmark database** — cross-engagement comparisons once 20+ engagements are complete
- **Multi-respondent mode** — async pre-read by department heads before the session
- **Industry templates** — pre-configured domain scoping and weight defaults per vertical
- **Integration with presentation tools** — direct export to PowerPoint
- **Consultant training mode** — replay past engagements to train new consultants

---

*This document is the single source of truth for the mindssparc AI Assessment Portal build. Every architectural decision, every component, every engine rule should be traceable back to the principles in this file.*
