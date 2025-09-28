import { Search, Star, ChevronDown } from 'lucide-react'
import { AppCard } from '@/components/marketplace/app-card'
import { getAppsByCategory } from '@/lib/data/marketplace-apps'
import { PageLayout } from '@/components/layout/page-layout'

export default function HomePage() {
  const featuredApps = getAppsByCategory('Featured')
  return (
    <PageLayout className="bg-gray-50" fullWidth>
      {/* Hero Section */}
      <section className="rube-hero py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-6 text-white">
            Explore AI Tool Marketplace of 500+ apps
          </h1>
          <button className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2 mx-auto">
            <span>Get Started with</span>
            <span className="font-semibold">AI Tools</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 category-sidebar">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <div className="category-item active">
              <Star className="w-4 h-4" />
              <span>Featured</span>
            </div>
            <div className="category-item">
              <span className="w-4 h-4 flex items-center justify-center">🛠️</span>
              <span>Developer Tools</span>
            </div>
            <div className="category-item">
              <span className="w-4 h-4 flex items-center justify-center">💬</span>
              <span>Collaboration & Communication</span>
            </div>
            <div className="category-item">
              <span className="w-4 h-4 flex items-center justify-center">🤖</span>
              <span>AI & ML</span>
            </div>
            <div className="category-item">
              <span className="w-4 h-4 flex items-center justify-center">📁</span>
              <span>File Management</span>
            </div>
            <div className="category-item">
              <span className="w-4 h-4 flex items-center justify-center">📊</span>
              <span>Project Management</span>
            </div>
            <div className="category-item">
              <span className="w-4 h-4 flex items-center justify-center">👥</span>
              <span>CRM</span>
            </div>
            <div className="category-item">
              <span className="w-4 h-4 flex items-center justify-center">📈</span>
              <span>Analytics & Data</span>
            </div>
            <div className="category-item">
              <span className="w-4 h-4 flex items-center justify-center">🎮</span>
              <span>Entertainment & Media</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Featured</h2>
          </div>

          {/* Featured Apps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredApps.map((app) => (
              <AppCard
                key={app.id}
                app={{
                  slug: app.id,
                  name: app.name,
                  description: app.description,
                  logo: app.icon,
                  category: [app.category],
                  requires_auth: false,
                  rating: app.stars,
                  tool_count: undefined,
                  mcp_url: undefined,
                  auth_schemes: undefined,
                  pricing: 'free',
                  tags: undefined,
                  website_url: undefined,
                  documentation_url: undefined,
                  support_url: undefined,
                  created_at: undefined,
                  updated_at: undefined,
                  popularity_score: undefined,
                  review_count: undefined,
                }}
              />
            ))}
          </div>
        </main>
      </div>
    </PageLayout>
  )
}
