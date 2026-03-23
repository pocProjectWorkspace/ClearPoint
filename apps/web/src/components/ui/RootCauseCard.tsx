type RootCauseCardProps = {
  name: string
  description: string
  severity: string
  className?: string
}

export default function RootCauseCard({ name, description, severity, className = '' }: RootCauseCardProps) {
  return (
    <div className={`rounded-lg border border-navy-100 bg-white p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-display-sm text-navy-900">{name}</h3>
        <span className="font-body text-body-xs uppercase tracking-wide text-navy-500">{severity}</span>
      </div>
      <p className="mt-3 font-body text-body-md text-navy-700">{description}</p>
    </div>
  )
}
