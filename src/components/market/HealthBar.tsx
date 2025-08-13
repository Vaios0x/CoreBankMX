export function HealthBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value * 100))
  const color = value < 1.2 ? 'bg-red-500' : value < 1.5 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className="h-3 w-full rounded bg-gray-800" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-3 rounded ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default HealthBar


