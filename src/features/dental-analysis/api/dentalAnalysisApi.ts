import type { DentalPrediction, ToothSegment } from '../model/types'

export type DentalAnalysisResult = { predictions: DentalPrediction[] }
export type ToothSegmentationResult = { teeth: ToothSegment[]; source: 'mock' }

export interface DentalAnalysisApi {
  isAvailable(): Promise<boolean>
  analyzeImage(imageFile: File): Promise<DentalAnalysisResult>
  segmentTeeth(imageBase64: string, imageMimeType?: string): Promise<ToothSegmentationResult>
}

const MOCK_TEETH: ToothSegment[] = [
  { fdi: 13, x: 0.25, y: 0.42, width: 0.1, height: 0.3, conf: 1 },
  { fdi: 12, x: 0.35, y: 0.4, width: 0.09, height: 0.31, conf: 1 },
  { fdi: 11, x: 0.45, y: 0.39, width: 0.1, height: 0.32, conf: 1 },
  { fdi: 21, x: 0.55, y: 0.39, width: 0.1, height: 0.32, conf: 1 },
  { fdi: 22, x: 0.65, y: 0.4, width: 0.09, height: 0.31, conf: 1 },
  { fdi: 23, x: 0.75, y: 0.42, width: 0.1, height: 0.3, conf: 1 },
]

const mockDentalAnalysisApi: DentalAnalysisApi = {
  async isAvailable() {
    return true
  },
  async analyzeImage() {
    await Promise.resolve()
    return { predictions: [] }
  },
  async segmentTeeth() {
    await new Promise(resolve => window.setTimeout(resolve, 350))
    return { teeth: MOCK_TEETH, source: 'mock' }
  },
}

// Replace this adapter with an HTTP implementation when the GPU service is available.
export const dentalAnalysisApi: DentalAnalysisApi = mockDentalAnalysisApi
