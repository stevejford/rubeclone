"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

export function QuickActions() {
  const actions = [
    {
      title: "Create New Workspace",
      description: "Set up a new workspace for your projects",
      href: "/workspaces",
      icon: Icons.add,
      variant: "default" as const,
    },
    {
      title: "Browse Marketplace",
      description: "Discover AI tools and integrations",
      href: "/marketplace",
      icon: Icons.folder,
      variant: "outline" as const,
    },
    {
      title: "Account Settings",
      description: "Manage your profile and preferences",
      href: "/settings",
      icon: Icons.settings,
      variant: "outline" as const,
    },
    {
      title: "Help & Documentation",
      description: "Get help and learn how to use the platform",
      href: "/help",
      icon: Icons.help,
      variant: "outline" as const,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Get started with these common tasks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action) => (
          <Button
            key={action.title}
            asChild
            variant={action.variant}
            className="w-full justify-start h-auto p-4"
          >
            <Link href={action.href}>
              <div className="flex items-start space-x-3">
                <action.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </div>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
