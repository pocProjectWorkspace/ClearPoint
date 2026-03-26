export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`
}

export function formatCurrency(value: number): string {
  // Backend values are already in millions (revenue midpoints are in $M)
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}B`
  if (value >= 1) return `$${value.toFixed(1)}M`
  if (value >= 0.001) return `$${(value * 1000).toFixed(0)}K`
  return `$${(value * 1_000_000).toFixed(0)}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
