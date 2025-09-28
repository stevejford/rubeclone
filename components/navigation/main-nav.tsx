'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { UserMenu } from '@/components/auth/user-menu'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { cn } from '@/lib/utils'

interface MainNavProps {
  variant?: 'default' | 'dashboard'
}

export function MainNav({ variant = 'default' }: MainNavProps) {
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Navigation items for logged-out users
  const publicNavItems = [
    { name: 'Home', href: '/' },
    { name: 'Marketplace', href: '/marketplace' },
    { name: 'Pricing', href: '/pricing' },
  ]

  // Navigation items for logged-in users
  const authenticatedNavItems = [
    { name: 'Home', href: '/' },
    { name: 'Marketplace', href: '/marketplace' },
    { name: 'Connected Apps', href: '/connected-apps' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Workspaces', href: '/workspaces' },
    { name: 'Pricing', href: '/pricing' },
  ]

  const navItems = isAuthenticated ? authenticatedNavItems : publicNavItems

  const renderAuthSection = () => {
    if (isLoading) {
      return (
        <div className="flex items-center space-x-2">
          <Icons.spinner className="h-4 w-4 animate-spin" />
        </div>
      )
    }

    if (isAuthenticated) {
      return (
        <div className="flex items-center space-x-4">
          <UserMenu />
        </div>
      )
    }

    return (
      <div className="flex items-center space-x-4">
        <Button variant="ghost" asChild>
          <Link href="/auth/signin">Sign In</Link>
        </Button>
        <Button asChild>
          <Link href="/auth/signup">Sign Up</Link>
        </Button>
        <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2">
          <span>Install Rube</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    )
  }

  if (variant === 'dashboard') {
    // Dashboard-specific navigation with different styling
    return (
      <nav className="border-b bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">R</span>
                </div>
                <span className="font-semibold text-xl text-gray-900">Rube</span>
              </Link>

              <div className="hidden md:flex items-center space-x-6">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      )}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex">
              {renderAuthSection()}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
              <div className="flex flex-col space-y-2 pt-4">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  )
                })}
                <div className="pt-4 border-t border-gray-200">
                  {renderAuthSection()}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    )
  }

  // Default navigation for public pages
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icons.composio className="w-8 h-8 text-primary" />
            <span className="font-semibold text-xl text-gray-900">Composio</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "transition-colors",
                    isActive
                      ? "text-gray-900 font-medium border-b-2 border-gray-900 pb-1"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex">
            {renderAuthSection()}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4 pt-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "transition-colors px-2 py-1",
                      isActive
                        ? "text-gray-900 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                )
              })}
              <div className="pt-4 border-t border-gray-200">
                {renderAuthSection()}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
