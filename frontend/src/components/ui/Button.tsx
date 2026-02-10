import { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = [
    'px-4',
    'py-2',
    'rounded',
    'border',
    'font-medium',
    'text-sm',
    'transition-colors',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-blue-500',
    'focus:ring-offset-1',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
  ]

  const variantClasses = {
    primary: [
      'bg-gray-800',
      'dark:bg-gray-200',
      'text-white',
      'dark:text-gray-900',
      'border-gray-800',
      'dark:border-gray-200',
      'hover:bg-gray-700',
      'dark:hover:bg-gray-300',
    ],
    secondary: [
      'bg-white',
      'dark:bg-gray-800',
      'text-gray-700',
      'dark:text-gray-200',
      'border-gray-300',
      'dark:border-gray-600',
      'hover:bg-gray-50',
      'dark:hover:bg-gray-700',
    ],
    danger: [
      'bg-red-600',
      'dark:bg-red-500',
      'text-white',
      'border-red-600',
      'dark:border-red-500',
      'hover:bg-red-700',
      'dark:hover:bg-red-600',
    ],
    success: [
      'bg-green-600',
      'dark:bg-green-500',
      'text-white',
      'border-green-600',
      'dark:border-green-500',
      'hover:bg-green-700',
      'dark:hover:bg-green-600',
    ],
  }

  const allClasses = [
    ...baseClasses,
    ...variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      className={allClasses}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
