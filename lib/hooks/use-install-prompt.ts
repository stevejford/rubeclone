'use client'

import { useState, useCallback } from 'react'
import { useAuth } from './use-auth'

interface UseInstallPromptReturn {
  isPromptOpen: boolean
  promptToolName: string | null
  openPrompt: (toolName?: string) => void
  closePrompt: () => void
  handleInstallAttempt: (toolName?: string, onInstall?: () => void) => boolean
}

export function useInstallPrompt(): UseInstallPromptReturn {
  const { user } = useAuth()
  const [isPromptOpen, setIsPromptOpen] = useState(false)
  const [promptToolName, setPromptToolName] = useState<string | null>(null)

  const openPrompt = useCallback((toolName?: string) => {
    setPromptToolName(toolName || null)
    setIsPromptOpen(true)
  }, [])

  const closePrompt = useCallback(() => {
    setIsPromptOpen(false)
    setPromptToolName(null)
  }, [])

  const handleInstallAttempt = useCallback((
    toolName?: string, 
    onInstall?: () => void
  ): boolean => {
    if (!user) {
      // User is not authenticated, show the prompt
      openPrompt(toolName)
      return false
    }

    // User is authenticated, proceed with installation
    if (onInstall) {
      onInstall()
    }
    return true
  }, [user, openPrompt])

  return {
    isPromptOpen,
    promptToolName,
    openPrompt,
    closePrompt,
    handleInstallAttempt,
  }
}
