import { TREATMENT_CATEGORIES } from '@/features/treatment-plan/model/treatmentCatalog'
import type { StoredTreatment, TreatmentCategory, TreatmentItem } from '@/features/treatment-plan/model/types'
import { useTreatmentPlanStore } from '@/features/treatment-plan/model/useTreatmentPlanStore'
import { Lock, X } from 'lucide-react'
import { useState } from 'react'

type SelectedTreatment = { item: TreatmentItem; category: TreatmentCategory; imagePrompt: string; fdi?: number }

export const TreatmentPlanPanel = ({
  selectedTreatments,
  onToggle,
  onRemoveTemp,
  isLoading,
  canStart,
  imageUploaded,
  onStart,
  selectedFdiNumbers,
}: {
  selectedTreatments: SelectedTreatment[]
  onToggle: (item: TreatmentItem, category: TreatmentCategory) => void
  onRemoveTemp: (fdi: number, itemId: string, categoryId: string) => void
  isLoading: boolean
  canStart: boolean
  imageUploaded: boolean
  onStart: () => void
  selectedFdiNumbers: Set<number>
}) => {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(TREATMENT_CATEGORIES[0].id)
  const treatmentLocked = !imageUploaded || selectedFdiNumbers.size === 0
  const storeSelectedTreatments = useTreatmentPlanStore(s => s.selectedTreatments)
  const setSelectedTreatmentsStore = useTreatmentPlanStore(s => s.setSelectedTreatments)

  const activeCategory = TREATMENT_CATEGORIES.find(c => c.id === activeCategoryId)

  const handleSaveScenario = () => {
    if (selectedTreatments.length === 0) return
    const mapped: StoredTreatment[] = selectedTreatments.map(s => ({
      itemId: `${s.fdi}-${s.item.id}`,
      itemName: `${s.fdi}번 ${s.category.label}-${s.item.name}`,
      itemDescription: s.item.description,
      imagePrompt: s.imagePrompt || `${s.fdi}번 치아의 ${s.item.name} 치료`,
      categoryId: s.category.id,
      categoryLabel: s.category.label,
    }))
    setSelectedTreatmentsStore([...storeSelectedTreatments, ...mapped])
    // Clear temporary selections
    selectedTreatments.forEach(s => {
      onRemoveTemp(s.fdi!, s.item.id, s.category.id)
    })
  }

  const removeSavedTreatment = (itemId: string) => {
    setSelectedTreatmentsStore(storeSelectedTreatments.filter(t => t.itemId !== itemId))
  }

  return (
    <div className="flex w-[312px] shrink-0 flex-col gap-4 overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {/* 진료과 탭 */}
        <div className="relative flex min-h-0 flex-1 flex-col rounded-[24px] border border-den-line bg-white px-7 py-8 shadow-[0_12px_32px_rgba(15,23,42,0.14)]">
          <div className="mb-10 shrink-0">
            <h2 className="flex items-center gap-2 text-xl font-black text-den-ink">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${treatmentLocked ? 'bg-[#e4e9f0] text-[#8b95a3]' : 'bg-den-blue text-white'}`}>
                1
              </span>
              치료 계획 설정
            </h2>
            <p className="mt-3 text-sm font-medium text-den-muted">복수 선택 가능합니다.</p>
          </div>

          {treatmentLocked ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-1 py-2">
              {TREATMENT_CATEGORIES.map(cat => (
                <div key={cat.id} className="text-sm font-bold text-[#c1c7d0]">
                  {cat.label}
                </div>
              ))}
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-1 py-2">
                {TREATMENT_CATEGORIES.map(cat => {
                  const isActive = cat.id === activeCategoryId
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategoryId(cat.id)}
                      className={`rounded-xl border py-2.5 text-center text-xs font-bold transition-all ${
                        isActive
                          ? 'border-den-blue bg-den-blue-selected text-den-blue shadow-[0_4px_12px_rgba(19,50,255,0.12)]'
                          : 'border-den-line bg-white text-[#475467] hover:border-den-blue hover:bg-den-blue-soft hover:text-den-blue'
                      }`}
                    >
                      {cat.label}
                    </button>
                  )
                })}
              </div>

              {activeCategory && (
                <div className="mt-6 border-t border-den-line/60 pt-4">
                  <button className="flex w-full items-center justify-between py-2 text-left text-sm font-black text-den-blue">
                    <span>{activeCategory.label}</span>
                    <span>⌄</span>
                  </button>
                  <div className="mt-2 space-y-1">
                    {activeCategory.items.map(item => {
                      const isSelected = selectedTreatments.some(s => s.item.id === item.id && s.category.id === activeCategory.id)
                      const isDisabled = item.phase === 'P3'
                      return (
                        <button
                          key={item.id}
                          disabled={isDisabled}
                          title={item.phase === 'P3' ? '준비중' : undefined}
                          onClick={() => {
                            if (!isDisabled) onToggle(item, activeCategory)
                          }}
                          className={`block w-full rounded-xl px-4 py-3 text-left text-xs font-semibold transition-all ${
                            isDisabled
                              ? 'cursor-not-allowed text-[#a1a7b0]'
                              : isSelected
                                ? 'border border-den-blue bg-[#dfe4ff] text-den-blue shadow-[inset_0_0_0_1px_#1332ff]'
                                : 'text-[#475467] hover:bg-den-blue-soft hover:text-den-blue'
                          }`}
                        >
                          {item.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {selectedTreatments.length > 0 && (
                <div className="mt-6 border-t border-den-line/60 pt-4">
                  <div className="space-y-2">
                    {selectedTreatments.map(s => (
                      <div
                        key={`${s.fdi}-${s.category.id}-${s.item.id}`}
                        className="flex items-center justify-between rounded-lg bg-[#f8f9fc] px-3 py-2 text-xs"
                      >
                        <div className="font-medium text-[#475467] truncate mr-2">
                          <span className="font-bold text-den-blue mr-1.5">{s.fdi}번</span>
                          <span className="font-bold text-den-blue">{s.category.label}</span>
                          <span className="mx-1 text-gray-300">-</span>
                          <span className="text-den-ink">{s.item.name}</span>
                        </div>
                        <button
                          onClick={() => onRemoveTemp(s.fdi!, s.item.id, s.category.id)}
                          className="text-[#98a2b3] hover:text-[#475467] shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {treatmentLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[24px] bg-white/80 backdrop-blur-[1px]">
              <div className="text-center px-4">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e4e9f0] text-[#8b95a3]">
                  <Lock size={20} />
                </div>
                {!imageUploaded ? (
                  <p className="text-xs font-bold text-den-muted">사진을 올린 후 치아를 선택해주세요</p>
                ) : (
                  <p className="text-sm font-bold text-den-muted">치아를 먼저 선택해주세요</p>
                )}
              </div>
            </div>
          )}

          {/* Button: 시나리오 저장 */}
          {!treatmentLocked && (
            <div className="mt-6 border-t border-den-line/60 pt-4">
              <button
                disabled={selectedTreatments.length === 0}
                onClick={handleSaveScenario}
                className={`w-full rounded-xl py-3.5 text-sm font-bold transition-all shadow-md ${
                  selectedTreatments.length > 0
                    ? 'bg-den-ink text-white hover:brightness-110 active:scale-[0.98]'
                    : 'bg-[#e4e9f0] text-[#a5b0c0] cursor-not-allowed'
                }`}
              >
                시나리오 저장
              </button>
            </div>
          )}
        </div>

        {/* 저장한 치료 계획 */}
        <div className="relative shrink-0 rounded-[24px] border border-den-line bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.10)]">
          <div className="mb-4 flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${!imageUploaded ? 'bg-[#e4e9f0] text-[#8b95a3]' : 'bg-den-blue text-white'}`}>
              2
            </span>
            <h3 className="text-base font-black text-den-ink">저장한 치료 계획</h3>
          </div>
          
          <div className="mb-4">
            <p className="text-xs font-bold text-[#8b95a3] leading-relaxed">치료 계획이 저장됩니다.</p>
            <p className="text-[10px] font-medium text-den-muted leading-relaxed">치료 계획 생성하기를 누르면 생성된 치료 시나리오를 확인할 수 있습니다.</p>
          </div>

          {storeSelectedTreatments.length > 0 ? (
            <div className="my-4 max-h-[160px] overflow-y-auto space-y-1.5 pr-1">
              {storeSelectedTreatments.map(t => (
                <div
                  key={t.itemId}
                  className="flex items-center justify-between rounded-lg bg-den-blue-soft px-3 py-2 text-xs"
                >
                  <span className="font-bold text-den-blue truncate mr-2">
                    {t.itemName}
                  </span>
                  <button
                    onClick={() => removeSavedTreatment(t.itemId)}
                    className="text-[#98a2b3] hover:text-[#475467] shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="my-6 text-center">
              <p className="text-xs font-bold text-den-muted py-2">
                아직 설정한 시나리오가 없습니다
              </p>
            </div>
          )}

          {/* 하단 시작 버튼 */}
          <div className="mt-4">
            <button
              disabled={!canStart || isLoading}
              onClick={onStart}
              className={`w-full rounded-xl py-4 text-sm font-bold transition-all shadow-md ${
                canStart && !isLoading
                  ? 'den-button-primary text-white hover:brightness-105 active:scale-[0.98]'
                  : 'bg-[#e4e9f0] text-[#a5b0c0] cursor-not-allowed'
              }`}
            >
              {isLoading ? '분석 중...' : '치료 계획 생성하기'}
            </button>
          </div>

          {!imageUploaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[24px] bg-white/80 backdrop-blur-[1px]">
              <div className="text-center px-4">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e4e9f0] text-[#8b95a3]">
                  <Lock size={20} />
                </div>
                <p className="text-xs font-bold text-den-muted">사진을 올린 후 치아를 선택해주세요</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
