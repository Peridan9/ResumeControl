import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  // Keyboard navigation for menu items
  useEffect(() => {
    if (!isOpen) return

    const menuItems = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')
    if (!menuItems || menuItems.length === 0) return

    const firstItem = menuItems[0]
    const lastItem = menuItems[menuItems.length - 1]
    let currentIndex = 0

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          currentIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0
          menuItems[currentIndex]?.focus()
          break
        case 'ArrowUp':
          e.preventDefault()
          currentIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1
          menuItems[currentIndex]?.focus()
          break
        case 'Home':
          e.preventDefault()
          currentIndex = 0
          firstItem?.focus()
          break
        case 'End':
          e.preventDefault()
          currentIndex = menuItems.length - 1
          lastItem?.focus()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      navigate('/login')
    } finally {
      setIsOpen(false)
    }
  }

  if (!user) return null

  const userInitials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        aria-label={`User menu, ${user.name || user.email}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        id="user-menu-button"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
          {userInitials}
        </div>
        
        {/* User Name */}
        <span className="hidden sm:block max-w-[120px] truncate">
          {user.name || user.email}
        </span>
        
        {/* Chevron Icon */}
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-50"
          role="menu"
          aria-labelledby="user-menu-button"
          aria-orientation="vertical"
        >
          <div className="py-1">
            {/* User Info Section */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.name || 'User'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>

            {/* Menu Items */}
            <button
              onClick={() => {
                setIsOpen(false)
                // Navigate to profile page when implemented
                // navigate('/profile')
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
              role="menuitem"
              tabIndex={0}
            >
              <UserCircleIcon className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              Profile
            </button>

            <button
              onClick={() => {
                setIsOpen(false)
                // Navigate to settings page when implemented
                // navigate('/settings')
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
              role="menuitem"
              tabIndex={0}
            >
              <Cog6ToothIcon className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              Settings
            </button>

            <div className="border-t border-gray-200 dark:border-gray-700 my-1" role="separator" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
              role="menuitem"
              tabIndex={0}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
