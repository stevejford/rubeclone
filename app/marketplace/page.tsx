'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { MarketplaceHeader } from '@/components/marketplace/header'
import { SearchAndFilters } from '@/components/marketplace/search-and-filters'
import { AppCard } from '@/components/marketplace/app-card'
import { AppGridSkeleton, LoadingMore } from '@/components/marketplace/loading-states'
import { AuthPromptModal } from '@/components/auth/auth-prompt-modal'
import { useInfiniteMarketplace } from '@/lib/hooks/use-infinite-marketplace'
import { useInstallPrompt } from '@/lib/hooks/use-install-prompt'
import { RealMarketplaceApp } from '@/types/marketplace'
import { UI_CATEGORIES } from '@/lib/constants/categories'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle } from 'lucide-react'

export default function MarketplacePage() {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  // Use infinite scroll hook
  const {
    apps,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    total,
    filters,
    setFilters
  } = useInfiniteMarketplace({
    initialFilters: {
      query: '',
      sort: 'popularity'
    }
  })

  // Use install prompt hook for unauthenticated users
  const {
    isPromptOpen,
    promptToolName,
    closePrompt
  } = useInstallPrompt()

  // Check for OAuth callback messages
  const successMessage = searchParams.get('success') === 'true' ? searchParams.get('message') : null
  const errorMessage = searchParams.get('error') === 'true' ? searchParams.get('message') : null

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingMore, loadMore])

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <MarketplaceHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-4">Failed to load marketplace apps.</p>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:text-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <MarketplaceHeader />

      <main className="flex-1 container mx-auto px-6 py-8">
        {/* OAuth Callback Messages */}
        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Tool Marketplace
          </h1>
          <p className="text-lg text-gray-600">
            Discover and integrate powerful AI tools for your workflows
          </p>
          {total > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              {total} tools available
            </p>
          )}
        </div>

        {/* Main Content Layout with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <SearchAndFilters
                filters={filters}
                onFiltersChange={setFilters}
                categories={UI_CATEGORIES}
              />
            </div>
          </aside>

          {/* Main Content - Apps Grid */}
          <div className="lg:col-span-3">
          {loading ? (
            <AppGridSkeleton />
          ) : apps.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-2">No apps found</p>
              <p className="text-gray-500">
                Loading marketplace apps...
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {apps.map((app: RealMarketplaceApp) => (
                  <AppCard key={app.slug} app={app} />
                ))}
              </div>

              {/* Load More Trigger */}
              <div ref={loadMoreRef} className="mt-8">
                {loadingMore && (
                  <div className="flex justify-center">
                    <LoadingMore />
                  </div>
                )}
                {!hasMore && apps.length > 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      You've reached the end of the marketplace
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
          </div>
        </div>
      </main>

      {/* Auth Prompt Modal for unauthenticated users */}
      <AuthPromptModal
        open={isPromptOpen}
        onOpenChange={closePrompt}
        {...(promptToolName && { toolName: promptToolName })}
      />
    </div>
  )
}


