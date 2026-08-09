import type { Scenario } from '@/features/treatment-plan/model/types'
import { Loader2, Plus } from 'lucide-react'

type ScenarioGridProps = {
  scenarios: Scenario[]
  generatingScenarioId: string | null
  completedCount: number
  stepCount: number
  onOpen: (scenario: Scenario) => void
  onEdit: (scenario: Scenario) => void
  onDelete: (id: string) => void
  onCreate: () => void
}

export function ScenarioGrid({
  scenarios,
  generatingScenarioId,
  completedCount,
  stepCount,
  onOpen,
  onEdit,
  onDelete,
  onCreate,
}: ScenarioGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
      {scenarios.map((scenario, index) => {
        const isGenerating = generatingScenarioId === scenario.id
        return (
          <article
            key={scenario.id}
            className="flex flex-col rounded-[24px] border border-den-line bg-white p-4 shadow-sm transition-all hover:shadow-md cursor-pointer hover:border-den-blue"
            onClick={event => {
              if ((event.target as HTMLElement).closest('button')) return
              if (scenario.image) onOpen(scenario)
            }}
          >
            <div className="relative aspect-video rounded-[18px] overflow-hidden bg-gray-100 flex-shrink-0">
              {isGenerating ? (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-4 gap-2">
                  <Loader2 className="animate-spin text-white" size={28} />
                  <span className="text-xs font-bold">시뮬레이션 생성 중</span>
                  {stepCount > 0 && <span className="text-[10px] text-white/70">({completedCount} / {stepCount} 단계 완료)</span>}
                </div>
              ) : scenario.image ? (
                <img src={scenario.image} alt={scenario.title} className="w-full h-full object-cover" />
              ) : (
                <div className="flex w-full h-full items-center justify-center bg-gray-100 text-[10px] font-bold text-gray-400">이미지 대기 중</div>
              )}
              <span className="absolute top-3 left-3 bg-[#1332ff] text-white px-4 py-1 text-xs font-bold rounded-full">Option {index + 1}</span>
            </div>

            <div className="flex flex-1 flex-col justify-between mt-4 gap-4">
              <div>
                <h2 className="text-base font-black text-den-ink truncate">{scenario.title}</h2>
                <div className="grid grid-cols-3 gap-2 border-t border-den-line/60 pt-4 mt-3 text-[11px] font-semibold text-den-muted">
                  <div><p className="text-[10px] text-gray-400 mb-1">치아</p><p className="text-den-ink font-black truncate">{scenario.teeth}</p></div>
                  <div><p className="text-[10px] text-gray-400 mb-1">비용</p><p className="text-den-ink font-black truncate">{scenario.cost}</p></div>
                  <div><p className="text-[10px] text-gray-400 mb-1">예후</p><p className="text-den-blue font-black text-sm">{scenario.prognosis}</p></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <button onClick={() => onEdit(scenario)} className="bg-den-ink text-white font-bold text-xs py-3 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all">치료 수정하기</button>
                <button onClick={() => onDelete(scenario.id)} className="bg-white text-den-ink border border-den-line font-bold text-xs py-3 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all">삭제하기</button>
              </div>
            </div>
          </article>
        )
      })}

      <div onClick={onCreate} className="flex aspect-[4/3] md:aspect-auto md:h-full flex-col items-center justify-center rounded-[24px] border border-dashed border-[#ccd6e2] bg-[#f8f9fc] p-8 gap-3 cursor-pointer hover:bg-den-blue-soft/30 hover:border-den-blue transition-all min-h-[300px]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-den-blue-soft text-den-blue"><Plus size={22} /></div>
        <p className="text-sm font-bold text-den-blue">새 시나리오 생성하기</p>
        <p className="text-xs text-den-muted text-center leading-relaxed">치아를 선택하고<br />새로운 옵션을 추가하세요</p>
      </div>
    </div>
  )
}
