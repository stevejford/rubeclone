"use client"

import Link from "next/link"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Icons } from "@/components/icons"

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return {
          title: "Server Configuration Error",
          description: "There is a problem with the server configuration. Please contact support.",
        }
      case "AccessDenied":
        return {
          title: "Access Denied",
          description: "You do not have permission to sign in with this account.",
        }
      case "Verification":
        return {
          title: "Verification Error",
          description: "The verification token has expired or has already been used.",
        }
      case "OAuthSignin":
        return {
          title: "OAuth Sign-in Error",
          description: "Error in retrieving information from the OAuth provider.",
        }
      case "OAuthCallback":
        return {
          title: "OAuth Callback Error",
          description: "Error in handling the response from the OAuth provider.",
        }
      case "OAuthCreateAccount":
        return {
          title: "OAuth Account Creation Error",
          description: "Could not create an OAuth account in the database.",
        }
      case "EmailCreateAccount":
        return {
          title: "Email Account Creation Error",
          description: "Could not create an email account in the database.",
        }
      case "Callback":
        return {
          title: "Callback Error",
          description: "Error in the OAuth callback handler route.",
        }
      case "OAuthAccountNotLinked":
        return {
          title: "Account Not Linked",
          description: "The email on the account is already linked, but not with this OAuth account.",
        }
      case "EmailSignin":
        return {
          title: "Email Sign-in Error",
          description: "Sending the email with the verification token failed.",
        }
      case "CredentialsSignin":
        return {
          title: "Invalid Credentials",
          description: "The credentials you provided are incorrect. Please try again.",
        }
      case "SessionRequired":
        return {
          title: "Session Required",
          description: "You must be signed in to access this page.",
        }
      default:
        return {
          title: "Authentication Error",
          description: "An unexpected error occurred during authentication. Please try again.",
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <Icons.alertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Authentication Error
          </h1>
          <p className="text-sm text-muted-foreground">
            Something went wrong during the authentication process
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{errorInfo.title}</CardTitle>
            <CardDescription className="text-center">
              {errorInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <Icons.alertTriangle className="h-4 w-4" />
              <AlertDescription>
                {errorInfo.description}
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col space-y-2">
              <Button asChild>
                <Link href="/auth/signin">
                  Try Again
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">
                  Go Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <p className="px-8 text-center text-sm text-muted-foreground">
          If this problem persists, please{" "}
          <Link
            href="/contact"
            className="underline underline-offset-4 hover:text-primary"
          >
            contact support
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
