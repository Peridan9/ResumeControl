import { ReactNode, ButtonHTMLAttributes } from 'react'
import './Button.css'

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
  // Base Tailwind classes for all buttons
  const baseClasses = [
    'relative',
    'overflow-hidden',
    'px-9',
    'py-4',
    'rounded-md',
    'border-2',
    'font-medium',
    'uppercase',
    'transition-all',
    'duration-500',
    'ease-in-out',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-blue-500',
    'focus:ring-offset-2',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
  ]

  // Variant-specific classes using Tailwind
  const variantClasses = {
    primary: [
      'bg-white',
      'dark:bg-gray-800',
      'text-gray-600',
      'dark:text-gray-300',
      'border-gray-600',
      'dark:border-gray-400',
      'hover:bg-gray-600',
      'dark:hover:bg-gray-600',
      'hover:text-white',
      'dark:hover:text-white',
      'hover:border-gray-900',
      'dark:hover:border-gray-200',
    ],
    secondary: [
      'bg-white',
      'dark:bg-gray-800',
      'text-gray-400',
      'dark:text-gray-400',
      'border-gray-400',
      'dark:border-gray-500',
      'hover:bg-gray-400',
      'dark:hover:bg-gray-500',
      'hover:text-white',
      'dark:hover:text-white',
      'hover:border-gray-500',
      'dark:hover:border-gray-400',
    ],
    danger: [
      'bg-white',
      'dark:bg-gray-800',
      'text-red-600',
      'dark:text-red-400',
      'border-red-600',
      'dark:border-red-400',
      'hover:bg-red-600',
      'dark:hover:bg-red-600',
      'hover:text-white',
      'dark:hover:text-white',
      'hover:border-red-700',
      'dark:hover:border-red-500',
    ],
    success: [
      'bg-white',
      'dark:bg-gray-800',
      'text-gray-400',
      'dark:text-gray-400',
      'border-gray-400',
      'dark:border-gray-500',
      'hover:bg-green-600',
      'dark:hover:bg-green-600',
      'hover:text-white',
      'dark:hover:text-white',
      'hover:border-gray-500',
      'dark:hover:border-gray-400',
    ],
  }

  // Stripe pattern class (from custom CSS)
  const stripeClass = `btn-stripe btn-stripe-${variant}`

  // Combine all classes
  const allClasses = [
    ...baseClasses,
    ...variantClasses[variant],
    stripeClass,
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
