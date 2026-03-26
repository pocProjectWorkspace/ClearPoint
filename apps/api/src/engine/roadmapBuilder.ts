import type { InterventionType, Domain } from '@mindssparc/shared-types'
import type { RootCauseResult } from './rootCauseGenerator'

type EngagementLike = {
  industry: string
  companySize: string
}

export type RoadmapItemResult = {
  id: string
  phase: 30 | 60 | 90
  title: string
  description: string
  rootCauseIds: string[]
  questionIds: string[]
  interventionType: InterventionType
  estimatedEffort: 'days' | 'weeks' | 'months'
  expectedOutcome: string
  prerequisiteIds: string[]
}

// Action templates by recommended action ID
const ACTION_TEMPLATES: Record<string, {
  title: string
  description: string
  effort: 'days' | 'weeks' | 'months'
  outcome: string
  type: InterventionType
}> = {
  // Process discovery (30-day)
  'process-discovery-workshop': {
    title: 'Run process discovery workshops for undocumented workflows',
    description: 'Facilitate 2-day workshops with team leads to map current-state workflows, identify handoff points, and document decision criteria that currently exist only in people\'s heads.',
    effort: 'days',
    outcome: 'Complete process maps for all critical workflows with identified gaps and owners.',
    type: 'PROCESS',
  },
  'define-minimum-viable-process': {
    title: 'Define minimum viable process for each dark workflow',
    description: 'For each undocumented workflow identified, establish a lightweight written process with clear steps, roles, and escalation paths. Keep it simple — the goal is visibility, not perfection.',
    effort: 'days',
    outcome: 'Documented processes with assigned owners for all previously invisible workflows.',
    type: 'PROCESS',
  },
  'establish-core-processes': {
    title: 'Establish core operational processes with clear ownership',
    description: 'Define and assign ownership for the fundamental operational processes. Start with the 5 highest-volume workflows and work outward.',
    effort: 'weeks',
    outcome: 'Core processes documented, owners assigned, and initial compliance baseline established.',
    type: 'PROCESS',
  },
  'standardise-process-execution': {
    title: 'Standardise process execution across teams and locations',
    description: 'Identify the best-performing team or location for each process and adopt their approach as the standard. Roll out with clear checklists and compliance checks.',
    effort: 'weeks',
    outcome: 'Reduced variance in process execution with measurable consistency improvements.',
    type: 'PROCESS',
  },
  'map-approval-chains': {
    title: 'Map and simplify approval chains',
    description: 'Document every approval step in high-volume processes. Classify each as essential, redundant, or automatable. Remove redundant steps and set thresholds for auto-approval.',
    effort: 'days',
    outcome: 'Approval steps reduced by 30-50% with clear auto-approval thresholds defined.',
    type: 'PROCESS',
  },

  // Data and integration (30-60 day)
  'implement-basic-data-capture': {
    title: 'Implement basic data capture for currently untracked workflows',
    description: 'For each newly documented process, add minimum viable data capture at key decision points. Use existing tools where possible — spreadsheets are acceptable as a start.',
    effort: 'weeks',
    outcome: 'Data capture in place for all critical workflows, enabling measurement and future automation.',
    type: 'DIGITIZE',
  },
  'data-quality-audit': {
    title: 'Conduct data quality audit across key systems',
    description: 'Audit the top 5 data sources used in decision-making. Measure completeness, accuracy, timeliness, and consistency. Publish a data quality scorecard.',
    effort: 'weeks',
    outcome: 'Data quality scorecard published with remediation priorities identified.',
    type: 'DIGITIZE',
  },
  'establish-data-ownership': {
    title: 'Assign data ownership and stewardship roles',
    description: 'For each critical data domain, assign an owner accountable for quality and a steward responsible for day-to-day maintenance.',
    effort: 'days',
    outcome: 'Clear accountability for data quality with named owners and documented responsibilities.',
    type: 'DIGITIZE',
  },
  'integrate-core-systems': {
    title: 'Integrate core systems to enable cross-functional data flow',
    description: 'Build API connections or data pipelines between the top 3 siloed systems. Start with read-only integrations to reduce risk.',
    effort: 'months',
    outcome: 'Cross-system data visibility for key operational metrics without manual data transfer.',
    type: 'INTEGRATE',
  },
  'build-unified-data-layer': {
    title: 'Build a unified data layer for cross-functional reporting',
    description: 'Create a central data repository or warehouse that aggregates data from integrated systems. Start with the metrics that matter most to leadership.',
    effort: 'months',
    outcome: 'Single source of truth for cross-functional KPIs accessible to all stakeholders.',
    type: 'INTEGRATE',
  },
  'map-cross-functional-data-flows': {
    title: 'Map cross-functional data flows and identify integration gaps',
    description: 'Document how data moves between teams and systems. Identify where manual handoffs, email-based transfers, or re-keying occur.',
    effort: 'days',
    outcome: 'Complete data flow map with prioritised integration opportunities.',
    type: 'INTEGRATE',
  },

  // Automation (60-day)
  'codify-decision-rules': {
    title: 'Codify decision rules for high-volume approval processes',
    description: 'Work with subject matter experts to convert their decision criteria into explicit rules. Document exceptions and escalation triggers.',
    effort: 'weeks',
    outcome: 'Decision rules documented and validated, ready for automation implementation.',
    type: 'AUTOMATE',
  },
  'implement-rules-based-automation': {
    title: 'Implement rules-based automation for codified decisions',
    description: 'Using the documented decision rules, build automated approval workflows for cases that meet defined criteria. Keep human oversight for exceptions.',
    effort: 'weeks',
    outcome: 'Automated processing for standard cases with measurable reduction in turnaround time.',
    type: 'AUTOMATE',
  },
  'identify-automation-candidates': {
    title: 'Identify and prioritise automation candidates',
    description: 'Score each manual process on volume, repeatability, rule-based logic, and current error rate. Rank by automation ROI.',
    effort: 'days',
    outcome: 'Prioritised automation backlog with ROI estimates for top 5 candidates.',
    type: 'AUTOMATE',
  },
  'implement-compliance-monitoring': {
    title: 'Implement automated compliance monitoring',
    description: 'Set up automated checks against process standards. Flag deviations in real-time rather than catching them in retrospective audits.',
    effort: 'weeks',
    outcome: 'Real-time compliance visibility with automated deviation alerts.',
    type: 'AUTOMATE',
  },
  'identify-best-practice-pockets': {
    title: 'Identify best-practice pockets and scale them',
    description: 'Find teams or individuals consistently outperforming. Document their approach and create scalable playbooks.',
    effort: 'days',
    outcome: 'Best practices captured and shared across teams with adoption tracking.',
    type: 'PROCESS',
  },
  'implement-data-freshness-monitoring': {
    title: 'Implement automated data freshness monitoring',
    description: 'Set up alerts for data staleness in critical systems. Define SLAs for data refresh rates.',
    effort: 'weeks',
    outcome: 'Automated data freshness monitoring with SLA tracking.',
    type: 'AUTOMATE',
  },
  'build-rpa-business-case': {
    title: 'Build automation business case with pilot scope',
    description: 'Quantify the time and cost of manual processes identified as automation candidates. Define a pilot scope that delivers measurable results in 60 days.',
    effort: 'days',
    outcome: 'Approved automation business case with defined pilot scope and success metrics.',
    type: 'AUTOMATE',
  },
  'pilot-first-automation': {
    title: 'Pilot first automation with measurable outcomes',
    description: 'Implement the highest-priority automation candidate as a pilot. Measure throughput improvement, error reduction, and time savings.',
    effort: 'weeks',
    outcome: 'First automation live with documented ROI to support scaling decision.',
    type: 'AUTOMATE',
  },
  'defer-advanced-technology-initiatives': {
    title: 'Pause advanced technology initiatives until foundations are solid',
    description: 'Review all in-flight analytics and AI initiatives. Pause those that depend on process or data foundations that are not yet in place. Redirect budget to foundational work.',
    effort: 'days',
    outcome: 'Technology investment aligned with actual readiness, reducing wasted spend.',
    type: 'PROCESS',
  },

  // Analytics (90-day)
  'link-dashboards-to-decisions': {
    title: 'Link dashboards to specific decision points and owners',
    description: 'For each dashboard or report, define the specific decisions it should inform, who makes those decisions, and what action they should take based on the data.',
    effort: 'weeks',
    outcome: 'Every dashboard tied to a named decision-maker with clear action triggers.',
    type: 'ANALYTICS',
  },
  'establish-insight-to-action-workflows': {
    title: 'Establish insight-to-action workflows',
    description: 'Create automated workflows that trigger actions when key metrics cross defined thresholds. Close the loop between data and operational response.',
    effort: 'months',
    outcome: 'Automated insight-to-action loops for top priority metrics.',
    type: 'ANALYTICS',
  },
  'define-decision-rights-per-metric': {
    title: 'Define decision rights per metric',
    description: 'For each KPI, document who can act on it, what actions are authorised, and what requires escalation.',
    effort: 'days',
    outcome: 'Clear decision rights matrix linking metrics to authorised actions.',
    type: 'ANALYTICS',
  },

  // AI (90-day)
  'define-ai-use-case-scope': {
    title: 'Define and validate AI use case scope',
    description: 'Document the specific judgment-at-scale problem to be addressed. Define what "good" looks like, what training data is available, and what human oversight is needed.',
    effort: 'weeks',
    outcome: 'Validated AI use case with clear scope, data requirements, and success criteria.',
    type: 'AI',
  },
  'assess-training-data-availability': {
    title: 'Assess training data availability and quality',
    description: 'Audit the data that would feed an AI model. Evaluate volume, quality, labelling, bias risks, and gaps. Define what data preparation is needed.',
    effort: 'weeks',
    outcome: 'Data readiness assessment with gap remediation plan.',
    type: 'AI',
  },
  'build-ai-pilot-with-human-oversight': {
    title: 'Design AI pilot with human-in-the-loop oversight',
    description: 'Scope a controlled pilot where AI assists human decision-making rather than replacing it. Define metrics, monitoring, and rollback criteria.',
    effort: 'months',
    outcome: 'AI pilot design complete with human oversight framework and go/no-go criteria.',
    type: 'AI',
  },
}

const PHASE_MAP: Record<InterventionType, 30 | 60 | 90> = {
  'PROCESS': 30,
  'DIGITIZE': 30,
  'INTEGRATE': 60,
  'AUTOMATE': 60,
  'ANALYTICS': 90,
  'AI': 90,
}

export function buildRoadmap(
  rootCauses: RootCauseResult[],
  engagement: EngagementLike
): RoadmapItemResult[] {
  if (rootCauses.length === 0) return []

  const items: RoadmapItemResult[] = []
  const timestamp = Date.now()
  let counter = 0

  for (const rc of rootCauses) {
    for (const actionId of rc.recommendedActions) {
      const template = ACTION_TEMPLATES[actionId]
      if (!template) continue

      counter++
      const phase = PHASE_MAP[template.type] || 60

      // Severity override: critical/high process issues → 30 day regardless
      const adjustedPhase: 30 | 60 | 90 =
        (rc.severity === 'critical' || rc.severity === 'high') && (template.type === 'PROCESS' || template.type === 'DIGITIZE')
          ? 30
          : phase

      items.push({
        id: `ri-${counter}-${timestamp}`,
        phase: adjustedPhase,
        title: template.title,
        description: template.description,
        rootCauseIds: [rc.id],
        questionIds: rc.evidenceQuestionIds,
        interventionType: template.type,
        estimatedEffort: template.effort,
        expectedOutcome: template.outcome,
        prerequisiteIds: [], // filled in below
      })
    }
  }

  // Ensure every phase has at least one action — add strategic 90-day items if missing
  const has90 = items.some(i => PHASE_MAP[i.interventionType] === 90 || i.interventionType === 'ANALYTICS' || i.interventionType === 'AI')
  if (!has90 && rootCauses.length > 0) {
    // Add analytics actions based on the root causes found
    const topRc = rootCauses[0]
    const analytics90Actions = [
      'link-dashboards-to-decisions',
      'establish-insight-to-action-workflows',
      'define-decision-rights-per-metric',
    ]
    for (const actionId of analytics90Actions) {
      const template = ACTION_TEMPLATES[actionId]
      if (!template) continue
      counter++
      items.push({
        id: `ri-${counter}-${timestamp}`,
        phase: 90,
        title: template.title,
        description: template.description,
        rootCauseIds: [topRc.id],
        questionIds: topRc.evidenceQuestionIds.slice(0, 3),
        interventionType: template.type,
        estimatedEffort: template.effort,
        expectedOutcome: template.outcome,
        prerequisiteIds: [],
      })
    }
  }

  // Deduplicate by title
  const deduped = new Map<string, RoadmapItemResult>()
  for (const item of items) {
    const existing = deduped.get(item.title)
    if (existing) {
      existing.rootCauseIds = [...new Set([...existing.rootCauseIds, ...item.rootCauseIds])]
      existing.questionIds = [...new Set([...existing.questionIds, ...item.questionIds])]
    } else {
      deduped.set(item.title, item)
    }
  }

  const dedupedItems = [...deduped.values()]

  // Build prerequisite chains
  const phase30Items = dedupedItems.filter(i => i.phase === 30)
  const phase60Items = dedupedItems.filter(i => i.phase === 60)
  const phase90Items = dedupedItems.filter(i => i.phase === 90)

  // Every 60-day item gets prerequisite(s) from 30-day items that share root causes
  for (const item60 of phase60Items) {
    const prereqs = phase30Items.filter(i30 =>
      i30.rootCauseIds.some(rc => item60.rootCauseIds.includes(rc))
    )
    item60.prerequisiteIds = prereqs.length > 0
      ? prereqs.map(p => p.id)
      : phase30Items.length > 0 ? [phase30Items[0].id] : [] // fallback to first 30-day item
  }

  // Every 90-day item gets prerequisite(s) from 60-day items that share root causes
  for (const item90 of phase90Items) {
    const prereqs = phase60Items.filter(i60 =>
      i60.rootCauseIds.some(rc => item90.rootCauseIds.includes(rc))
    )
    item90.prerequisiteIds = prereqs.length > 0
      ? prereqs.map(p => p.id)
      : phase60Items.length > 0 ? [phase60Items[0].id] : []
  }

  return dedupedItems
}
