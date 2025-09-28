"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface Activity {
  id: string
  type: 'workspace_created' | 'project_updated' | 'tool_added' | 'member_invited'
  title: string
  description: string
  timestamp: string
  user: {
    name: string
    email: string
    avatar?: string
  }
}

interface RecentActivityProps {
  activities: Activity[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'workspace_created':
        return '🏗️'
      case 'project_updated':
        return '📝'
      case 'tool_added':
        return '🔧'
      case 'member_invited':
        return '👥'
      default:
        return '📋'
    }
  }

  const getActivityBadge = (type: Activity['type']) => {
    switch (type) {
      case 'workspace_created':
        return <Badge variant="default">Created</Badge>
      case 'project_updated':
        return <Badge variant="secondary">Updated</Badge>
      case 'tool_added':
        return <Badge variant="outline">Added</Badge>
      case 'member_invited':
        return <Badge variant="secondary">Invited</Badge>
      default:
        return <Badge variant="outline">Activity</Badge>
    }
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your recent workspace activity will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">📋</div>
            <p>No recent activity</p>
            <p className="text-sm">Start by creating a workspace or adding tools</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest updates from your workspaces
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="text-2xl">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{activity.title}</p>
                  {getActivityBadge(activity.type)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={activity.user.avatar} />
                    <AvatarFallback>
                      {activity.user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span>{activity.user.name}</span>
                  <span>•</span>
                  <span>{activity.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
