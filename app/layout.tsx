import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/providers/session-provider'
import { WorkspaceProvider } from '@/lib/contexts/workspace-context'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Composio - AI Tool Marketplace',
    template: '%s | Composio'
  },
  description: 'Discover, integrate, and manage AI tools and services with Composio - the powerful marketplace platform for AI automation.',
  keywords: ['Composio', 'AI tools', 'marketplace', 'automation', 'integrations', 'artificial intelligence'],
  authors: [{ name: 'Composio Team' }],
  creator: 'Composio',
  publisher: 'Composio',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'AI Tool Marketplace',
    description: 'Discover, integrate, and manage AI tools and services in one powerful marketplace platform.',
    siteName: 'AI Tool Marketplace',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI Tool Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Tool Marketplace',
    description: 'Discover, integrate, and manage AI tools and services in one powerful marketplace platform.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <WorkspaceProvider>
            <div className="relative flex min-h-screen flex-col">
              <div className="flex-1">
                {children}
              </div>
            </div>
            <Toaster />
          </WorkspaceProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
