import type { SelectedRegion, ToothSegment } from './types'
import { create } from 'zustand'

interface DentalAnalysisStore {
  uploadedImage: string | null
  uploadedImageMimeType: string | null
  selectedRegion: SelectedRegion | null
  segmentedTeeth: ToothSegment[]
  selectedFdiNumbers: number[]
  setUploadedImage: (image: string | null, mimeType?: string | null) => void
  setSelectedRegion: (region: SelectedRegion | null) => void
  setSegmentedTeeth: (teeth: ToothSegment[]) => void
  setSelectedFdiNumbers: (fdis: number[]) => void
  resetAnalysis: () => void
}

const initialState = {
  uploadedImage: null,
  uploadedImageMimeType: null,
  selectedRegion: null,
  segmentedTeeth: [] as ToothSegment[],
  selectedFdiNumbers: [] as number[],
}

export const useDentalAnalysisStore = create<DentalAnalysisStore>()(set => ({
  ...initialState,
  setUploadedImage: (uploadedImage, uploadedImageMimeType = null) => set({ uploadedImage, uploadedImageMimeType }),
  setSelectedRegion: selectedRegion => set({ selectedRegion }),
  setSegmentedTeeth: segmentedTeeth => set({ segmentedTeeth }),
  setSelectedFdiNumbers: selectedFdiNumbers => set({ selectedFdiNumbers }),
  resetAnalysis: () => set({ ...initialState }),
}))
