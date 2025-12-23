import { Link, useLocation } from 'react-router-dom'
import {
  Squares2X2Icon,
  UserIcon,
  DocumentTextIcon,
  ScissorsIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Squares2X2Icon },
  { name: 'Contacts', href: '/contacts', icon: UserIcon },
  { name: 'Applications', href: '/applications', icon: DocumentTextIcon },
  { name: 'Tailor Resume', href: '/tailor-resume', icon: ScissorsIcon },
  { name: 'Interview Training', href: '/interview-training', icon: AcademicCapIcon },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm min-h-[calc(100vh-4rem)]" aria-label="Main navigation">
      <nav className="p-4" aria-label="Primary navigation">
        <ul className="space-y-2" role="list">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                    aria-hidden="true"
                  />
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
