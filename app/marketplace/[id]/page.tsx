'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Star, Eye, Download, ExternalLink, Shield, Zap, Users } from 'lucide-react'
import { marketplaceApps } from '@/lib/data/marketplace-apps'
import { MarketplaceHeader } from '@/components/marketplace/header'
import { useWorkspace, useWorkspaceTools } from '@/lib/hooks/use-workspace'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function AppDetailPage() {
  const params = useParams()
  const appId = params.id as string
  const [isInstalling, setIsInstalling] = useState(false)
  const { currentWorkspace, permissions } = useWorkspace()
  const { tools, enableTool, disableTool } = useWorkspaceTools(currentWorkspace?.id?.toString() || '')

  const app = marketplaceApps.find(a => a.id === appId)
  const isToolEnabled = tools.some(tool => tool.tool_slug === appId || tool.toolSlug === appId)
  
  if (!app) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">App not found</h1>
            <p className="text-gray-600 mb-4">The app you're looking for doesn't exist.</p>
            <Link href="/marketplace" className="text-blue-600 hover:text-blue-700">
              ← Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleInstall = async () => {
    if (!currentWorkspace || !permissions?.canManageTools) return

    setIsInstalling(true)
    try {
      if (isToolEnabled) {
        await disableTool(appId)
      } else {
        await enableTool(appId)
      }
    } catch (error) {
      console.error('Error toggling tool:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <MarketplaceHeader />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-8">
        {/* Back Button */}
        <Link 
          href="/marketplace" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* App Header */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <div className="flex items-start space-x-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${app.iconBg}`}>
                  <span className="text-white font-bold text-2xl">{app.icon}</span>
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{app.name}</h1>
                  <p className="text-gray-600 mb-4">{app.description}</p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>{app.stars} stars</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{app.views} views</span>
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {app.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About {app.name}</h2>
              <p className="text-gray-600 leading-relaxed">
                {app.longDescription || app.description}
              </p>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Secure & Reliable</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-700">Fast Performance</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-700">Team Collaboration</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <ExternalLink className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-700">Easy Integration</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Install Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {app.pricing === 'free' ? 'Free' : app.pricing === 'paid' ? 'Paid' : 'Freemium'}
                </div>
                <p className="text-gray-600 text-sm">
                  {app.pricing === 'free' ? 'No cost to use' : 'Pricing available'}
                </p>
              </div>
              
              {permissions?.canManageTools && currentWorkspace ? (
                <div className="space-y-2">
                  <Button
                    onClick={handleInstall}
                    disabled={isInstalling}
                    variant={isToolEnabled ? 'destructive' : 'default'}
                    className="w-full"
                    size="lg"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isInstalling
                      ? (isToolEnabled ? 'Disabling...' : 'Enabling...')
                      : (isToolEnabled ? 'Disable' : 'Install App')
                    }
                  </Button>
                  {isToolEnabled && (
                    <Button
                      onClick={handleInstall}
                      disabled={isInstalling}
                      variant="secondary"
                      className="w-full"
                    >
                      {isInstalling ? 'Disabling...' : 'Disable'}
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  disabled
                  variant="secondary"
                  className="w-full"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Requires Workspace
                </Button>
              )}
              
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  By installing, you agree to the app's terms of service
                </p>
              </div>
            </div>

            {/* App Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">App Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Provider</span>
                  <p className="font-medium text-gray-900">{app.provider}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Category</span>
                  <p className="font-medium text-gray-900">{app.category}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Tags</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {app.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
