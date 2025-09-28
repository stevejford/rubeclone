'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { OAuthButtons } from '@/components/auth/oauth-buttons'
import { Zap, Check, ArrowRight } from 'lucide-react'

interface AuthPromptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  toolName?: string
}

export function AuthPromptModal({ open, onOpenChange, toolName }: AuthPromptModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignUp = () => {
    setIsLoading(true)
    router.push('/auth/signup')
  }

  const handleSignIn = () => {
    setIsLoading(true)
    router.push('/auth/signin')
  }

  const benefits = [
    'Install unlimited AI tools',
    'Create and manage workspaces',
    'Access premium features',
    'Priority support',
    'No credit card required'
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            {toolName ? `Install ${toolName}` : 'Get Started for Free'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {toolName 
              ? `Sign up for free to install ${toolName} and access our full marketplace of AI tools.`
              : 'Create your free account to access our full marketplace of AI tools.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Benefits */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              What you get:
            </h4>
            <ul className="space-y-2">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center space-x-3 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <OAuthButtons 
              mode="signup"
              onSuccess={() => onOpenChange(false)}
              disabled={isLoading}
            />
          </div>

          {/* Primary Actions */}
          <div className="space-y-3">
            <Button 
              onClick={handleSignUp}
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              Sign Up Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium"
                  onClick={handleSignIn}
                  disabled={isLoading}
                >
                  Sign in
                </Button>
              </span>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Join thousands of users building with AI tools
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
