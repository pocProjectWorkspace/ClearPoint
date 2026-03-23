type HeatMapProps = {
  className?: string
}

export default function HeatMap({ className = '' }: HeatMapProps) {
  return (
    <div className={`rounded-lg border border-navy-100 bg-white p-6 ${className}`}>
      <p className="font-body text-body-md text-navy-500">Intervention heat map — D3 visualisation placeholder</p>
    </div>
  )
}
