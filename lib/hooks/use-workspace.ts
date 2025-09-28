'use client';

import { useState, useEffect } from 'react';
import { useWorkspaceContext } from '@/lib/contexts/workspace-context';
import { WorkspaceMember, WorkspaceTool } from '@/lib/db/types';
import { getWorkspacePermissions } from '@/lib/utils/workspace-permissions';
import { useSession } from 'next-auth/react';

// Normalize member data to ensure consistent field names
function normalizeMember(member: any): WorkspaceMember {
  return {
    ...member,
    userId: member.userId ?? member.user_id?.toString(),
    workspaceId: member.workspaceId ?? member.workspace_id?.toString(),
  };
}

// Normalize tool data to ensure consistent field names
function normalizeTool(tool: any): WorkspaceTool {
  return {
    ...tool,
    toolSlug: tool.toolSlug ?? tool.tool_slug,
    workspaceId: tool.workspaceId ?? tool.workspace_id?.toString(),
  };
}

export function useWorkspace() {
  const { data: session } = useSession();
  const {
    currentWorkspace,
    workspaces,
    isLoading,
    error,
    setCurrentWorkspace,
    refreshWorkspaces,
    switchWorkspace,
  } = useWorkspaceContext();

  const permissions = currentWorkspace && session?.user?.id
    ? getWorkspacePermissions(
        currentWorkspace.members?.find((m: any) =>
          (m.userId ?? m.user_id?.toString()) === session.user.id
        )?.role || null,
        currentWorkspace.owner_id.toString() === session.user.id
      )
    : null;

  return {
    currentWorkspace,
    workspaces,
    isLoading,
    error,
    permissions,
    setCurrentWorkspace,
    refreshWorkspaces,
    switchWorkspace,
  };
}

export function useWorkspaceMembers(workspaceId: string) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/workspaces/${workspaceId}/members`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      
      const data = await response.json();
      setMembers(data.members.map(normalizeMember));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const addMember = async (email: string, role: 'admin' | 'member') => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add member');
      }

      await fetchMembers();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  };

  const updateMemberRole = async (userId: string, role: 'admin' | 'member') => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role }),
      });

      if (!response.ok) {
        throw new Error('Failed to update member role');
      }

      await fetchMembers();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  };

  const removeMember = async (userId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members?userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      await fetchMembers();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchMembers();
    }
  }, [workspaceId]);

  return {
    members,
    isLoading,
    error,
    addMember,
    updateMemberRole,
    removeMember,
    refreshMembers: fetchMembers,
  };
}

export function useWorkspaceTools(workspaceId: string) {
  const [tools, setTools] = useState<WorkspaceTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/workspaces/${workspaceId}/tools`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tools');
      }
      
      const data = await response.json();
      setTools(data.tools.map(normalizeTool));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const enableTool = async (toolSlug: string, config?: Record<string, any>) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toolSlug, config }),
      });

      if (!response.ok) {
        throw new Error('Failed to enable tool');
      }

      await fetchTools();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  };

  const disableTool = async (toolSlug: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/tools?toolSlug=${toolSlug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to disable tool');
      }

      await fetchTools();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchTools();
    }
  }, [workspaceId]);

  return {
    tools,
    isLoading,
    error,
    enableTool,
    disableTool,
    refreshTools: fetchTools,
  };
}
