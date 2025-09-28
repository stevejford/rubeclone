"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import type { User } from "@/types"

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const user = session?.user as (User & { id: string }) | undefined

  const isLoading = status === "loading"
  const isAuthenticated = status === "authenticated"
  const isUnauthenticated = status === "unauthenticated"

  const login = async (provider?: string, options?: any) => {
    try {
      const result = await signIn(provider, options)
      return result
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const logout = async (callbackUrl?: string) => {
    try {
      await signOut({ callbackUrl: callbackUrl || "/" })
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }

  const redirectToLogin = (callbackUrl?: string) => {
    const url = callbackUrl 
      ? `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/auth/signin"
    router.push(url)
  }

  const redirectToDashboard = () => {
    router.push("/dashboard")
  }

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    isUnauthenticated,
    login,
    logout,
    signOut: logout, // Alias for compatibility
    redirectToLogin,
    redirectToDashboard,
  }
}
