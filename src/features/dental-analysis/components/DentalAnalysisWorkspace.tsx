import type { DentalPrediction as Prediction, SelectedRegion, ToothSegment } from '@/features/dental-analysis/model/types'
import { useDentalAnalysisStore } from '@/features/dental-analysis/model/useDentalAnalysisStore'
import { useDentalAnalysis } from '@/features/dental-analysis/hooks/useDentalAnalysis'
import { FdiToothDiagram } from '@/features/dental-analysis/components/ToothSelectionPanel'
import { PATIENT_LIST } from '@/features/patient/data/patients'
import { PatientPhotoSidebar } from '@/features/patient/components/PatientPhotoSidebar'
import { TreatmentPlanPanel } from '@/features/treatment-plan/components/TreatmentPlanPanel'
import type { TreatmentCategory, TreatmentItem } from '@/features/treatment-plan/model/types'
import { useTreatmentPlanStore } from '@/features/treatment-plan/model/useTreatmentPlanStore'
import { usePatientStore } from '@/store/usePatientStore'
import { useRestoration } from '@/features/restoration/hooks/useRestoration'
import { Loader2, RotateCcw, Upload, WandSparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text } from 'react-konva'
import { useNavigate } from 'react-router-dom'
import useImage from 'use-image'

// ─── Types ────────────────────────────────────────────────────────────────────

type StageRect = { x: number; y: number; w: number; h: number }
type SelectedTreatment = { item: TreatmentItem; category: TreatmentCategory; imagePrompt: string; fdi?: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

// ─── Main Component ───────────────────────────────────────────────────────────

export const DentalAnalysisWorkspace = () => {
  const navigate = useNavigate()
  const { isReady: isAnalysisReady, analyzeDentalImage, segmentTeeth } = useDentalAnalysis()
  const storeUploadedImage = useDentalAnalysisStore(s => s.uploadedImage)
  const resetAnalysis = useDentalAnalysisStore(s => s.resetAnalysis)
  const setUploadedImage = useDentalAnalysisStore(s => s.setUploadedImage)
  const selectedRegion = useDentalAnalysisStore(s => s.selectedRegion)
  const setSelectedRegion = useDentalAnalysisStore(s => s.setSelectedRegion)
  const segmentedTeeth = useDentalAnalysisStore(s => s.segmentedTeeth)
  const setSegmentedTeeth = useDentalAnalysisStore(s => s.setSegmentedTeeth)
  const storeSelectedFdiNumbers = useDentalAnalysisStore(s => s.selectedFdiNumbers)
  const setSelectedFdiNumbersStore = useDentalAnalysisStore(s => s.setSelectedFdiNumbers)
  const selectedFdiNumbers = new Set(storeSelectedFdiNumbers)
  const storeSelectedTreatments = useTreatmentPlanStore(s => s.selectedTreatments)
  const setSelectedTreatmentsStore = useTreatmentPlanStore(s => s.setSelectedTreatments)
  const storeScenarios = useTreatmentPlanStore(s => s.scenarios)
  const setScenarios = useTreatmentPlanStore(s => s.setScenarios)
  const editingScenarioId = useTreatmentPlanStore(s => s.editingScenarioId)
  const setEditingScenarioId = useTreatmentPlanStore(s => s.setEditingScenarioId)
  const setGeneratingScenarioId = useTreatmentPlanStore(s => s.setGeneratingScenarioId)
  const resetTreatmentPlan = useTreatmentPlanStore(s => s.resetTreatmentPlan)
  const selectedPatient = usePatientStore(s => s.selectedPatient)
  const setSelectedPatient = usePatientStore(s => s.setSelectedPatient)
  const restoration = useRestoration()


  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSegmenting, setIsSegmenting] = useState(false)
  const preview = storeUploadedImage
  const [image] = useImage(preview ?? '')
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [selectedDetectionIds, setSelectedDetectionIds] = useState<string[]>([])
  const [viewState, setViewState] = useState({ stageWidth: 0, stageHeight: 0, imageX: 0, imageY: 0, scale: 1 })
  const [selectedTreatments, setSelectedTreatmentsLocal] = useState<SelectedTreatment[]>([])
  const [selectionMode, setSelectionMode] = useState(false)
  const [drawingRect, setDrawingRect] = useState<StageRect | null>(null)


  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isDrawingRef = useRef(false)
  const drawStartRef = useRef<{ x: number; y: number } | null>(null)
  const drawingRectRef = useRef<StageRect | null>(null)


  // ── File upload & API calls ──────────────────────────────────────────────────

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    if (!f.type.startsWith('image/')) return

    setPredictions([])
    setSegmentedTeeth([])
    setSelectedDetectionIds([])
    setSelectedFdiNumbersStore([])
    setSelectedRegion(null)
    setSelectionMode(false)
    setSelectedTreatmentsLocal([])
    restoration.reset()

    let dataUrl: string
    try {
      dataUrl = await readFileAsDataUrl(f)
      setUploadedImage(dataUrl, f.type)
    } catch {
      alert('이미지 미리보기 생성에 실패했습니다.')
      return
    }

    setIsLoading(true)
    setIsSegmenting(true)

    const [inferResult, segmentResult] = await Promise.allSettled([
      analyzeDentalImage(f),
      segmentTeeth(dataUrl, f.type),
    ])

    if (inferResult.status === 'fulfilled' && inferResult.value?.predictions) {
      setPredictions(inferResult.value.predictions as Prediction[])
    }
    if (segmentResult.status === 'fulfilled' && Array.isArray(segmentResult.value?.teeth)) {
      setSegmentedTeeth(segmentResult.value.teeth as ToothSegment[])
    }

    setIsLoading(false)
    setIsSegmenting(false)
  }

  // ── Canvas fit ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fitImageToContainer = () => {
      if (!image || !containerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      const scale = Math.min((w * 0.95) / image.width, (h * 0.95) / image.height)
      setViewState({ stageWidth: w, stageHeight: h, imageX: (w - image.width * scale) / 2, imageY: (h - image.height * scale) / 2, scale })
    }
    fitImageToContainer()
    window.addEventListener('resize', fitImageToContainer)
    return () => window.removeEventListener('resize', fitImageToContainer)
  }, [image])

  // ── Selection toggles ─────────────────────────────────────────────────────────

  const toggleDetection = (id: string) => {
    setSelectedDetectionIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]))
  }

  const toggleFdiNumber = (fdi: number) => {
    const next = new Set(selectedFdiNumbers)
    if (next.has(fdi)) next.delete(fdi)
    else next.add(fdi)
    setSelectedFdiNumbersStore([...next])
  }

  const handleSelectPatient = (patient: (typeof PATIENT_LIST)[number]) => {
    if (selectedPatient?.id !== patient.id) {
      resetAnalysis()
      resetTreatmentPlan()
      setPredictions([])
      setSelectedDetectionIds([])
      setSelectedTreatmentsLocal([])
      setSelectionMode(false)
      setDrawingRect(null)
      restoration.reset()
    }
    setSelectedPatient(patient)
  }

  // ── Region selection mouse handlers ───────────────────────────────────────────

  const getContainerPos = (e: React.MouseEvent) => {
    const rect = containerRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const stageToNorm = (rect: StageRect): SelectedRegion | null => {
    if (!image || viewState.scale === 0) return null
    const { imageX, imageY, scale } = viewState
    return {
      x1: Math.max(0, Math.min(1, (rect.x - imageX) / scale / image.width)),
      y1: Math.max(0, Math.min(1, (rect.y - imageY) / scale / image.height)),
      x2: Math.max(0, Math.min(1, (rect.x + rect.w - imageX) / scale / image.width)),
      y2: Math.max(0, Math.min(1, (rect.y + rect.h - imageY) / scale / image.height)),
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!selectionMode || !preview) return
    isDrawingRef.current = true
    drawStartRef.current = getContainerPos(e)
    drawingRectRef.current = null
    setDrawingRect(null)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectionMode || !isDrawingRef.current || !drawStartRef.current) return
    const pos = getContainerPos(e)
    const r: StageRect = {
      x: Math.min(drawStartRef.current.x, pos.x),
      y: Math.min(drawStartRef.current.y, pos.y),
      w: Math.abs(pos.x - drawStartRef.current.x),
      h: Math.abs(pos.y - drawStartRef.current.y),
    }
    drawingRectRef.current = r
    setDrawingRect(r)
  }

  const finishDraw = () => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    const dr = drawingRectRef.current
    if (dr && dr.w > 10 && dr.h > 10) {
      const norm = stageToNorm(dr)
      if (norm && norm.x2 - norm.x1 > 0.02 && norm.y2 - norm.y1 > 0.02) {
        restoration.reset()
        setSelectedRegion(norm)
      }
    }
    drawingRectRef.current = null
    setDrawingRect(null)
    drawStartRef.current = null
  }

  const regionInStage: StageRect | null =
    selectedRegion && image
      ? {
          x: selectedRegion.x1 * image.width * viewState.scale + viewState.imageX,
          y: selectedRegion.y1 * image.height * viewState.scale + viewState.imageY,
          w: (selectedRegion.x2 - selectedRegion.x1) * image.width * viewState.scale,
          h: (selectedRegion.y2 - selectedRegion.y1) * image.height * viewState.scale,
        }
      : null

  const displayRect = drawingRect ?? regionInStage
  const { stageWidth, stageHeight, imageX, imageY, scale } = viewState
  const canStart = Boolean(preview) && storeSelectedTreatments.length > 0
  const canRestore = Boolean(preview && selectedRegion && !restoration.isBusy)

  const handleRestoration = () => {
    if (!preview || !selectedRegion || restoration.isBusy) return
    void restoration.start(preview, selectedRegion)
  }

  const restorationStatus = {
    idle: '복원할 사각형 영역을 선택하세요.',
    submitting: '이미지와 마스크를 업로드하는 중입니다.',
    queued: '복원 작업이 대기 중입니다.',
    processing: '복원 이미지를 생성하는 중입니다.',
    succeeded: '복원 후보가 준비되었습니다.',
    failed: restoration.error || '복원에 실패했습니다.',
  }[restoration.phase]

  // ── Treatment handlers ────────────────────────────────────────────────────────

  const toggleTreatment = (item: TreatmentItem, category: TreatmentCategory) => {
    if (selectedFdiNumbers.size === 0) return
    setSelectedTreatmentsLocal(prev => {
      const next = [...prev]
      selectedFdiNumbers.forEach(fdi => {
        const idx = next.findIndex(s => s.fdi === fdi && s.item.id === item.id && s.category.id === category.id)
        if (idx > -1) {
          next.splice(idx, 1)
        } else {
          next.push({
            fdi,
            item,
            category,
            imagePrompt: `${fdi}번 치아의 ${item.name} 치료 시뮬레이션`,
          })
        }
      })
      return next
    })
  }

  const handleStartAnalysis = () => {
    if (!canStart || storeSelectedTreatments.length === 0) return

    // Generate scenario info
    const teethStr = storeSelectedFdiNumbers.length > 0
      ? [...storeSelectedFdiNumbers].sort((a, b) => a - b).map(n => `${n}번`).join(',')
      : '전체 치아'
      
    // Determine title, cost, prognosis
    const hasImplant = storeSelectedTreatments.some(t => t.itemId.includes('pr3'))
    const hasBridge = storeSelectedTreatments.some(t => t.itemId.includes('pr2'))
    const hasCrown = storeSelectedTreatments.some(t => t.itemId.includes('pr1'))
    const hasResin = storeSelectedTreatments.some(t => t.itemId.includes('c1'))
    const hasInlay = storeSelectedTreatments.some(t => t.itemId.includes('c2'))
    
    let title = storeSelectedTreatments.map(t => t.itemName.replace(/^\d+번\s+/, '').split('-')[1] || t.itemName).join(' + ')
    let cost = '50~100만원'
    let prognosis = '95%'

    if (hasImplant) {
      title = '발치 후 임플란트'
      cost = `${storeSelectedFdiNumbers.length * 150}~${storeSelectedFdiNumbers.length * 200}만원`
      prognosis = '95%'
    } else if (hasBridge) {
      title = '치아 삭제 후 브릿지'
      cost = `${storeSelectedFdiNumbers.length * 70}~${storeSelectedFdiNumbers.length * 90}만원`
      prognosis = '92%'
    } else if (hasCrown) {
      title = '크라운 수복 치료'
      cost = `${storeSelectedFdiNumbers.length * 50}~${storeSelectedFdiNumbers.length * 70}만원`
      prognosis = '96%'
    } else if (hasResin || hasInlay) {
      title = '충치 레진/인레이 치료'
      cost = `${storeSelectedFdiNumbers.length * 10}~${storeSelectedFdiNumbers.length * 30}만원`
      prognosis = '98%'
    } else if (storeSelectedTreatments.length > 0) {
      title = storeSelectedTreatments[0].itemName.split('-')[1] || storeSelectedTreatments[0].itemName
      cost = '10~30만원'
      prognosis = '97%'
    }

    const nextScenarios = [...storeScenarios]
    let targetScenarioId = `scenario-${Date.now()}`
    
    if (editingScenarioId) {
      targetScenarioId = editingScenarioId
      const idx = nextScenarios.findIndex(sc => sc.id === editingScenarioId)
      if (idx > -1) {
        nextScenarios[idx] = {
          ...nextScenarios[idx],
          title,
          teeth: teethStr,
          cost,
          prognosis,
          treatments: storeSelectedTreatments,
          selectedFdiNumbers: storeSelectedFdiNumbers,
        }
      }
      setEditingScenarioId(null)
    } else {
      nextScenarios.push({
        id: targetScenarioId,
        title,
        teeth: teethStr,
        cost,
        prognosis,
        image: preview, // use current preview as fallback
        treatments: storeSelectedTreatments,
        selectedFdiNumbers: storeSelectedFdiNumbers,
      })
    }
    setScenarios(nextScenarios)
    setGeneratingScenarioId(targetScenarioId)

    // Clear current temporary selections
    setSelectedTreatmentsStore([])
      navigate('/viewer')
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden relative">
      {/* Analysis service loading overlay */}
      {!isAnalysisReady && (
        <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-den-gray/80 backdrop-blur-md">
          <div className="flex flex-col items-center gap-6 p-10 rounded-2xl bg-white/90 border border-den-line shadow-2xl max-w-md text-center">
            {/* Premium modern spinner */}
            <div className="h-12 w-12 animate-spin rounded-full border-[4px] border-den-line border-t-den-blue" />
            <div>
              <h2 className="text-xl font-bold text-den-ink mb-2">AI 진단 엔진 구동 중</h2>
              <p className="text-sm text-den-muted leading-relaxed">
                DENVI의 AI 분석 모듈을 기동하고 있습니다.
                <br />
                최초 실행 시 의존성 설치 및 모델 로드를 위해 약 30초 ~ 1분 정도 소요될 수 있습니다. 잠시만 기다려주세요...
              </p>
            </div>
          </div>
        </div>
      )}
      <header className="hidden h-14 bg-white border-b px-8">
        <div className="flex items-center gap-3">
          <span className="text-blue-600 font-bold text-sm">AI 진단 분석</span>
          <span className="text-xs text-gray-400">
            {selectedPatient
              ? `${selectedPatient.name} / ${selectedPatient.birthDate} / ${selectedPatient.gender === 'M' ? '남' : '여'} / ${selectedPatient.takenAt}`
              : '환자 정보 이름/생년월일/성별/촬영날짜'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="rounded-full bg-blue-50 text-blue-600 px-2 py-1 font-medium">Inference ID: #0af4429</span>
          {(isLoading || isSegmenting) && (
            <div className="flex items-center gap-2 text-blue-600 font-bold animate-pulse">
              <Loader2 className="animate-spin" size={14} />
              {isSegmenting ? '치아 세그멘테이션 중...' : '분석 중...'}
            </div>
          )}
        </div>
      </header>

      <main className="flex min-h-0 flex-1 gap-4 p-4 w-full">
        <PatientPhotoSidebar
          selectedPatient={selectedPatient}
          patients={PATIENT_LIST}
          onSelectPatient={handleSelectPatient}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex min-h-0 flex-1 gap-4">
            <div className="min-w-[260px] flex-1 flex flex-col gap-4">
              <FdiToothDiagram
                selectedFdiNumbers={selectedFdiNumbers}
                segmentedTeeth={segmentedTeeth}
                onToggle={toggleFdiNumber}
                className="shrink-0"
                chartHeightClassName="h-[240px]"
              />

          <div
            className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] shadow-[0_24px_70px_rgba(15,23,42,0.18)] ${
              preview ? 'border border-transparent bg-white' : 'border border-[#151d2b] bg-[#050914]'
            }`}
          >
            <div
              ref={containerRef}
              className={`relative flex flex-1 items-center justify-center ${
                preview ? 'bg-white' : 'bg-gradient-to-b from-[#0b1220] to-[#02040a]'
              }`}
              style={{ cursor: selectionMode && preview ? 'crosshair' : 'default' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={finishDraw}
              onMouseLeave={finishDraw}
            >
              {!preview ? (
                <div
                  className={`flex h-full w-full cursor-pointer flex-col items-center justify-center transition-all ${isDragging ? 'bg-white/5' : ''}`}
                  onDragOver={e => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => {
                    e.preventDefault()
                    setIsDragging(false)
                    handleFiles(e.dataTransfer.files)
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={e => handleFiles(e.target.files)}
                    accept="image/*"
                  />
                  <div className="text-center">
                    <Upload size={44} className="mx-auto mb-3 text-white opacity-70" />
                    <p className="text-xl font-bold tracking-tight text-white">사진이 들어갈 공간 입니다.</p>
                    <p className="mt-2 text-sm font-medium text-white/50">클릭하거나 파일을 드래그하여 업로드하세요</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="absolute right-7 top-6 z-10 flex items-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 rounded-full bg-black/32 px-4 py-2 text-sm font-black text-white backdrop-blur-sm transition-colors hover:bg-black/44"
                    >
                      이미지 다시 업로드하기
                      <Upload size={18} />
                    </button>
                    <input
                      type="file"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={e => handleFiles(e.target.files)}
                      accept="image/*"
                    />
                  </div>
                  <div className="absolute left-7 top-6 z-10 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectionMode(current => !current)}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black backdrop-blur-sm transition-colors ${
                        selectionMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-black/32 text-white hover:bg-black/44'
                      }`}
                    >
                      <WandSparkles size={17} />
                      {selectionMode ? '영역 선택 중' : '복원 영역 선택'}
                    </button>
                    <button
                      type="button"
                      onClick={handleRestoration}
                      disabled={!canRestore}
                      className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-black text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-black/25 disabled:text-white/50"
                    >
                      {restoration.isBusy ? <Loader2 className="animate-spin" size={17} /> : <RotateCcw size={17} />}
                      선택 영역 복원
                    </button>
                  </div>
                  <Stage width={stageWidth} height={stageHeight}>
                    <Layer>
                      <Group x={imageX} y={imageY} scaleX={scale} scaleY={scale}>
                        <KonvaImage image={image} />

                        {/* ML 서버 이상 부위 세그멘테이션 */}
                        {predictions.map((pred, i) => {
                          const uid = pred.detection_id || `det-${i}`
                          const active = selectedDetectionIds.includes(uid)
                          const pts = pred.points ? pred.points.flatMap(p => [p.x, p.y]) : []
                          return (
                            <Group key={uid} listening={!selectionMode} onClick={() => toggleDetection(uid)}>
                              {pts.length > 0 && (
                                <Line
                                  points={pts}
                                  closed
                                  stroke={active ? '#0065f4' : '#4B5563'}
                                  strokeWidth={2 / scale}
                                  fill={active ? 'rgba(0, 101, 244, 0.4)' : 'transparent'}
                                />
                              )}
                              <Rect
                                x={pred.x - pred.width / 2}
                                y={pred.y - pred.height / 2}
                                width={pred.width}
                                height={pred.height}
                                stroke={active ? '#0065f4' : '#9CA3AF'}
                                strokeWidth={1 / scale}
                                dash={[4, 4]}
                              />
                            </Group>
                          )
                        })}

                        {/* FDI 치아 세그멘테이션 */}
                        {image &&
                          segmentedTeeth.map(tooth => {
                            const isSelected = selectedFdiNumbers.has(tooth.fdi)
                            const px = tooth.x * image.width
                            const py = tooth.y * image.height
                            const pw = tooth.width * image.width
                            const ph = tooth.height * image.height
                            const labelW = 26 / scale
                            const labelH = 14 / scale
                            const fontSize = 9 / scale
                            const strokeColor = isSelected ? '#22c55e' : '#f59e0b'
                            const fillColor = isSelected ? 'rgba(34,197,94,0.30)' : 'rgba(245,158,11,0.15)'

                            // polygon points in canvas pixel coords
                            const polyPts =
                              tooth.points && tooth.points.length > 2
                                ? tooth.points.flatMap(([nx, ny]) => [nx * image.width, ny * image.height])
                                : null

                            return (
                              <Group
                                key={`fdi-${tooth.fdi}`}
                                listening={!selectionMode}
                                onClick={() => toggleFdiNumber(tooth.fdi)}
                              >
                                {/* Polygon mask (when the analysis provides points) */}
                                {polyPts ? (
                                  <Line
                                    points={polyPts}
                                    closed
                                    stroke={strokeColor}
                                    strokeWidth={2 / scale}
                                    fill={fillColor}
                                  />
                                ) : (
                                  /* Fallback: bounding box rectangle */
                                  <Rect
                                    x={px - pw / 2}
                                    y={py - ph / 2}
                                    width={pw}
                                    height={ph}
                                    stroke={strokeColor}
                                    strokeWidth={2 / scale}
                                    fill={fillColor}
                                    cornerRadius={2 / scale}
                                  />
                                )}
                                {/* FDI 번호 라벨 배경 */}
                                <Rect
                                  x={px - labelW / 2}
                                  y={py - ph / 2 - labelH - 2 / scale}
                                  width={labelW}
                                  height={labelH}
                                  fill={isSelected ? '#22c55e' : '#f59e0b'}
                                  cornerRadius={3 / scale}
                                />
                                {/* FDI 번호 텍스트 */}
                                <Text
                                  x={px - labelW / 2}
                                  y={py - ph / 2 - labelH - 2 / scale}
                                  width={labelW}
                                  height={labelH}
                                  text={String(tooth.fdi)}
                                  fontSize={fontSize}
                                  fontStyle="bold"
                                  fill="white"
                                  align="center"
                                  verticalAlign="middle"
                                />
                              </Group>
                            )
                          })}
                      </Group>

                      {/* 영역 선택 오버레이 */}
                      {displayRect && (
                        <>
                          <Rect
                            x={0}
                            y={0}
                            width={stageWidth}
                            height={displayRect.y}
                            fill="rgba(0,0,0,0.45)"
                            listening={false}
                          />
                          <Rect
                            x={0}
                            y={displayRect.y + displayRect.h}
                            width={stageWidth}
                            height={Math.max(0, stageHeight - displayRect.y - displayRect.h)}
                            fill="rgba(0,0,0,0.45)"
                            listening={false}
                          />
                          <Rect
                            x={0}
                            y={displayRect.y}
                            width={displayRect.x}
                            height={displayRect.h}
                            fill="rgba(0,0,0,0.45)"
                            listening={false}
                          />
                          <Rect
                            x={displayRect.x + displayRect.w}
                            y={displayRect.y}
                            width={Math.max(0, stageWidth - displayRect.x - displayRect.w)}
                            height={displayRect.h}
                            fill="rgba(0,0,0,0.45)"
                            listening={false}
                          />
                          <Rect
                            x={displayRect.x}
                            y={displayRect.y}
                            width={displayRect.w}
                            height={displayRect.h}
                            stroke={drawingRect ? '#93c5fd' : '#3b82f6'}
                            strokeWidth={2}
                            dash={drawingRect ? [5, 4] : [8, 3]}
                            fill="rgba(59, 130, 246, 0.06)"
                            listening={false}
                          />
                        </>
                      )}
                    </Layer>
                  </Stage>

                  {(isLoading || isSegmenting) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#050914]/80 backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-white">
                          <Loader2 className="animate-spin" size={16} /> AI 치아 분석 중...
                        </div>
                        <p className="text-[11px] text-white/55">치아 세그멘테이션 + FDI 번호 인식 중</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-5 left-1/2 z-10 w-[min(92%,620px)] -translate-x-1/2 rounded-2xl bg-slate-950/80 px-4 py-3 text-white shadow-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">치아 복원</p>
                        <p className={`mt-0.5 text-xs ${restoration.phase === 'failed' ? 'text-rose-300' : 'text-white/70'}`}>{restorationStatus}</p>
                      </div>
                      {restoration.isBusy && <button type="button" onClick={restoration.cancel} className="rounded-lg px-2 py-1 text-xs font-bold text-white/80 hover:bg-white/10">취소</button>}
                    </div>
                    {restoration.resultUrls.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {restoration.resultUrls.map((url, index) => (
                          <figure key={url} className="overflow-hidden rounded-lg bg-white/10">
                            <img src={url} alt={`복원 후보 ${index + 1}`} className="aspect-[4/3] w-full object-contain" />
                            <figcaption className={`px-2 py-1 text-[10px] font-bold ${restoration.job?.mock === false ? 'text-emerald-200' : 'text-amber-200'}`}>{restoration.job?.mock === false ? 'AI 복원 결과' : '개발용 Mock 결과'} · 후보 {index + 1}</figcaption>
                          </figure>
                        ))}
                      </div>
                    )}
                    {restoration.phase === 'failed' && <button type="button" onClick={restoration.reset} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-white/75 hover:text-white"><X size={13} /> 오류 닫기</button>}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽 사이드바: 치료 계획 */}
        <TreatmentPlanPanel
          selectedTreatments={selectedTreatments}
          onToggle={toggleTreatment}
          onRemoveTemp={(fdi, itemId, categoryId) => {
            setSelectedTreatmentsLocal(prev =>
              prev.filter(s => !(s.fdi === fdi && s.item.id === itemId && s.category.id === categoryId))
            )
          }}
          isLoading={isLoading || isSegmenting}
          canStart={canStart}
          imageUploaded={Boolean(preview)}
          onStart={handleStartAnalysis}
          selectedFdiNumbers={selectedFdiNumbers}
        />
          </div>
        </div>
      </main>
    </div>
  )
}


// ─── 좌측 탭 사이드바 (환자목록 + 사진보관함) ─────────────────────────────────
