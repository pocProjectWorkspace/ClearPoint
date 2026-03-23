import type { ReactNode } from 'react'

type RoadmapColumnProps = {
  phase: 30 | 60 | 90
  children?: ReactNode
  className?: string
}

export default function RoadmapColumn({ phase, children, className = '' }: RoadmapColumnProps) {
  return (
    <div className={`flex-1 ${className}`}>
      <h3 className="font-display text-display-sm text-navy-900">{phase}-day</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  )
}
