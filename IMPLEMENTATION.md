# IMPLEMENTATION.md — mindssparc AI Assessment Portal
> Phase-by-Phase Build Plan for Claude Code
> Version 1.0 | Companion to CLAUDE.md

---

## How to Use This File

This file is the execution companion to CLAUDE.md. Where CLAUDE.md defines **what** to build,
this file defines **how to build it** — in what order, with what dependencies, and with what
definition of done for each task.

Read this file at the start of every new phase prompt. Each phase has:
- **Goal** — the single sentence that defines success for this phase
- **Prerequisites** — what must be true before starting
- **Tasks** — ordered, atomic build steps
- **Acceptance Criteria** — how to verify the phase is complete
- **Handoff Notes** — what the next phase depends on from this one

---

## Phase Overview

| Phase | Name | Duration | Output |
|-------|------|----------|--------|
| 1 | Foundation & Scaffold | Week 1 | Compilable monorepo skeleton |
| 2 | Engagement Setup Flow | Week 1-2 | Complete pre-session configuration UI |
| 3 | Assessment Session | Week 2-3 | Live Q&A session with real-time scoring |
| 4 | Diagnostic Engine | Week 3-4 | Root causes, patterns, roadmap, business case |
| 5 | Output & Report | Week 4-5 | Full deliverable UI + PDF export |
| 6 | Question Bank & Polish | Week 5-6 | All 8 domains, design pass, production ready |

---

## Phase 1 — Foundation & Scaffold

**Goal:** A fully typed, compilable monorepo where every file exists in the right place,
all imports resolve, and the team can build features without touching infrastructure.

**Prerequisites:** None. This is the starting point.

### 1.1 Monorepo Setup

```
Tasks:
- Initialise pnpm workspace with turbo.json
- Configure TypeScript project references (tsconfig.base.json)
- Set up path aliases: @mindssparc/shared-types, @mindssparc/question-bank,
  @mindssparc/diagnostic-rules
- Configure turbo pipeline: build, dev, lint, typecheck
- Add .gitignore covering node_modules, dist, .env, *.db, .turbo

Definition of done:
  pnpm install           → exits 0
  pnpm turbo typecheck   → exits 0 across all packages
```

### 1.2 packages/shared-types

```
Tasks:
- Implement ALL types from CLAUDE.md §5 in src/index.ts
- Key types: Engagement, InterventionWeights, AmbitionTargets, Question,
  ScaleAnchor, Answer, DiagnosticResult, RootCause, RoadmapItem,
  ReasoningEntry, PatternMatch, DomainScore, InterventionMapEntry
- Add enums: Domain (8 values), InterventionType (6 values),
  MaturityBand (5 values), Industry, CompanySize, RevenueRange
- Export everything from index.ts
- No runtime dependencies — types only

Definition of done:
  Import from @mindssparc/shared-types resolves in both apps/web and apps/api
  No TypeScript errors
```

### 1.3 packages/question-bank

```
Tasks:
- Create questions.json with 20 CRV domain questions (full schema per CLAUDE.md §6)
  Each question must have:
    - id (CRV-01 through CRV-20)
    - text (behavioural, situational — follows Type A/B/C archetypes)
    - preAnswerContext (2-3 sentences explaining why this question matters)
    - domain ("CRV")
    - capabilityArea (e.g. "Sales Execution", "Account Intelligence")
    - interventionSignal (one of: PROCESS/DIGITIZE/INTEGRATE/AUTOMATE/ANALYTICS/AI)
    - diagnosticPatterns (array of pattern IDs this question contributes to)
    - baseWeight (0.5 – 2.0)
    - anchors (array of 5 ScaleAnchor objects with value, label, description)

- Create loader.ts:
    - loadQuestions(domain?: Domain): Question[]
    - getQuestion(id: string): Question | undefined
    - getQuestionsByPattern(patternId: string): Question[]
    - validateQuestionBank(): ValidationResult  ← runs on startup, fails loudly

Definition of done:
  loadQuestions('CRV') returns 20 fully typed questions
  validateQuestionBank() passes with no errors
```

### 1.4 packages/diagnostic-rules

```
Tasks:
- Create rules.json with all 9 seed patterns from CLAUDE.md §7.3:
    siloed-systems, dark-process, manual-bottleneck, data-trust-deficit,
    insight-action-gap, inconsistency-signal, foundation-gap,
    automation-ready, ai-candidate
  Each rule must have:
    - id, name, description
    - triggerConditions (with operator: AND/OR/AVG_BELOW/CONTRAST)
    - firesWhen (human-readable)
    - diagnosis, severity
    - recommendedActions (array of roadmap item template IDs)
    - explanationTemplate (use {Q:CRV-01} syntax for score injection)

- Create loader.ts:
    - loadRules(): DiagnosticRule[]
    - getRuleById(id: string): DiagnosticRule | undefined

Definition of done:
  loadRules() returns 9 typed rules, no TypeScript errors
```

### 1.5 apps/api — Skeleton

```
Tasks:
- Express + TypeScript setup with ts-node-dev for development
- Prisma schema implementing ALL models from CLAUDE.md §5:
    Engagement, Answer, DiagnosticResult, Session
  Include: createdAt/updatedAt on all models, proper relations, indexes
- Route files (placeholder handlers returning 501 Not Implemented):
    POST   /api/auth/login
    GET    /api/engagements
    POST   /api/engagements
    GET    /api/engagements/:id
    PUT    /api/engagements/:id
    POST   /api/engagements/:id/session/start
    POST   /api/engagements/:id/session/pause
    POST   /api/engagements/:id/answers
    GET    /api/engagements/:id/answers
    POST   /api/engagements/:id/diagnose
    GET    /api/engagements/:id/result
    POST   /api/engagements/:id/export
- Engine files (empty exported functions):
    scoring.ts        → calculateWeightedScore(), calculateDomainScore()
    patternMatcher.ts → matchPatterns()
    rootCauseGenerator.ts → generateRootCauses()
    roadmapBuilder.ts → buildRoadmap()
    businessCase.ts   → calculateBusinessCase()
    reasoningLog.ts   → generateReasoningLog()
- services/claude.ts:
    generateNarrative(finding: RootCause, context: Engagement): Promise<string>
    generateExecutiveSummary(result: DiagnosticResult): Promise<string>
- Middleware: auth JWT middleware, error handler, request logger
- Health check: GET /api/health → { status: 'ok', timestamp }

Definition of done:
  pnpm --filter @mindssparc/api dev starts without errors
  GET /api/health returns 200
  prisma generate succeeds
  prisma migrate dev --name init succeeds
```

### 1.6 apps/web — Skeleton

```
Tasks:
- Vite + React 18 + TypeScript
- Tailwind CSS with custom config (CLAUDE.md §9.2 design tokens):
    colors: navy (#0F1B2D), slate (#1E2D3D), warmWhite (#F8F5F0),
            amber (#D97706), text-primary, text-muted, border-subtle
    fontFamily: display (serif TBD), body (sans TBD)
    Define these as CSS variables in index.css
- React Router v6 with all routes defined (placeholder page components):
    /                      → redirect to /dashboard
    /dashboard             → DashboardPage
    /dashboard/:id         → EngagementDetailPage
    /setup/new             → SetupPage (multi-step)
    /session/:id           → SessionPage
    /session/:id/question  → QuestionPage
    /output/:id            → OutputPage
    /output/:id/diagnosis  → DiagnosisPage
    /output/:id/roadmap    → RoadmapPage
    /output/:id/business-case → BusinessCasePage
    /output/:id/reasoning  → ReasoningPage
    /login                 → LoginPage
- Zustand stores (typed, empty state):
    engagementStore.ts  → engagement, setEngagement, clearEngagement
    sessionStore.ts     → answers, currentQuestion, addAnswer, setCurrentQuestion
    uiStore.ts          → mode ('consultant'|'client'), isDrawerOpen, toggleMode
- React Query setup with axios client pointing to VITE_API_URL
- Component skeleton files (empty components with correct props interface):
    ui/ScoreCard.tsx
    ui/QuestionCard.tsx
    ui/RootCauseCard.tsx
    ui/RoadmapColumn.tsx
    ui/WeightSlider.tsx
    ui/HeatMap.tsx
    ui/ReasoningDrawer.tsx
    ui/ProgressRail.tsx
- lib/constants.ts:
    DOMAINS (8 entries with code, name, description, colour)
    INTERVENTION_TYPES (6 entries)
    MATURITY_BANDS (5 entries with score range, label, colour)
    CONFIDENCE_MULTIPLIERS ({ high: 1.0, medium: 0.85, low: 0.70 })

Definition of done:
  pnpm --filter @mindssparc/web dev starts without errors
  All routes render placeholder text without crashing
  No TypeScript errors
  Tailwind classes compile correctly
```

### Phase 1 Acceptance Criteria

```
[ ] pnpm install exits 0
[ ] pnpm turbo build exits 0 across all 5 packages
[ ] pnpm turbo typecheck exits 0 across all 5 packages
[ ] GET /api/health returns { status: 'ok' }
[ ] All web routes render without crashing
[ ] prisma migrate dev succeeds and creates dev.db
[ ] loadQuestions('CRV') returns 20 questions, all passing validation
[ ] loadRules() returns 9 rules
[ ] No console errors in browser
```

---

## Phase 2 — Engagement Setup Flow

**Goal:** A consultant can complete the full pre-session configuration — from engagement
details through domain scoping, weight allocation, ambition targets, and confirmation —
with all data persisted to the database.

**Prerequisites:** Phase 1 complete. All API routes scaffolded. Stores typed.

### 2.1 API — Engagement Endpoints

```
Tasks:
- POST /api/auth/login
    Body: { email, password }
    Returns: { token, consultant: { id, name, email } }
    Hardcode one consultant account via env vars for now (no user management yet)

- POST /api/engagements
    Body: Engagement (all setup fields)
    Validates: domainsInScope.length >= 2, interventionWeights sum === 100
    Returns: { engagement } with generated ID

- GET /api/engagements
    Returns: { engagements[] } sorted by updatedAt desc

- PUT /api/engagements/:id
    Partial update — used as each setup step is completed
    Returns: { engagement }

- GET /api/engagements/:id
    Returns: full engagement with computed questionCount
    (questionCount = questions in scope based on domainsInScope selection)
```

### 2.2 Setup — Multi-Step Form Architecture

```
Tasks:
- Implement SetupPage as a multi-step wizard (NOT separate routes — single page,
  step state in URL param: /setup/new?step=1 through ?step=6)
- Step state persisted to engagementStore AND auto-saved to API on every step advance
  (so browser refresh doesn't lose progress)
- Step validation runs before advancing — cannot proceed with invalid data
- Back navigation allowed at any step
- Progress indicator (ProgressRail component) always visible showing 6 steps

Step implementations:

STEP 1 — EngagementForm
  Fields:
    - Engagement Name (text, required)
    - Client Name (text, required)
    - Industry (select from Industry enum)
    - Company Size (select: <50 / 50-200 / 200-1000 / 1000-5000 / 5000+)
    - Annual Revenue Range (select: <$1M / $1-10M / $10-50M / $50-200M / $200M+)
    - Geography (text)
    - Strategic Priorities (textarea — consultant's pre-session notes)
    - Consultant Hypothesis (textarea — where you think the pain is)
  Validation: Name, Client, Industry required before advancing

STEP 2 — DomainScoping
  Display all 8 domains as selectable cards
  Each card shows: domain name, description, example capability areas
  Multi-select: minimum 2, maximum 8
  Live counter: "~{n} questions in scope" updates as domains are toggled
  (n = selected domains × avg 25 questions per domain)
  Validation: at least 2 domains selected

STEP 3 — WeightConfiguration
  Four WeightSlider components: Process / Automation / Analytics / AI
  Each slider: 0-100 integer
  Constraint: all four must sum exactly to 100
  Live feedback: running total shown, red if ≠ 100
  Helper text explaining what each intervention type means
  Pre-set buttons: "Operations Heavy" / "Growth Focused" / "Balanced" /
                   "AI Ready" — sets suggested defaults the client can adjust
  Validation: sum === 100

STEP 4 — AmbitionCalibration
  Three numeric inputs with % suffix:
    - Cost Reduction Target (%)
    - Productivity Gain Target (%)
    - Revenue Impact Target (%)
  Optional: Custom metric name + target value
  Explanatory text: "These become the benchmark for your business case"
  No hard validation — all fields optional but nudge if all empty

STEP 5 — ConfidenceLevel
  Three radio options with descriptions:
    High — "This team tracks KPIs closely and answers will be data-backed"
    Medium — "Good awareness but some answers will be estimates"
    Low — "This is largely intuition-based — treat outputs as directional"
  Show the confidence multipliers (1.0 / 0.85 / 0.70) and explain their effect

STEP 6 — SetupSummary
  Full read-only summary of all configuration
  Two columns: left (engagement details + domains), right (weights + ambition + confidence)
  "Edit" link next to each section that jumps back to that step
  Primary CTA: "Begin Assessment" → POST to /api/engagements, navigate to /session/:id
  Secondary: "Save & Exit" → saves draft, returns to dashboard
  This page is Page 1 of the final PDF report — design accordingly
```

### 2.3 Dashboard

```
Tasks:
- GET /api/engagements → render engagement list
- EngagementList: table/card list showing:
    - Client name, engagement name, industry
    - Status badge (Setup / In Progress / Complete)
    - Domain count, question count
    - Last updated timestamp
    - Actions: Continue / View Results / Duplicate
- Empty state: "No engagements yet" with CTA to start one
- Header with consultant name and logout
```

### 2.4 WeightSlider Component

```
Tasks:
- Custom slider (no library) — styled range input with Tailwind
- Props: label, value, onChange, color
- Shows current value as large number next to label
- Smooth animation as value changes
- Locked state (read-only mode for SetupSummary)
```

### Phase 2 Acceptance Criteria

```
[ ] Consultant can log in
[ ] All 6 setup steps complete without errors
[ ] Validation blocks advancement on invalid data
[ ] Auto-save works — refreshing mid-setup does not lose data
[ ] Weight sliders enforce sum = 100
[ ] SetupSummary shows accurate reflection of all inputs
[ ] "Begin Assessment" creates engagement in DB and navigates to session
[ ] Dashboard shows engagement list with correct status
[ ] All network requests go through React Query with loading/error states
```

---

## Phase 3 — Assessment Session

**Goal:** A consultant can facilitate a complete live assessment session —
question by question, domain by domain — with real-time scoring, confidence
capture, and full save/resume capability.

**Prerequisites:** Phase 2 complete. Engagement record exists in DB with configuration.

### 3.1 API — Session & Answer Endpoints

```
Tasks:
- POST /api/engagements/:id/session/start
    Generates ordered question list based on domainsInScope
    Creates Session record: { engagementId, questionIds[], status: 'active' }
    Returns: { session, firstQuestion }

- POST /api/engagements/:id/session/pause
    Updates Session status to 'paused', records lastQuestionId
    Returns: { resumeToken } — a signed JWT encoding session state

- GET /api/engagements/:id/session/resume
    Returns: { session, answers[], nextQuestion, progress }

- POST /api/engagements/:id/answers
    Body: { questionId, rawScore, confidence, notes }
    Computes weightedScore immediately:
      weightedScore = rawScore
                      × CONFIDENCE_MULTIPLIERS[confidence]
                      × question.baseWeight
                      × interventionWeightMultiplier  ← from engagement config
    Saves Answer record
    Returns: { answer, runningDomainScore }

- GET /api/engagements/:id/answers
    Returns: all answers for this engagement with questions joined

- GET /api/engagements/:id/progress
    Returns: {
      totalQuestions, answeredQuestions, percentComplete,
      domainProgress: { [domain]: { total, answered, runningScore } }
      estimatedMinutesRemaining
    }
```

### 3.2 Question Ordering Logic

```
Tasks (in scoring.ts):
- generateQuestionOrder(engagement: Engagement): string[]
  Rules:
    - Only questions from domainsInScope
    - Within each domain: Type A questions first (current state),
      then Type B (pain points), then Type C (ambition)
    - Domains ordered by engagement hypothesis (consultant-flagged domains first)
    - Random seed per session for question variety within type groups
    - Returns ordered array of question IDs

- interventionWeightMultiplier(question: Question, weights: InterventionWeights): number
  Maps question.interventionSignal to the client's weight for that type
  Normalises to a 0.8-1.2 multiplier range so weights influence but don't dominate
```

### 3.3 SessionPage — Container

```
Tasks:
- Loads engagement + session on mount
- Manages navigation between domains
- Two-panel layout:
    Left panel (280px): ProgressRail — domain list with completion status,
                        running score per domain (consultant mode only),
                        session timer, pause button
    Right panel: current QuestionCard or DomainComplete screen

- Mode toggle button (top right): "Consultant View" ↔ "Client View"
  In Client View: left panel collapses, scores hidden, cleaner typography

- Auto-saves every answer immediately (optimistic UI — don't wait for API)
- Keyboard navigation: Enter to confirm, arrow keys for score selection
```

### 3.4 QuestionCard Component

```
Tasks:
Full implementation of the QuestionCard UI component:

HEADER SECTION:
  - Domain badge (colour-coded per domain)
  - Question number / total (e.g. "12 of 47")
  - Capability area label

PRE-ANSWER CONTEXT SECTION (always visible before answering):
  - Expandable panel, expanded by default for first 5 questions,
    collapsed thereafter (user learns the pattern)
  - Shows question.preAnswerContext text
  - Shows "This answer contributes to:" with pattern names listed
  - Light background to visually separate from question

QUESTION SECTION:
  - Large, clear question text
  - 5-point scale as clickable cards (NOT a slider):
    Each card shows: score number + anchor label + anchor description
    Selected card: accent colour border + background tint
    Hover state: subtle highlight

CONFIDENCE SECTION (below score selection):
  - Three toggle buttons: High / Medium / Low
  - Small helper text explaining what each means in this context
  - Shows the multiplier that will be applied (e.g. "×0.85")

NOTES SECTION:
  - Expandable textarea: "Add context or qualifications..."
  - Collapsed by default
  - Character limit: 500

FOOTER:
  - "Next Question" button (disabled until score + confidence selected)
  - "Skip" option (marks as skipped, not unanswered — affects completion %)
  - Back arrow to previous question (score pre-filled, editable)

DIAGNOSTIC SIGNAL PREVIEW (consultant mode only):
  - Subtle bottom bar: "Signal: {interventionSignal} — contributes to {patterns}"
  - Helps consultant understand the diagnostic value of the question
```

### 3.5 DomainComplete Screen

```
Tasks:
- Shown after final question in each domain
- Shows:
    Domain name + final score + maturity band label
    Score breakdown: which questions scored high/low
    Pattern flags: any diagnostic patterns triggered so far (names only, no diagnosis yet)
    Comparison to engagement hypothesis (did this match what consultant expected?)
- CTA: "Next Domain" or "Complete Assessment" (if last domain)
- Option: "Review {domain} answers" — returns to first question of that domain
```

### 3.6 ProgressRail Component

```
Tasks:
- Vertical rail (left panel) showing all in-scope domains
- Per domain:
    - Domain icon/colour indicator
    - Domain name
    - Progress: {answered}/{total} questions
    - Running score (consultant mode): shown as number + mini progress bar
    - Status: Not Started / In Progress / Complete
- Current domain highlighted
- Completed domains show final score + maturity band colour
- Total session progress at top: percentage + time elapsed
```

### Phase 3 Acceptance Criteria

```
[ ] Session starts and loads correct questions for scoped domains
[ ] QuestionCard renders all sections correctly
[ ] Score + confidence selection works, Next button enables
[ ] Every answer auto-saves — network tab confirms POST on each answer
[ ] Running domain score updates in ProgressRail after each answer
[ ] Consultant/Client mode toggle hides/shows correct elements
[ ] DomainComplete screen shows after last question in each domain
[ ] Pause session → resume session → correct question resumes, all answers preserved
[ ] preAnswerContext visible before answering
[ ] Diagnostic signal preview visible in consultant mode
[ ] Keyboard navigation works (Enter, arrow keys)
```

---

## Phase 4 — Diagnostic Engine

**Goal:** After a session is complete, the engine produces a fully explained diagnostic
result — root causes with evidence, a 30/60/90 roadmap, and a business case — all with
a complete reasoning log.

**Prerequisites:** Phase 3 complete. At least one full session with all answers recorded.

### 4.1 Scoring Pipeline (scoring.ts)

```
Tasks:
Implement these functions in order:

calculateWeightedScore(answer: Answer, question: Question, engagement: Engagement): number
  = answer.rawScore
    × CONFIDENCE_MULTIPLIERS[answer.confidence]
    × question.baseWeight
    × interventionWeightMultiplier(question, engagement.interventionWeights)

calculateDomainScore(answers: Answer[], questions: Question[], engagement: Engagement): DomainScore
  = {
      domain,
      score: (Σ weightedScores / maxPossibleScore) × 100,
      maturityBand: lookupBand(score),
      questionCount, answeredCount,
      breakdown: { byInterventionType, byCapabilityArea }
    }

calculateInterventionTierScores(domainScores: DomainScore[]): InterventionMapEntry[]
  Aggregates scores grouped by interventionSignal across all domains
  Produces the data for the heat map visualisation

All arithmetic must be deterministic — same inputs always produce same output.
Round final scores to 1 decimal place.
```

### 4.2 Pattern Matcher (patternMatcher.ts)

```
Tasks:
matchPatterns(answers: Answer[], questions: Question[], rules: DiagnosticRule[]): PatternMatch[]

For each rule, evaluate its triggerConditions against the answer set:

  AND operator:
    All specified questions must score below threshold
    
  OR operator:
    Any specified question scores below threshold
    
  AVG_BELOW operator:
    Average score of specified question group is below threshold
    
  CONTRAST operator:
    Group A (high expected) scores significantly lower than Group B
    Threshold: >1.5 point gap between group averages

Returns PatternMatch[]:
  {
    ruleId, ruleName,
    fired: boolean,
    confidence: 'high'|'medium'|'low',  ← based on how strongly conditions met
    evidenceQuestionIds: string[],        ← which questions triggered it
    evidenceScores: number[],             ← their actual scores
    contrastDelta?: number                ← for CONTRAST patterns
  }

Only fired patterns (fired: true) proceed to root cause generation.
```

### 4.3 Root Cause Generator (rootCauseGenerator.ts)

```
Tasks:
generateRootCauses(patterns: PatternMatch[], answers: Answer[],
                   questions: Question[], engagement: Engagement): RootCause[]

For each fired pattern:
  - Create RootCause from the rule's diagnosis
  - Attach evidenceQuestionIds from the pattern match
  - Set severity based on pattern confidence + engagement's confidence level
  - Set recommendedInterventionTier from the rule definition
  - Add prevalence note if applicable

Deduplication: if two patterns produce the same root cause name, merge them
  (union their evidenceQuestionIds, take the higher severity)

Ranking: sort by severity (critical → high → medium → low),
  then by number of affected questions (more evidence = higher rank)

Cap at 8 root causes per engagement (the top 8 by this ranking).
If more than 8 fire, merge lower-severity ones into a "Additional Findings" group.
```

### 4.4 Roadmap Builder (roadmapBuilder.ts)

```
Tasks:
buildRoadmap(rootCauses: RootCause[], engagement: Engagement,
             answers: Answer[]): RoadmapItem[]

Phase assignment rules:
  30-day items: PROCESS + DIGITIZE intervention types, severity critical/high
    → These require no budget approval, no vendor selection
    → Target: things a team lead can action immediately
    
  60-day items: INTEGRATE + AUTOMATE intervention types
    → Require some IT involvement or tooling decision
    → Target: specific workflow automations with measurable outcomes
    
  90-day items: ANALYTICS + AI intervention types
    → Require data readiness (validated in 30/60 day phases)
    → Target: design complete, vendors evaluated, ready to deploy in month 4+

Prerequisite chaining:
  Every 60-day item must list its prerequisite 30-day items
  Every 90-day item must list its prerequisite 60-day items
  This enforces the sequencing argument in the business case

Per roadmap item generate:
  - title: action-oriented, specific (not "Improve data quality")
  - description: what exactly to do and how
  - rootCauseIds: which root causes this addresses
  - questionIds: which answers produced this recommendation
  - estimatedEffort: based on intervention type
  - expectedOutcome: specific, measurable where possible
```

### 4.5 Business Case Calculator (businessCase.ts)

```
Tasks:
calculateBusinessCase(domainScores: DomainScore[], roadmap: RoadmapItem[],
                      engagement: Engagement): BusinessCase

Problem Cost calculation (per domain in scope):
  Base problem cost = f(engagement.revenueRange, domain, domainScore)
  Use parametric table — not hardcoded numbers:
    revenueRange maps to a revenue midpoint estimate
    domain maps to a % of revenue at risk (e.g. Sales domain: 15% of revenue)
    domainScore maps to a problem intensity factor (low score = higher cost)

Value by tier:
  Process + Digitize value  = problem cost × 0.25  (25% recovery from fixing process)
  Automation value          = problem cost × 0.35  (35% additional from automating)
  Analytics value           = problem cost × 0.15  (insight and decision improvement)
  AI value                  = problem cost × 0.25  (remaining uplift from AI)

Multiply AI value by: (interventionWeights.ai / 100) as the client's priority signal

Conservative (12-month)  = total value × 0.65
Realistic (24-month)     = total value × 1.30

Priority scoring per initiative:
  = revenueImpact(0.40) + feasibility(0.25) + dataReadiness(0.15)
    + timeToValue(0.10) + crossDomainReuse(0.10)

All formula inputs visible in output — no black box numbers.
Store formulas as readable expressions in the result, not just final values.
```

### 4.6 Reasoning Log (reasoningLog.ts)

```
Tasks:
generateReasoningLog(result: Partial<DiagnosticResult>,
                     engagement: Engagement): Promise<ReasoningEntry[]>

For each output type, generate a ReasoningEntry:

SCORE entries (one per domain):
  Call Claude API with:
    - Domain name and final score
    - Top 3 questions dragging the score down (lowest weighted scores)
    - Top 2 questions performing well (highest weighted scores)
    - Engagement confidence level
  Prompt: generate 2-sentence plain language explanation
  Store contributing factors with weights

PATTERN entries (one per fired pattern):
  Call Claude API with:
    - Pattern name and description
    - Evidence question texts and actual scores
    - Expected vs actual contrast (for CONTRAST patterns)
  Prompt: generate 2-sentence explanation of why this pattern fired
  
ROOT CAUSE entries (one per root cause):
  Call Claude API with:
    - Root cause name
    - All evidence (question texts + scores)
    - Industry context from engagement
  Prompt: generate 3-sentence explanation:
    sentence 1: what the data shows
    sentence 2: what this typically means in practice
    sentence 3: why it matters for this business

ROADMAP entries (one per roadmap item):
  Call Claude API with:
    - Roadmap item title and description
    - Root causes it addresses (names only)
    - Why this phase (30/60/90) — the sequencing logic
  Prompt: generate 2-sentence explanation:
    sentence 1: why this action (traces to root cause)
    sentence 2: why this timing (prerequisite logic)

BUSINESS CASE entries (one per value tier):
  Format the formula as readable text with actual numbers substituted
  No Claude API call needed — purely deterministic formatting

Batch Claude API calls: max 5 concurrent, use Promise.allSettled
If Claude API fails for any entry: use the rule's explanationTemplate as fallback
Total reasoning log should not exceed 40 entries per engagement
```

### 4.7 Diagnostic Orchestrator

```
Tasks:
Create engine/index.ts — the main entry point called by the API route:

async function runDiagnostic(engagementId: string): Promise<DiagnosticResult>
  1. Load engagement, answers, questions, rules
  2. Validate: all domains have at least 80% questions answered
  3. Run scoring pipeline → domainScores
  4. Run pattern matcher → patterns
  5. Run root cause generator → rootCauses
  6. Run roadmap builder → roadmap
  7. Run business case calculator → businessCase
  8. Run reasoning log generator → reasoningLog (async, awaited)
  9. Compose DiagnosticResult, save to DB
  10. Return result

Idempotent: if result already exists for this engagementId,
  return cached result (don't re-run engine)
  Add forceRerun: boolean param to override this
```

### Phase 4 Acceptance Criteria

```
[ ] POST /api/engagements/:id/diagnose returns complete DiagnosticResult
[ ] Domain scores are mathematically correct (verify manually with known inputs)
[ ] Pattern matching: siloed-systems pattern fires when expected, doesn't fire when not
[ ] At least 3 root causes generated for a realistic test session
[ ] Roadmap has items in all three phases (30/60/90)
[ ] Business case numbers scale with company size (small ≠ large company output)
[ ] Reasoning log has an entry for every root cause and roadmap item
[ ] All reasoning entries trace back to specific questionIds
[ ] Engine is idempotent (running twice returns same result)
[ ] Claude API failure falls back gracefully (explanationTemplate used)
[ ] Full diagnostic completes in under 15 seconds
```

---

## Phase 5 — Output & Report

**Goal:** The consultant can present all findings in a polished, fully interactive output
UI and export a branded PDF report with complete reasoning appendix.

**Prerequisites:** Phase 4 complete. DiagnosticResult record exists in DB.

### 5.1 Output Navigation

```
Tasks:
- OutputPage is a tabbed container — 5 tabs always visible:
    Diagnosis | Intervention Map | Roadmap | Business Case | Reasoning Log
- Each tab loads its data independently via React Query
- Tab state in URL: /output/:id?tab=diagnosis
- Print/Export button always visible in header
- Consultant can add a "session note" at the top of any tab
  (rich text, 500 char max, persisted to DB, appears in PDF)
```

### 5.2 DiagnosisPage

```
Tasks:
- Hero section: overall maturity summary across all domains
  (not a single score — a domain-by-domain bar chart)
- Root cause cards (RootCauseCard component):
    Each card: severity badge, root cause name, description
    "Evidence" expandable section:
      Lists each evidence question with its text + score + anchor label
      "This question scored 2/5: {anchor label for 2}"
    "Why this matters" section: the Claude-generated explanation
    Tags: affected domain, intervention tier, severity
- Cards sorted by severity
- "Show all patterns" link → expands to show all 9 patterns with fired/not fired status
  (transparency for the consultant — show what didn't fire too)
```

### 5.3 InterventionMap (HeatMap component)

```
Tasks:
Full D3 implementation of the domain × intervention type heat map:
- X axis: 6 intervention types (Process / Digitize / Integrate / Automate / Analytics / AI)
- Y axis: in-scope domains (4-8)
- Cells: colour-coded by score (red → amber → green)
- Cell click: drawer opens showing which questions produced that cell's score
- Legend: score ranges + colour scale
- Summary row at bottom: column averages
- "Sequencing view" toggle: overlays recommended sequence (numbered badges on cells)

This is the single most impactful visual in the report.
Invest accordingly.
```

### 5.4 RoadmapPage

```
Tasks:
- Three-column layout: 30 Days | 60 Days | 90 Days
- Each column: RoadmapColumn component
- Each action card (within RoadmapColumn):
    Title (bold, action-oriented)
    Intervention type badge (colour-coded)
    Root causes addressed (linked — click shows root cause card)
    Expected outcome
    Estimated effort chip (Days / Weeks / Months)
    Prerequisite indicator: "Requires: {prerequisite item title}"
    "Why now?" expandable: the reasoning log entry for timing
- Column summary: total items, dominant intervention type
- Dependencies view toggle: shows prerequisite chains as a simple flow diagram
```

### 5.5 BusinessCasePage

```
Tasks:
- Three-section layout:
    SECTION 1 — Problem Cost
      Per domain: estimated annual cost of current state
      Show formula + inputs + result (all three visible)
      Total across all in-scope domains

    SECTION 2 — Intervention Value by Tier
      Stacked bar chart: Tier 0-1 / Tier 2 / Tier 3 value
      Conservative vs Realistic ranges (toggle)
      Formula visible below chart: all inputs shown
      
    SECTION 3 — Priority Matrix
      Bubble chart: x=Feasibility, y=Revenue Impact, size=Data Readiness
      Each bubble = one roadmap initiative
      Quadrant labels: Quick Wins / Strategic Bets / Fill-Ins / Avoid
      Click bubble → initiative detail drawer

- All input assumptions visible and editable by consultant
  (if consultant changes a number, business case recalculates live)
- "Assumption footnotes" section at bottom
```

### 5.6 ReasoningPage

```
Tasks:
- Full reasoning log in a structured, readable format
- Grouped by output type: Scores → Patterns → Root Causes → Roadmap → Business Case
- Each entry:
    Output item name (linked to the relevant tab)
    Plain language explanation (the Claude-generated text)
    Contributing factors table:
      | Factor | Question | Score | Weight | Impact Direction |
    "Evidence chain" — the full path from question → pattern → root cause → action
- Search/filter bar: filter by domain, by output type, by root cause
- This is the consultant's "working notes" view
- In PDF: this becomes the appendix
```

### 5.7 ReasoningDrawer Component

```
Tasks:
- Slide-out drawer (right side, 480px wide) available on any output screen
- Triggered by clicking any score, root cause name, or roadmap item
- Shows: the specific reasoning entry for that item
- Consultant mode only
- Keyboard shortcut: Cmd/Ctrl + E to toggle
- Contains: explanation text + contributing factors + "View in Reasoning Log" link
```

### 5.8 PDF Export

```
Tasks (server-side, Puppeteer):
- POST /api/engagements/:id/export → returns PDF buffer

Report structure (pages in order):
  Page 1: Cover — client name, engagement name, date, mindssparc branding
  Page 2: Setup Configuration — the SetupSummary content (what was configured and why)
  Page 3-4: Executive Summary — Claude-generated 4-paragraph narrative
  Page 5-6: Diagnosis — root cause cards (2 per page)
  Page 7: Intervention Heat Map — D3 chart rendered server-side
  Page 8-9: 30/60/90 Roadmap — 3 column layout
  Page 10-11: Business Case — problem cost + value tiers + priority matrix
  Page 12+: Reasoning Appendix — full reasoning log (condensed format)

Implementation:
  - Puppeteer launches headless Chrome
  - Navigate to /report/:id (a special non-interactive report-only route)
  - /report/:id renders all sections in print-optimised layout
  - PDF generated with: A4, margins 20mm, print CSS media query
  - Custom fonts embedded (not system fonts)
  - Charts render as SVG (not canvas) for PDF fidelity

Print CSS rules (in report route only):
  - No interactive elements
  - No hover states
  - Page break before each major section
  - Colour preserved (not greyscale)
  - mindssparc logo in header, page numbers in footer
```

### Phase 5 Acceptance Criteria

```
[ ] All 5 output tabs render without errors
[ ] DiagnosisPage: all root causes shown with evidence expandable
[ ] HeatMap: all cells coloured correctly, click opens drawer with question detail
[ ] RoadmapPage: prerequisite chains visible, "Why now?" explanations present
[ ] BusinessCasePage: formula inputs visible, live recalculation works
[ ] ReasoningPage: full log searchable, all entries present
[ ] ReasoningDrawer: opens on any score/finding click, correct entry shown
[ ] PDF export: generates clean A4 PDF, all sections present, fonts embedded
[ ] PDF reasoning appendix includes all reasoning entries
[ ] Consultant annotations appear in correct sections of the PDF
[ ] Export completes in under 30 seconds
```

---

## Phase 6 — Question Bank & Polish

**Goal:** A complete, high-quality question bank covering all 8 domains, a full
design pass producing a premium consulting-grade UI, and all edge cases handled.

**Prerequisites:** Phase 5 complete and validated with real test sessions.

### 6.1 Complete Question Bank

```
Tasks:
Expand from 20 (CRV only) to ~200 questions across all 8 domains.

Per domain target:
  CRV — Customer & Revenue:       25 questions (5 already done, add 5)
  MKT — Marketing & Demand:       22 questions
  SVC — Service & Retention:      22 questions
  OPS — Operations & Fulfillment: 28 questions (largest domain)
  PPL — People & Organisation:    20 questions
  FIN — Finance & Risk:           22 questions
  TEC — Technology & Data:        25 questions
  PRD — Product & Innovation:     22 questions

Quality rules for each question:
  - Passes the "field sales agent" test: behavioural, observable, specific
  - preAnswerContext explains the diagnostic value in plain language
  - All 5 scale anchors describe observable behaviours (not vague adjectives)
  - interventionSignal is the primary signal (not a hedge — commit to one)
  - diagnosticPatterns references at least 1 pattern from rules.json
  - No two questions in the same domain are too similar (>70% semantic overlap = reject)

Question review process:
  After generating each domain's questions, run validateQuestionBank()
  Fix all validation errors before proceeding to next domain
```

### 6.2 Additional Diagnostic Rules

```
Tasks:
Expand rules.json from 9 to 18 rules based on patterns observed in question bank:

Add per domain (examples):
  tech-debt-blocker:     TEC questions reveal infrastructure preventing change
  reporting-theatre:     FIN/MKT — lots of reports, no action taken from them
  talent-constraint:     PPL — processes depend on specific individuals
  supplier-opacity:      OPS — external dependencies with no visibility
  customer-data-gap:     CRV/SVC — interactions not captured, insights lost
  compliance-drag:       FIN/PRD — regulatory requirements slowing everything down
  product-market-drift:  PRD — product decisions not connected to customer signal
  retention-blindspot:   SVC — churn happens before it's visible in data

Each new rule follows the same schema as the seed rules.
Run a full test session after adding each rule to verify it fires correctly.
```

### 6.3 Full Design Pass

```
Tasks (follow SKILL-frontend-design.md throughout):

Typography:
  - Select and import display font (editorial serif — consider Playfair Display,
    Cormorant Garamond, or DM Serif Display)
  - Select body font (clean sans — consider DM Sans, Plus Jakarta Sans, or Outfit)
  - Implement full type scale in tailwind.config.ts
  - Apply consistently across all pages

Colour refinement:
  - Confirm accent colour (amber recommended — warm, trustworthy, not corporate)
  - Domain colours: 8 distinct, accessible, not primary colours
  - Severity colours: critical (deep red), high (amber), medium (blue), low (slate)
  - Data visualisation colours: diverging scale for heat map, sequential for scores

Component polish (each component):
  - ScoreCard: subtle shadow, maturity band colour bar, hover state
  - QuestionCard: generous padding, clear visual hierarchy, smooth anchor selection
  - RootCauseCard: severity colour in left border, clean evidence table
  - RoadmapColumn: card hover lift, prerequisite connector lines
  - WeightSlider: custom thumb, live number animation, colour per intervention type
  - HeatMap: smooth colour transitions, tooltip on hover, cell click animation

Motion:
  - Score reveal: count-up animation from 0 to final score (800ms, easing)
  - RootCause cards: staggered entrance (50ms delay between cards)
  - Tab transitions: 200ms fade
  - Drawer: 250ms slide-in from right
  - HeatMap cells: 400ms fill-in on load (staggered by column)

Responsive considerations:
  - SessionPage: works on tablet (consultant may use iPad in session)
  - OutputPage: works on laptop minimum — desktop preferred
  - PDF: A4 only, not responsive
  - Dashboard: works on any screen

Empty states:
  - No engagements yet
  - Session incomplete (diagnosed before all questions answered)
  - No patterns fired (healthy result — show positively)
  - Export failed

Error states:
  - API unreachable: "Connection issue — your answers are saved locally"
  - Claude API failure: graceful fallback to template text (no user-visible error)
  - Invalid session token: redirect to login with return URL preserved
```

### 6.4 Consultant Annotation System

```
Tasks:
- Consultant can add notes to any of these:
    - Individual answers (e.g. "client was uncertain here — revisit")
    - Root cause cards (e.g. "confirmed by operations lead verbally")
    - Roadmap items (e.g. "client has budget for this already")
    - Business case assumptions (e.g. "revenue figure verified from annual report")
- Annotations stored in DB, linked by type + item ID
- Annotations appear:
    - Inline in the output UI (italic, consultant-badge)
    - In the PDF (same inline placement, clearly marked)
    - In the reasoning log (separate "Consultant Notes" section)
- Annotations do not affect scoring or diagnostic logic
```

### 6.5 Final Integration & Edge Cases

```
Tasks:
- Session with only 2 domains in scope (minimum) — verify all outputs sensible
- Session where all scores are high — verify "no major issues" output is positive
- Session where all scores are low — verify foundation-gap pattern fires correctly
- Session paused and resumed on different device — verify state transfer
- PDF export at max report length (~20 root causes, all 8 domains) — verify no timeout
- Consultant overrides a score — verify reasoning log reflects override with note
- Multiple consultants in same firm — verify engagement isolation (no data leakage)
- Run engine on same engagement twice — verify idempotency
- Question bank validation: run validateQuestionBank() — zero errors required
```

### Phase 6 Acceptance Criteria

```
[ ] All 8 domains have questions (total 185-210 questions)
[ ] validateQuestionBank() passes with zero errors
[ ] 18 diagnostic rules in rules.json, all tested
[ ] Full design pass complete — no default Tailwind aesthetics visible
[ ] Typography: display + body fonts loaded, consistent across all pages
[ ] All animations implemented and smooth (no jank)
[ ] Responsive: SessionPage usable on tablet
[ ] All empty states designed and implemented
[ ] All error states handled gracefully
[ ] Annotation system works end-to-end including in PDF
[ ] All edge case scenarios pass
[ ] End-to-end test session (real questions, real answers, real output) produces
    credible, explainable results that could be presented to a real client
```

---

## Cross-Phase Conventions

### Code Style
- TypeScript strict mode on everywhere
- No `any` types — if you don't know the type, define it in shared-types
- All async functions have explicit return types
- Error handling: never swallow errors silently — log + rethrow or handle explicitly
- No inline magic numbers — use constants from lib/constants.ts

### API Conventions
- All responses: `{ data: T, error: null }` on success, `{ data: null, error: string }` on failure
- All list endpoints: `{ data: { items: T[], total: number } }`
- HTTP status codes: 200 success, 201 created, 400 validation, 401 auth, 404 not found, 500 server error
- All timestamps: ISO 8601 strings (not Unix timestamps)

### Testing Approach
- No unit test framework required for Phase 1-5 (speed > coverage at this stage)
- Engine functions: test manually with known inputs + expected outputs after each phase
- validateQuestionBank(): runs on API startup, fails loudly if any question is malformed
- Phase 6: add integration tests for the full diagnostic pipeline

### Git Conventions
- Branch per phase: `phase/1-foundation`, `phase/2-setup`, etc.
- Commit messages: `[Phase N] description of what was done`
- Never commit .env files or *.db files

---

*This document is the execution plan for the mindssparc AI Assessment Portal.
Read CLAUDE.md for architectural decisions. This file is about how to build it.*
