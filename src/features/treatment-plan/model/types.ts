import type { SelectedRegion } from '@/features/dental-analysis/model/types'

export type TreatmentPhase = 'MVP' | 'P2' | 'P3'

export type TreatmentItem = {
  id: string
  name: string
  description: string
  phase: TreatmentPhase
  rootOverlay?: boolean
}

export type TreatmentCategory = {
  id: string
  label: string
  color: string
  rootOverlay?: boolean
  items: TreatmentItem[]
}

export type StoredTreatment = {
  itemId: string
  itemName: string
  itemDescription: string
  imagePrompt: string
  categoryId: string
  categoryLabel: string
}

export type Scenario = {
  id: string
  title: string
  teeth: string
  cost: string
  prognosis: string
  image: string | null
  treatments: StoredTreatment[]
  selectedFdiNumbers: number[]
}

export type TreatmentStepStatus = 'pending' | 'loading' | 'done' | 'error'

export type TreatmentStep = {
  id: string
  treatment: StoredTreatment
  additionalReq: string
  status: TreatmentStepStatus
  beforeImage: string | null
  afterImage: string | null
  errorMsg: string
  region: SelectedRegion | null
}
