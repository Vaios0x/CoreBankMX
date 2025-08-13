type SparklineProps = {
  values: number[]
  width?: number
  height?: number
  stroke?: string
  fill?: string
}

export function Sparkline({ values, width = 240, height = 48, stroke = 'currentColor', fill = 'none' }: SparklineProps) {
  if (!values || values.length === 0) {
    return <svg width={width} height={height} aria-hidden />
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = width / Math.max(values.length - 1, 1)
  const points = values.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  })
  const d = `M ${points.join(' L ')}`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="text-brand-600" role="img" aria-label="Sparkline">
      <path d={d} fill={fill} stroke={stroke} strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export default Sparkline


