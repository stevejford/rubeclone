"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { Icons } from "@/components/icons"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireRole?: "user" | "admin"
}

export function AuthGuard({
  children,
  fallback,
  requireRole
}: AuthGuardProps) {
  const { isLoading, isAuthenticated, user, redirectToLogin } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentUrl = window.location.pathname + window.location.search
      redirectToLogin(currentUrl)
    }
  }, [isLoading, isAuthenticated, redirectToLogin])

  // Show loading state
  if (isLoading) {
    return (
      fallback || (
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Icons.spinner className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Icons.spinner className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground">Redirecting to sign in...</p>
          </div>
        </div>
      )
    )
  }

  // Check role requirement
  if (requireRole && user?.role !== requireRole) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
