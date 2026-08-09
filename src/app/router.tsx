import DentalLayout from '@/layouts/DentalLayout'
import TreatmentConsolePage from '@/pages/TreatmentConsolePage'
import TreatmentViewerPage from '@/pages/TreatmentViewerPage'
import { Navigate, Route, Routes } from 'react-router-dom'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<DentalLayout />}>
        <Route index element={<TreatmentConsolePage />} />
        <Route path="viewer" element={<TreatmentViewerPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
