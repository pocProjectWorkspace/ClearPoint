type WeightSliderProps = {
  label: string
  value: number
  onChange: (value: number) => void
  className?: string
}

export default function WeightSlider({ label, value, onChange, className = '' }: WeightSliderProps) {
  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between">
        <label className="font-body text-body-md text-navy-800">{label}</label>
        <span className="font-mono text-body-sm text-navy-600">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full"
      />
    </div>
  )
}
