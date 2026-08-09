import { useDentalAnalysisStore } from '@/features/dental-analysis/model/useDentalAnalysisStore'
import { ScenarioDetail } from '@/features/treatment-simulation/components/ScenarioDetail'
import { ScenarioGrid } from '@/features/treatment-simulation/components/ScenarioGrid'
import { useTreatmentSimulation } from '@/features/treatment-simulation/hooks/useTreatmentSimulation'
import type { Scenario } from '@/features/treatment-plan/model/types'
import { useTreatmentPlanStore } from '@/features/treatment-plan/model/useTreatmentPlanStore'
import { usePatientStore } from '@/store/usePatientStore'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function TreatmentViewerPage() {
  const navigate = useNavigate()
  const uploadedImage = useDentalAnalysisStore(state => state.uploadedImage)
  const setSelectedFdiNumbers = useDentalAnalysisStore(state => state.setSelectedFdiNumbers)
  const patient = usePatientStore(state => state.selectedPatient)
  const scenarios = useTreatmentPlanStore(state => state.scenarios)
  const setScenarios = useTreatmentPlanStore(state => state.setScenarios)
  const generatingScenarioId = useTreatmentPlanStore(state => state.generatingScenarioId)
  const setSelectedTreatments = useTreatmentPlanStore(state => state.setSelectedTreatments)
  const setEditingScenarioId = useTreatmentPlanStore(state => state.setEditingScenarioId)
  const [detailScenario, setDetailScenario] = useState<Scenario | null>(null)
  const { completedCount, steps } = useTreatmentSimulation()

  const editScenario = (scenario: Scenario) => {
    setSelectedTreatments(scenario.treatments)
    setSelectedFdiNumbers(scenario.selectedFdiNumbers)
    setEditingScenarioId(scenario.id)
    navigate('/')
  }

  const createScenario = () => {
    setSelectedTreatments([])
    setSelectedFdiNumbers([])
    setEditingScenarioId(null)
    navigate('/')
  }

  if (detailScenario) {
    return <ScenarioDetail scenario={detailScenario} uploadedImage={uploadedImage ?? ''} onClose={() => setDetailScenario(null)} />
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#f4f5f8]">
      <header className="flex h-20 shrink-0 items-center justify-between border-b border-[#e4e9f0] bg-white px-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-den-ink" />
          </button>
          <div>
            <h1 className="text-lg font-black text-den-ink">치료 계획 결과</h1>
            <p className="mt-0.5 text-xs font-semibold text-den-muted">{patient?.name ?? '김민지'}님 &nbsp;&middot;&nbsp; {scenarios.length}개 옵션</p>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-8">
        <ScenarioGrid
          scenarios={scenarios}
          generatingScenarioId={generatingScenarioId}
          completedCount={completedCount}
          stepCount={steps.length}
          onOpen={setDetailScenario}
          onEdit={editScenario}
          onDelete={id => setScenarios(scenarios.filter(scenario => scenario.id !== id))}
          onCreate={createScenario}
        />
      </main>
    </div>
  )
}
