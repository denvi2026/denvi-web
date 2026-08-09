import type { Scenario } from '@/features/treatment-plan/model/types'
import { ArrowLeft } from 'lucide-react'
import { useRef, useState } from 'react'

export const ScenarioDetail = ({
  scenario,
  uploadedImage,
  onClose,
}: {
  scenario: Scenario
  uploadedImage: string
  onClose: () => void
}) => {
  const [opacity, setOpacity] = useState(50)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  const handleWheel = (e: React.WheelEvent) => {
    const zoomFactor = 0.15
    const newZoom = e.deltaY < 0 ? Math.min(zoom + zoomFactor, 5) : Math.max(zoom - zoomFactor, 1)
    setZoom(newZoom)
    if (newZoom === 1) {
      setPan({ x: 0, y: 0 })
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom === 1) return
    setIsDragging(true)
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const hasLaminate = scenario.treatments?.some((t: any) => t.itemId.includes('a1') || t.itemName.includes('라미네이트'))
  const hasCrown = scenario.treatments?.some((t: any) => t.itemId.includes('pr1') || t.itemName.includes('크라운'))
  const hasResin = scenario.treatments?.some((t: any) => t.itemId.includes('c1') || t.itemName.includes('레진'))

  let details = {
    name: scenario.title,
    thickness: '0.3mm ~ 0.5mm',
    nerve: '불필요 (시림 방지)',
    preservation: '90% 이상',
    lifespan: '5~10년',
    note: '자연치아 보존 강도가 가장 높은 심미 치료입니다.'
  }

  if (hasCrown) {
    details = {
      name: '지대치 크라운 치료',
      thickness: '1.5mm ~ 2.0mm',
      nerve: '신경치료 권장',
      preservation: '40% ~ 50%',
      lifespan: '10~15년',
      note: '치아 강도를 최대로 보강하며 파절을 원천 방지합니다.'
    }
  } else if (hasResin) {
    details = {
      name: '레진 충전 치료',
      thickness: '충치 영역 한정 미세 삭제',
      nerve: '불필요',
      preservation: '95% 이상',
      lifespan: '3~5년',
      note: '미세 충치 충전에 매우 탁월하며 내원 당일 완료됩니다.'
    }
  } else if (hasLaminate) {
    details = {
      name: '라미네이트 치료',
      thickness: '0.3mm ~ 0.7mm',
      nerve: '불필요',
      preservation: '90% 이상',
      lifespan: '5~10년',
      note: '앞니 법랑질 일부만 미세 삭제하여 형태를 완벽히 회복합니다.'
    }
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#0b0f19] text-white">
      {/* Header */}
      <header className="flex h-20 shrink-0 items-center justify-between border-b border-gray-800 bg-[#0f1424] px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-lg font-black">{scenario.title} - 정밀 상담 뷰어</h1>
            <p className="text-xs text-gray-400 mt-1">
              치아 삭제면과 반투명 수복 오버레이의 관계를 정밀 비교합니다.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
        >
          상담 완료
        </button>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Large comparative zoomable view */}
        <div className="flex flex-1 flex-col p-8 overflow-hidden relative justify-center items-center">
          <div 
            className="relative overflow-hidden w-full h-full rounded-[24px] bg-[#05070c] border border-gray-800 flex justify-center items-center cursor-move"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Visual Instruction Overlay */}
            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-xs text-gray-300 pointer-events-none">
              💡 마우스 휠로 <strong>확대/축소</strong>, 드래그로 <strong>화면 이동</strong> 가능
            </div>

            {/* Canvas Area container */}
            <div 
              className="relative select-none"
              style={{
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                width: '100%',
                height: '100%',
                maxHeight: '80vh',
                maxWidth: '65vw',
              }}
            >
              {/* Bottom Layer: Original Intraoral Photo */}
              {uploadedImage && (
                <img
                  src={uploadedImage}
                  alt="Original prep"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
              )}

              {/* Top Layer: generated simulation with opacity */}
              {scenario.image && (
                <img
                  src={scenario.image}
                  alt="Translucent Overlay simulation"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={{ opacity: opacity / 100 }}
                />
              )}
            </div>

            {/* Opacity slider overlaid at the bottom */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-96 max-w-sm bg-black/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-gray-800 flex flex-col gap-2">
              <div className="flex justify-between text-[11px] text-gray-300 font-bold">
                <span>삭제치아 모습 (0%)</span>
                <span>보철 완성 모습 (100%)</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="text-center text-[10px] text-gray-400 font-semibold mt-1">
                완성도 투명 비율: {opacity}%
              </div>
            </div>
          </div>
        </div>

        {/* Right: Consulting side card */}
        <div className="w-[380px] shrink-0 border-l border-gray-800 bg-[#0f1424] p-8 overflow-y-auto flex flex-col justify-between gap-6">
          <div className="space-y-6">
            <div>
              <span className="bg-blue-500/20 text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                Clinical Simulation Spec
              </span>
              <h2 className="text-xl font-black mt-3">{details.name}</h2>
              <p className="text-xs text-gray-400 leading-relaxed mt-2">{details.note}</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800">
                <p className="text-[10px] text-gray-400 font-bold mb-1">상태 구분</p>
                <p className="text-sm font-black text-blue-400">치아 보존 시뮬레이션</p>
              </div>

              <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800">
                <p className="text-[10px] text-gray-400 font-bold mb-1">삭제 두께</p>
                <p className="text-sm font-black text-white">{details.thickness}</p>
              </div>

              <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800">
                <p className="text-[10px] text-gray-400 font-bold mb-1">자연치아 보존율</p>
                <p className="text-sm font-black text-white">{details.preservation}</p>
              </div>

              <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800">
                <p className="text-[10px] text-gray-400 font-bold mb-1">신경치료 동반</p>
                <p className="text-sm font-black text-white">{details.nerve}</p>
              </div>

              <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800">
                <p className="text-[10px] text-gray-400 font-bold mb-1">예상 수명</p>
                <p className="text-sm font-black text-white">{details.lifespan}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setZoom(1)
                setPan({ x: 0, y: 0 })
              }}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs py-3 rounded-xl transition-all"
            >
              화면 줌 초기화
            </button>
            <button
              onClick={onClose}
              className="w-full border border-gray-700 hover:bg-gray-800 text-gray-300 font-bold text-xs py-3 rounded-xl transition-all"
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
