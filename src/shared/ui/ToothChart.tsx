type ToothChartProps = {
  selectedFdiNumbers: Set<number>
  segmentedFdiNumbers?: Set<number>
  onToothClick: (toothNum: number) => void
}

const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

const upperPositions = [
  { cx: 38, cy: 50, rx: 13, ry: 18 },
  { cx: 84, cy: 67, rx: 14, ry: 20 },
  { cx: 131, cy: 82, rx: 14, ry: 20 },
  { cx: 176, cy: 94, rx: 12, ry: 15 },
  { cx: 219, cy: 103, rx: 11, ry: 14 },
  { cx: 258, cy: 109, rx: 10, ry: 13 },
  { cx: 295, cy: 113, rx: 9, ry: 12 },
  { cx: 330, cy: 116, rx: 10, ry: 14 },
  { cx: 370, cy: 116, rx: 10, ry: 14 },
  { cx: 405, cy: 113, rx: 9, ry: 12 },
  { cx: 442, cy: 109, rx: 10, ry: 13 },
  { cx: 481, cy: 103, rx: 11, ry: 14 },
  { cx: 524, cy: 94, rx: 12, ry: 15 },
  { cx: 569, cy: 82, rx: 14, ry: 20 },
  { cx: 616, cy: 67, rx: 14, ry: 20 },
  { cx: 662, cy: 50, rx: 13, ry: 18 },
]

const lowerPositions = [
  { cx: 38, cy: 228, rx: 13, ry: 18 },
  { cx: 84, cy: 211, rx: 14, ry: 20 },
  { cx: 131, cy: 196, rx: 14, ry: 20 },
  { cx: 176, cy: 184, rx: 12, ry: 15 },
  { cx: 219, cy: 175, rx: 11, ry: 14 },
  { cx: 258, cy: 169, rx: 10, ry: 13 },
  { cx: 295, cy: 165, rx: 9, ry: 12 },
  { cx: 330, cy: 162, rx: 10, ry: 14 },
  { cx: 370, cy: 162, rx: 10, ry: 14 },
  { cx: 405, cy: 165, rx: 9, ry: 12 },
  { cx: 442, cy: 169, rx: 10, ry: 13 },
  { cx: 481, cy: 175, rx: 11, ry: 14 },
  { cx: 524, cy: 184, rx: 12, ry: 15 },
  { cx: 569, cy: 196, rx: 14, ry: 20 },
  { cx: 616, cy: 211, rx: 14, ry: 20 },
  { cx: 662, cy: 228, rx: 13, ry: 18 },
]

const selectedGradient = 'url(#denvi-tooth-selected)'
const segmentedGradient = 'url(#denvi-tooth-detected)'

export default function ToothChart({
  selectedFdiNumbers,
  segmentedFdiNumbers = new Set<number>(),
  onToothClick,
}: ToothChartProps) {
  const renderTooth = (
    num: number,
    index: number,
    positions: typeof upperPositions,
  ) => {
    const p = positions[index]
    const selected = selectedFdiNumbers.has(num)
    const detected = segmentedFdiNumbers.has(num)
    const fill = selected ? selectedGradient : detected ? segmentedGradient : '#ffffff'
    const stroke = '#1332ff'

    return (
      <g
        key={num}
        role="button"
        tabIndex={0}
        aria-label={`치아 ${num}번`}
        onClick={() => onToothClick(num)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') onToothClick(num)
        }}
        style={{ cursor: 'pointer', outline: 'none' }}
      >
        <ellipse
          cx={p.cx}
          cy={p.cy}
          rx={p.rx}
          ry={p.ry}
          fill={fill}
          stroke={stroke}
          strokeWidth={selected ? 2.4 : 1.8}
          style={{
            filter: selected
              ? 'drop-shadow(0 4px 8px rgba(19, 50, 255, 0.32))'
              : detected
                ? 'drop-shadow(0 2px 5px rgba(19, 50, 255, 0.14))'
                : 'drop-shadow(0 1px 2px rgba(15, 23, 42, 0.08))',
            transition: 'fill 0.18s ease, stroke 0.18s ease, filter 0.18s ease',
          }}
        />
      </g>
    )
  }

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 700 280"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="denvi-tooth-selected" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1332ff" />
          <stop offset="100%" stopColor="#4516a8" />
        </linearGradient>
        <linearGradient id="denvi-tooth-detected" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--den-blue-soft)" />
          <stop offset="100%" stopColor="#e7e4ff" />
        </linearGradient>
      </defs>

      {upperTeeth.map((num, index) => renderTooth(num, index, upperPositions))}
      {lowerTeeth.map((num, index) => renderTooth(num, index, lowerPositions))}
    </svg>
  )
}

