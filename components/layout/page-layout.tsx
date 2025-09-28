'use client'

import { ReactNode } from 'react'
import { UnifiedHeader } from './unified-header'
import { cn } from '@/lib/utils'

interface PageLayoutProps {
  children: ReactNode
  className?: string
  containerClassName?: string
  fullWidth?: boolean
}

export function PageLayout({ 
  children, 
  className, 
  containerClassName,
  fullWidth = false 
}: PageLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <UnifiedHeader />
      <main className={cn(
        'flex-1',
        !fullWidth && 'container mx-auto px-4 sm:px-6 lg:px-8',
        containerClassName
      )}>
        {children}
      </main>
    </div>
  )
}
