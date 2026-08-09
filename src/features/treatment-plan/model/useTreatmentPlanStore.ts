import type { Scenario, StoredTreatment } from './types'
import { create } from 'zustand'

interface TreatmentPlanStore {
  selectedTreatments: StoredTreatment[]
  scenarios: Scenario[]
  editingScenarioId: string | null
  generatingScenarioId: string | null
  setSelectedTreatments: (treatments: StoredTreatment[]) => void
  setScenarios: (scenarios: Scenario[]) => void
  setEditingScenarioId: (id: string | null) => void
  setGeneratingScenarioId: (id: string | null) => void
  resetTreatmentPlan: () => void
}

const initialState = {
  selectedTreatments: [] as StoredTreatment[],
  scenarios: [] as Scenario[],
  editingScenarioId: null,
  generatingScenarioId: null,
}

export const useTreatmentPlanStore = create<TreatmentPlanStore>()(set => ({
  ...initialState,
  setSelectedTreatments: selectedTreatments => set({ selectedTreatments }),
  setScenarios: scenarios => set({ scenarios }),
  setEditingScenarioId: editingScenarioId => set({ editingScenarioId }),
  setGeneratingScenarioId: generatingScenarioId => set({ generatingScenarioId }),
  resetTreatmentPlan: () => set({ ...initialState }),
}))
