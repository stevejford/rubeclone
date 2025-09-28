'use client'

import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Skeleton card component
export function AppCardSkeleton({ variant = 'grid' }: { variant?: 'grid' | 'list' }) {
  if (variant === 'list') {
    return (
      <div className="app-card group flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-white rounded-lg border border-gray-200 animate-pulse">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-200 flex-shrink-0"></div>
        <div className="flex-1 min-w-0">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="hidden md:flex items-center space-x-3 flex-shrink-0">
          <div className="h-3 bg-gray-200 rounded w-16"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
          <div className="h-6 bg-gray-200 rounded w-20"></div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="h-8 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-card group bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-5 h-full flex flex-col animate-pulse">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-200 flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
        <div className="w-3 h-3 rounded-full bg-gray-200 flex-shrink-0"></div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="h-3 bg-gray-200 rounded w-16"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>

      <div className="mt-auto pt-2">
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <div className="h-6 bg-gray-200 rounded w-16"></div>
          <div className="h-6 bg-gray-200 rounded w-12"></div>
          <div className="h-6 bg-gray-200 rounded w-14"></div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="h-8 bg-gray-200 rounded w-8"></div>
          <div className="h-8 bg-gray-200 rounded flex-1 max-w-[120px]"></div>
        </div>
      </div>
    </div>
  )
}

// Loading more indicator
export function LoadingMore() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center space-x-2 text-gray-600">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">Loading more apps...</span>
      </div>
    </div>
  )
}

// Load more button
export function LoadMoreButton({ 
  onClick, 
  loading = false, 
  hasMore = true 
}: { 
  onClick: () => void
  loading?: boolean
  hasMore?: boolean 
}) {
  if (!hasMore) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-2">🎉 You've reached the end!</p>
          <p className="text-gray-400 text-xs">No more apps to load</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-8">
      <Button
        onClick={onClick}
        disabled={loading}
        variant="outline"
        size="lg"
        className="min-w-[200px] h-12 text-base font-medium hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading more...
          </>
        ) : (
          <>
            <RefreshCw className="w-5 h-5 mr-2" />
            Load more apps
          </>
        )}
      </Button>
    </div>
  )
}

// Skeleton grid for initial loading
export function AppGridSkeleton({ 
  count = 12, 
  variant = 'grid' 
}: { 
  count?: number
  variant?: 'grid' | 'list' 
}) {
  if (variant === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <AppCardSkeleton key={i} variant="list" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <AppCardSkeleton key={i} variant="grid" />
      ))}
    </div>
  )
}

// Refreshing indicator
export function RefreshingIndicator() {
  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-2 flex items-center space-x-2">
      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
      <span className="text-sm font-medium text-gray-700">Refreshing...</span>
    </div>
  )
}

// Smooth loading animation for new items
export function FadeInWrapper({ 
  children, 
  delay = 0 
}: { 
  children: React.ReactNode
  delay?: number 
}) {
  return (
    <div 
      className="animate-fade-in-up"
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  )
}


