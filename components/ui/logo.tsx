'use client'

import { cn } from '@/lib/utils'
import { Icons } from '@/components/icons'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: {
      icon: 'h-5 w-5',
      text: 'text-lg',
      container: 'space-x-2'
    },
    md: {
      icon: 'h-6 w-6',
      text: 'text-xl',
      container: 'space-x-2'
    },
    lg: {
      icon: 'h-8 w-8',
      text: 'text-2xl',
      container: 'space-x-3'
    }
  }

  const sizes = sizeClasses[size]

  return (
    <div className={cn('flex items-center', sizes.container, className)}>
      <div className="relative">
        <Icons.composio className={cn(
          sizes.icon,
          'text-primary'
        )} />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            'font-bold tracking-tight text-foreground',
            sizes.text
          )}>
            Composio
          </span>
        </div>
      )}
    </div>
  )
}
