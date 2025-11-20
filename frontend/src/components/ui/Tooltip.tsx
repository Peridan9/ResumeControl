import { ReactNode, useState } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'max'
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  maxWidth = 'xs',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  // Don't render tooltip if content is empty
  if (!content || (typeof content === 'string' && content.trim() === '')) {
    return <>{children}</>
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 transform -translate-y-1/2 border-b-gray-900 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-900 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-900 border-t-transparent border-b-transparent border-l-transparent',
  }

  // Map maxWidth prop to Tailwind classes
  const maxWidthClasses = {
    xs: 'max-w-xs', // 20rem / 320px
    sm: 'max-w-sm', // 24rem / 384px
    md: 'max-w-md', // 28rem / 448px
    lg: 'max-w-lg', // 32rem / 512px
    xl: 'max-w-xl', // 36rem / 576px
    '2xl': 'max-w-2xl', // 42rem / 672px
    max: 'w-max max-w-2xl', // Fit content, but cap at 2xl
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 ${positionClasses[position]} px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-normal ${maxWidthClasses[maxWidth]} pointer-events-none`}
        >
          {content}
          <div
            className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  )
}
