"use client"

interface OAuthButtonsProps {
  mode?: 'signin' | 'signup'
  onSuccess?: () => void
  disabled?: boolean
}

export function OAuthButtons({ mode = 'signin', onSuccess, disabled }: OAuthButtonsProps) {
  // Suppress unused parameter warnings - these are part of the interface
  void mode; void onSuccess; void disabled;
  // For now, don't show OAuth buttons since credentials are not configured
  return null
}
