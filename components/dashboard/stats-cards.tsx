"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"

interface StatsCardsProps {
  stats: {
    workspaces: number
    projects: number
    teamMembers: number
    storageUsed: string
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Workspaces",
      value: stats.workspaces,
      description: stats.workspaces === 0 ? "No workspaces created yet" : `${stats.workspaces} active workspace${stats.workspaces === 1 ? '' : 's'}`,
      icon: Icons.workspace,
    },
    {
      title: "Active Projects",
      value: stats.projects,
      description: stats.projects === 0 ? "No active projects" : `${stats.projects} project${stats.projects === 1 ? '' : 's'} in progress`,
      icon: Icons.folder,
    },
    {
      title: "Team Members",
      value: stats.teamMembers,
      description: stats.teamMembers === 1 ? "Just you for now" : `${stats.teamMembers} team member${stats.teamMembers === 1 ? '' : 's'}`,
      icon: Icons.users,
    },
    {
      title: "Storage Used",
      value: stats.storageUsed,
      description: "of 1 GB available",
      icon: Icons.harddrive,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
