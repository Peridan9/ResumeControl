import { Link, useLocation } from 'react-router-dom'

const navigation = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Companies', href: '/companies', icon: '🏢' },
  { name: 'Jobs', href: '/jobs', icon: '💼' },
  { name: 'Applications', href: '/applications', icon: '📝' },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)]">
      <nav className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

