type ScoreCardProps = {
  domain: string
  score: number
  maturityLabel: string
  className?: string
}

export default function ScoreCard({ domain, score, maturityLabel, className = '' }: ScoreCardProps) {
  return (
    <div className={`rounded-lg border border-navy-100 bg-white p-6 ${className}`}>
      <h3 className="font-display text-display-sm text-navy-900">{domain}</h3>
      <p className="mt-2 font-mono text-display-md text-navy-800">{score.toFixed(0)}</p>
      <p className="mt-1 font-body text-body-sm text-navy-500">{maturityLabel}</p>
    </div>
  )
}
