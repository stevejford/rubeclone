'use client';


import { AuthGuard } from "@/components/auth/auth-guard"
import { PageLayout } from "@/components/layout/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { useWorkspace } from "@/lib/hooks/use-workspace"
import { useRouter } from "next/navigation"
import Link from "next/link"

// Metadata moved to layout.tsx since this is a client component

export default function DashboardPage() {
  const router = useRouter();
  const { workspaces, currentWorkspace, isLoading } = useWorkspace();

  // Calculate stats from workspace data
  const totalWorkspaces = workspaces.length;
  const totalMembers = currentWorkspace?.members?.length || 1;

  return (
    <AuthGuard>
      <PageLayout>
        <div className="py-8">
          <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back! Here's what's happening with your account.
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Workspaces
                </CardTitle>
                <Icons.workspace className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? '...' : totalWorkspaces}</div>
                <p className="text-xs text-muted-foreground">
                  {totalWorkspaces === 0 ? 'No workspaces created yet' : 'Active workspaces'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Projects
                </CardTitle>
                <Icons.folder className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  No active projects
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Team Members
                </CardTitle>
                <Icons.users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? '...' : totalMembers}</div>
                <p className="text-xs text-muted-foreground">
                  {currentWorkspace ? `In ${currentWorkspace.name}` : 'Just you for now'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Storage Used
                </CardTitle>
                <Icons.harddrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0 MB</div>
                <p className="text-xs text-muted-foreground">
                  of 1 GB available
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Get started with these common tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full justify-start"
                  onClick={() => router.push('/workspaces')}
                >
                  <Icons.plus className="mr-2 h-4 w-4" />
                  Create New Workspace
                </Button>
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link href="/settings">
                    <Icons.settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link href="/help">
                    <Icons.help className="mr-2 h-4 w-4" />
                    Help & Documentation
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest actions and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Icons.user className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Account created</p>
                      <p className="text-xs text-muted-foreground">
                        Welcome to the platform!
                      </p>
                    </div>
                  </div>
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      No recent activity to show
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Follow these steps to set up your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <Icons.check className="h-3 w-3" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Create your account</p>
                    <p className="text-xs text-muted-foreground">
                      You've successfully created your account and signed in.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <span className="text-xs">2</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Create your first workspace</p>
                    <p className="text-xs text-muted-foreground">
                      Organize your projects and collaborate with your team.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <span className="text-xs">3</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Invite team members</p>
                    <p className="text-xs text-muted-foreground">
                      Collaborate with others by inviting them to your workspace.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </PageLayout>
    </AuthGuard>
  )
}
