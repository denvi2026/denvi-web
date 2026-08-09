import type { Patient } from '@/features/patient/model/types'
import { Search, User } from 'lucide-react'

export const PatientPhotoSidebar = ({
  selectedPatient,
  patients,
  onSelectPatient,
}: {
  selectedPatient: Patient | null
  patients: Patient[]
  onSelectPatient: (patient: Patient) => void
}) => {
  return (
    <aside className="flex w-[252px] shrink-0 flex-col overflow-hidden bg-transparent">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
        <div className="shrink-0 px-6 pb-4 pt-2">
          <h2 className="text-lg font-black text-den-ink">환자 목록</h2>
          <p className="mt-2 text-xs font-bold text-den-muted">{patients.length}명</p>
          <div className="mt-4 flex h-10 items-center gap-2 rounded-lg bg-[#e1e6ee] px-4 text-[#98a2b3]">
            <Search size={18} />
            <span className="text-xs font-medium">환자를 검색하세요.</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-0 pb-5 mt-4">
          {patients.map(patient => {
            const active = selectedPatient?.id === patient.id
            return (
              <button
                key={patient.id}
                onClick={() => onSelectPatient(patient)}
                className={`mx-0 flex w-full items-center gap-4 px-6 py-4 text-left transition-all ${
                  active
                    ? 'border border-den-blue bg-[#dfe4ff] text-den-blue shadow-[inset_0_0_0_1px_#1332ff]'
                    : 'text-den-ink hover:bg-[#f6f8fb]'
                } ${active ? 'rounded-xl' : ''}`}
              >
                <User size={22} className={active ? 'shrink-0 text-den-blue' : 'shrink-0 text-[#1f2937]'} fill="currentColor" />
                <div>
                  <div className="text-base font-black text-[#3b4654]">{patient.name}</div>
                  <div className="mt-1 text-sm font-medium text-den-muted">2000.00.00</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

// ─── 치아 도식도 ───────────────────────────────────────────────────────────────
