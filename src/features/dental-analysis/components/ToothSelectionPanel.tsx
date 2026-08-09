import type { ToothSegment } from '@/features/dental-analysis/model/types'
import ToothChart from '@/shared/ui/ToothChart'

export const FdiToothDiagram = ({
  selectedFdiNumbers,
  segmentedTeeth,
  onToggle,
  className = '',
  chartHeightClassName = 'h-[150px]',
}: {
  selectedFdiNumbers: Set<number>
  segmentedTeeth: ToothSegment[]
  onToggle: (fdi: number) => void
  className?: string
  chartHeightClassName?: string
}) => {
  const selectedCount = selectedFdiNumbers.size
  const segmentedFdiNumbers = new Set(segmentedTeeth.map(t => t.fdi))

  return (
    <div className={`rounded-[14px] border border-den-line bg-white px-6 py-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] ${className}`}>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-lg font-black text-den-ink">치아 선택</p>
          <p className="mt-1 text-xs font-medium text-den-muted">치료할 치아를 선택해주세요.</p>
        </div>
        {selectedCount > 0 && (
          <span className="rounded-full bg-den-blue-selected px-2 py-1 text-[10px] font-bold text-den-blue">
            {selectedCount}개 선택
          </span>
        )}
      </div>

      <div className={`${chartHeightClassName} rounded-xl bg-[#fbfcff] px-4 py-3`}>
        {segmentedTeeth.length > 0 ? (
          <SegmentedToothChart
            teeth={segmentedTeeth}
            selectedFdiNumbers={selectedFdiNumbers}
            onToothClick={onToggle}
          />
        ) : (
          <ToothChart
            selectedFdiNumbers={selectedFdiNumbers}
            segmentedFdiNumbers={segmentedFdiNumbers}
            onToothClick={onToggle}
          />
        )}
      </div>
    </div>
  )
}

const SegmentedToothChart = ({
  teeth,
  selectedFdiNumbers,
  onToothClick,
}: {
  teeth: ToothSegment[]
  selectedFdiNumbers: Set<number>
  onToothClick: (fdi: number) => void
}) => {
  const shapes = teeth
    .map(tooth => {
      const points = tooth.points && tooth.points.length > 2
        ? tooth.points
        : [
            [tooth.x - tooth.width / 2, tooth.y - tooth.height / 2],
            [tooth.x + tooth.width / 2, tooth.y - tooth.height / 2],
            [tooth.x + tooth.width / 2, tooth.y + tooth.height / 2],
            [tooth.x - tooth.width / 2, tooth.y + tooth.height / 2],
          ]
      return { tooth, points }
    })
    .filter(shape => shape.points.length > 2)

  if (shapes.length === 0) {
    return (
      <ToothChart
        selectedFdiNumbers={selectedFdiNumbers}
        segmentedFdiNumbers={new Set<number>()}
        onToothClick={onToothClick}
      />
    )
  }

  const xs = shapes.flatMap(shape => shape.points.map(([x]) => x))
  const ys = shapes.flatMap(shape => shape.points.map(([, y]) => y))
  const minX = Math.max(0, Math.min(...xs))
  const maxX = Math.min(1, Math.max(...xs))
  const minY = Math.max(0, Math.min(...ys))
  const maxY = Math.min(1, Math.max(...ys))
  const width = Math.max(0.01, maxX - minX)
  const height = Math.max(0.01, maxY - minY)
  const pad = 0.08
  const viewBox = `${Math.max(0, minX - pad) * 1000} ${Math.max(0, minY - pad) * 1000} ${Math.min(1, width + pad * 2) * 1000} ${Math.min(1, height + pad * 2) * 1000}`

  return (
    <svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      {shapes.map(({ tooth, points }) => {
        const selected = selectedFdiNumbers.has(tooth.fdi)
        const polygon = points.map(([x, y]) => `${x * 1000},${y * 1000}`).join(' ')
        return (
          <polygon
            key={tooth.fdi}
            points={polygon}
            fill={selected ? 'rgba(19, 50, 255, 0.16)' : '#ffffff'}
            stroke="#1332ff"
            strokeWidth={selected ? 4 : 2.8}
            vectorEffect="non-scaling-stroke"
            role="button"
            tabIndex={0}
            aria-label={`치아 ${tooth.fdi}번`}
            onClick={() => onToothClick(tooth.fdi)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') onToothClick(tooth.fdi)
            }}
            style={{
              cursor: 'pointer',
              filter: selected ? 'drop-shadow(0 5px 10px rgba(19, 50, 255, 0.25))' : 'none',
              transition: 'fill 0.18s ease, stroke-width 0.18s ease',
            }}
          />
        )
      })}
    </svg>
  )
}

// ─── 치료 계획 사이드바 ────────────────────────────────────────────────────────

