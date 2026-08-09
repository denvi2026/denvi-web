import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Patient } from '@/features/patient/model/types'

interface PatientStore {
  selectedPatient: Patient | null
  setSelectedPatient: (patient: Patient) => void
  clearSelectedPatient: () => void
}

export const usePatientStore = create<PatientStore>()(
  persist(
    set => ({
      selectedPatient: null,
      setSelectedPatient: patient => set({ selectedPatient: patient }),
      clearSelectedPatient: () => set({ selectedPatient: null }),
    }),
    { name: 'denvi-patient' },
  ),
)
