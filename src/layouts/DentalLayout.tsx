import DentalSidebar from './DentalSidebar'
import { Outlet } from 'react-router-dom'

export default function DentalLayout() {
  return (
    <div className="relative flex min-h-screen bg-den-gray font-sans text-den-ink">
      <DentalSidebar />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
