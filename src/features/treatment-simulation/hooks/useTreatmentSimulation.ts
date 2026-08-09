import { useDentalAnalysisStore } from '@/features/dental-analysis/model/useDentalAnalysisStore'
import type { TreatmentStep } from '@/features/treatment-plan/model/types'
import { useTreatmentPlanStore } from '@/features/treatment-plan/model/useTreatmentPlanStore'
import { useCallback, useEffect, useRef, useState } from 'react'
import { treatmentSimulationApi } from '../api/treatmentSimulationApi'
import { compositeRegion, darkenOutsideRegion, normalizeBrightness } from '../utils/imageProcessing'

export function useTreatmentSimulation() {
  const uploadedImage = useDentalAnalysisStore(state => state.uploadedImage)
  const uploadedImageMimeType = useDentalAnalysisStore(state => state.uploadedImageMimeType)
  const selectedRegion = useDentalAnalysisStore(state => state.selectedRegion)
  const selectedTreatments = useTreatmentPlanStore(state => state.selectedTreatments)
  const scenarios = useTreatmentPlanStore(state => state.scenarios)
  const setScenarios = useTreatmentPlanStore(state => state.setScenarios)
  const generatingScenarioId = useTreatmentPlanStore(state => state.generatingScenarioId)
  const setGeneratingScenarioId = useTreatmentPlanStore(state => state.setGeneratingScenarioId)

  const [steps, setSteps] = useState<TreatmentStep[]>(() => {
    const scenario = scenarios.find(item => item.id === generatingScenarioId)
    return (scenario?.treatments ?? selectedTreatments).map((treatment, index) => ({
      id: `step-${index}-${Date.now() + index}`,
      treatment,
      additionalReq: treatment.imagePrompt?.trim() || treatment.itemDescription,
      status: 'pending',
      beforeImage: index === 0 ? uploadedImage : null,
      afterImage: null,
      errorMsg: '',
      region: selectedRegion,
    }))
  })
  const stepsRef = useRef(steps)
  const abortRef = useRef<AbortController | null>(null)
  const startedRef = useRef(false)

  useEffect(() => { stepsRef.current = steps }, [steps])

  const updateSteps = useCallback((updater: (current: TreatmentStep[]) => TreatmentStep[]) => {
    setSteps(current => {
      const next = updater(current)
      stepsRef.current = next
      return next
    })
  }, [])

  const generateFromIndex = useCallback(async (fromIndex: number, signal: AbortSignal) => {
    updateSteps(previous => previous.map((step, index) => index < fromIndex ? step : { ...step, status: 'pending', afterImage: null, errorMsg: '' }))

    for (let index = fromIndex; index < stepsRef.current.length; index++) {
      if (signal.aborted) return
      const beforeImage = index === 0 ? uploadedImage : stepsRef.current[index - 1].afterImage
      if (!beforeImage) return
      const step = stepsRef.current[index]
      updateSteps(previous => previous.map((item, itemIndex) => itemIndex === index ? { ...item, status: 'loading', beforeImage } : item))
      try {
        const preparedImage = step.region ? await darkenOutsideRegion(beforeImage, step.region) : beforeImage
        const generatedImage = await treatmentSimulationApi.generateTreatmentSimulation({
          imageBase64: preparedImage,
          imageMimeType: step.region ? 'image/png' : (uploadedImageMimeType ?? 'image/png'),
          description: step.additionalReq.trim() || step.treatment.itemDescription,
          treatmentCategories: [step.treatment.categoryId],
          signal,
        })
        const composited = step.region ? await compositeRegion(beforeImage, generatedImage, step.region) : generatedImage
        const result = await normalizeBrightness(beforeImage, composited).catch(() => composited)
        updateSteps(previous => previous.map((item, itemIndex) => itemIndex === index ? { ...item, status: 'done', afterImage: result } : item))
      } catch (error) {
        if ((error as { name?: string }).name === 'AbortError') return
        updateSteps(previous => previous.map((item, itemIndex) => itemIndex === index ? { ...item, status: 'error', errorMsg: (error as Error).message || '생성 실패' } : item))
        return
      }
    }
  }, [updateSteps, uploadedImage, uploadedImageMimeType])

  useEffect(() => {
    if (startedRef.current || !uploadedImage || stepsRef.current.length === 0) return
    const firstPendingIndex = stepsRef.current.findIndex(step => step.status === 'pending' || step.status === 'error')
    if (firstPendingIndex < 0) return
    startedRef.current = true
    const controller = new AbortController()
    abortRef.current = controller
    void generateFromIndex(firstPendingIndex, controller.signal)
    return () => controller.abort()
  }, [generateFromIndex, uploadedImage])

  useEffect(() => {
    if (!generatingScenarioId || steps.length === 0 || !steps.every(step => step.status === 'done')) return
    const finalImage = steps.at(-1)?.afterImage
    if (!finalImage) return
    setScenarios(scenarios.map(scenario => scenario.id === generatingScenarioId ? { ...scenario, image: finalImage } : scenario))
    setGeneratingScenarioId(null)
  }, [generatingScenarioId, scenarios, setGeneratingScenarioId, setScenarios, steps])

  return {
    completedCount: steps.filter(step => step.status === 'done').length,
    steps,
  }
}
