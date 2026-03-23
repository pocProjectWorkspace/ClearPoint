import type { Domain, InterventionWeights } from './index'

export type IndustryTemplate = {
  key: string
  name: string
  description: string
  domainsInScope: Domain[]
  domainOrder: Domain[]
  interventionWeights: InterventionWeights
  rationale: string
}

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    key: 'financial_services',
    name: 'Financial Services',
    description: 'Banks, insurers, asset managers — regulatory compliance, relationship management, operational efficiency',
    domainsInScope: ['CRV', 'SVC', 'FIN', 'TEC'],
    domainOrder: ['FIN', 'CRV', 'SVC', 'TEC'],
    interventionWeights: { process: 30, automation: 35, analytics: 20, ai: 15 },
    rationale: 'Financial services organisations typically have defined processes but significant automation debt and regulatory reporting burden.',
  },
  {
    key: 'manufacturing',
    name: 'Manufacturing & Industrial',
    description: 'Discrete or process manufacturers — supply chain, quality, production efficiency, maintenance',
    domainsInScope: ['OPS', 'PRD', 'FIN', 'TEC'],
    domainOrder: ['OPS', 'PRD', 'TEC', 'FIN'],
    interventionWeights: { process: 25, automation: 40, analytics: 25, ai: 10 },
    rationale: 'Manufacturing organisations benefit most from automation and analytics before AI — data capture is often the primary gap.',
  },
  {
    key: 'professional_services',
    name: 'Professional Services',
    description: 'Consulting, legal, accounting — talent utilisation, client delivery, knowledge management',
    domainsInScope: ['CRV', 'PPL', 'SVC', 'FIN'],
    domainOrder: ['PPL', 'CRV', 'SVC', 'FIN'],
    interventionWeights: { process: 35, automation: 25, analytics: 25, ai: 15 },
    rationale: 'Professional services firms are people-intensive — talent and client management are the primary value drivers.',
  },
  {
    key: 'technology',
    name: 'Technology & SaaS',
    description: 'Software, platforms, digital products — growth, retention, product-market fit, technical scalability',
    domainsInScope: ['CRV', 'PRD', 'MKT', 'TEC'],
    domainOrder: ['PRD', 'CRV', 'MKT', 'TEC'],
    interventionWeights: { process: 15, automation: 25, analytics: 30, ai: 30 },
    rationale: 'Technology companies often have good data infrastructure but underuse it — analytics and AI have higher immediate payoff.',
  },
  {
    key: 'retail_distribution',
    name: 'Retail & Distribution',
    description: 'Retailers, wholesalers, distributors — demand forecasting, inventory, fulfilment, customer experience',
    domainsInScope: ['OPS', 'CRV', 'MKT', 'SVC'],
    domainOrder: ['OPS', 'CRV', 'MKT', 'SVC'],
    interventionWeights: { process: 20, automation: 35, analytics: 30, ai: 15 },
    rationale: 'Retail and distribution companies have high transaction volumes and benefit significantly from automation and demand analytics.',
  },
]
