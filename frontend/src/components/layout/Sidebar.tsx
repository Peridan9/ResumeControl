import { Link, useLocation } from 'react-router-dom'
import {
  Squares2X2Icon,
  BuildingOfficeIcon,
  UserIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Squares2X2Icon },
  { name: 'Companies', href: '/companies', icon: BuildingOfficeIcon },
  { name: 'Contacts', href: '/contacts', icon: UserIcon },
  { name: 'Applications', href: '/applications', icon: DocumentTextIcon },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm min-h-[calc(100vh-4rem)]">
      <nav className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`} />
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
