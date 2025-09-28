'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, Database, AlertCircle, CheckCircle } from 'lucide-react'
import { useCategoryAdmin, useCategories } from '@/lib/hooks/use-categories'

export default function CategoryAdminPage() {
  const { syncing, syncResult, syncCategories, getCategoryStats } = useCategoryAdmin()
  const { categories, loading, isFallback, refreshCategories } = useCategories()
  const [stats, setStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSync = async () => {
    try {
      setError(null)
      const result = await syncCategories()
      console.log('Sync completed:', result)
      
      // Refresh categories after sync
      await refreshCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    }
  }

  const handleGetStats = async () => {
    try {
      setError(null)
      const result = await getCategoryStats()
      setStats(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats')
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Category Management</h1>
          <p className="text-gray-600 mt-2">
            Manage marketplace categories and sync with Composio API
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGetStats} variant="outline">
            <Database className="w-4 h-4 mr-2" />
            Get Stats
          </Button>
          <Button onClick={handleSync} disabled={syncing}>
            {syncing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sync Categories
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isFallback && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Currently using fallback categories. Database may be unavailable.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Current Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Current Categories
            </CardTitle>
            <CardDescription>
              Categories currently available in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-3">
                  Total: {categories.length} categories
                </p>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {categories.map((category) => (
                    <div key={category.partnerKey} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{category.displayName}</span>
                      <Badge variant="secondary" className="text-xs">
                        {category.appCount || 0}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sync Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Sync Status
            </CardTitle>
            <CardDescription>
              Last synchronization results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {syncing ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2">Syncing categories...</span>
              </div>
            ) : syncResult ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Sync Completed</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Message: {syncResult.message}</p>
                  {syncResult.stats && (
                    <>
                      <p>Apps: {syncResult.stats.totalApps}</p>
                      <p>Categories: {syncResult.stats.totalCategories}</p>
                      <p>Avg per category: {syncResult.stats.avgAppsPerCategory}</p>
                    </>
                  )}
                </div>
                {syncResult.stats?.topCategories && (
                  <div>
                    <p className="text-sm font-medium mb-2">Top Categories:</p>
                    <div className="space-y-1">
                      {syncResult.stats.topCategories.map((cat: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs mr-1">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No sync performed yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Database Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Stats
            </CardTitle>
            <CardDescription>
              Current database statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{stats.stats?.totalCategories || 0}</p>
                    <p className="text-sm text-gray-600">Categories</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.stats?.totalApps || 0}</p>
                    <p className="text-sm text-gray-600">Apps</p>
                  </div>
                </div>
                {stats.stats?.lastSyncedAt && (
                  <p className="text-xs text-gray-500">
                    Last synced: {new Date(stats.stats.lastSyncedAt).toLocaleString()}
                  </p>
                )}
                {stats.stats?.topCategories && (
                  <div>
                    <p className="text-sm font-medium mb-2">Top Categories:</p>
                    <div className="space-y-1">
                      {stats.stats.topCategories.map((cat: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{cat.name}</span>
                          <Badge variant="secondary">{cat.appCount}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Click "Get Stats" to view database statistics</p>
                <Button onClick={handleGetStats} variant="outline" size="sm">
                  <Database className="w-4 h-4 mr-2" />
                  Load Stats
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p><strong>1. Sync Categories:</strong> Click "Sync Categories" to fetch the latest tools from Composio API and update the database.</p>
          <p><strong>2. View Stats:</strong> Click "Get Stats" to see current database statistics and category information.</p>
          <p><strong>3. Monitor Status:</strong> The sync status card shows the results of the last synchronization.</p>
          <p><strong>4. Automatic Updates:</strong> The marketplace will automatically use the updated categories after sync.</p>
        </CardContent>
      </Card>
    </div>
  )
}
