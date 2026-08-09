import { Bell, Bookmark, Clock3, UserRound } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

const DentalSidebar = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const navItems = [
    { icon: Bookmark, label: '진료 콘솔', path: '/' },
    { icon: Clock3, label: '기록', path: '/viewer' },
    { icon: Bell, label: '알림', path: '#' },
  ]

  return (
    <aside className="sticky top-0 flex h-screen w-[72px] shrink-0 flex-col items-center border-r border-den-line bg-white/92 shadow-[1px_0_0_rgba(15,23,42,0.04)]">
      <nav className="flex flex-1 flex-col items-center gap-7 pt-6">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.path
          return (
            <button
              key={item.label}
              type="button"
              title={item.label}
              onClick={() => {
                if (item.path !== '#') {
                  navigate(item.path)
                }
              }}
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                isActive
                  ? 'bg-den-blue-selected text-den-blue shadow-[0_8px_18px_rgba(19,50,255,0.16)]'
                  : 'text-[#a5afbd] hover:bg-[#f3f6fb] hover:text-[#4b5563]'
              }`}
            >
              <Icon size={21} fill={isActive ? 'currentColor' : 'none'} strokeWidth={2.4} />
              {item.label === '알림' && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#ff2d3d]" />}
            </button>
          )
        })}
      </nav>

      <div className="pb-6">
        <button
          type="button"
          title="프로필"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-den-blue text-white shadow-[0_12px_26px_rgba(19,50,255,0.28)]"
        >
          <UserRound size={22} fill="currentColor" />
        </button>
      </div>
    </aside>
  )
}

export default DentalSidebar

