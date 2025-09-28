'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Workspace, WorkspaceWithDetails } from '@/lib/db/types';

interface WorkspaceContextType {
  currentWorkspace: WorkspaceWithDetails | null;
  workspaces: Workspace[];
  isLoading: boolean;
  error: string | null;
  setCurrentWorkspace: (workspace: WorkspaceWithDetails | null) => void;
  refreshWorkspaces: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceProvider');
  }
  return context;
}

interface WorkspaceProviderProps {
  children: React.ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const { data: session, status } = useSession();
  void session; // Suppress unused variable warning
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceWithDetails | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/workspaces');

      if (response.status === 401) {
        // User is not authenticated, silently ignore
        setWorkspaces([]);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch workspaces');
      }

      const data = await response.json();
      setWorkspaces(data.workspaces);

      // Set first workspace as current if none selected
      if (!currentWorkspace && data.workspaces.length > 0) {
        await switchWorkspace(data.workspaces[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const switchWorkspace = async (workspaceId: string) => {
    try {
      setError(null);

      // Validate workspace ID format - must be numeric
      const numericWorkspaceId = parseInt(workspaceId, 10);
      if (isNaN(numericWorkspaceId) || numericWorkspaceId <= 0) {
        console.warn(`Invalid workspace ID format: "${workspaceId}". Skipping workspace switch.`);
        return;
      }

      const response = await fetch(`/api/workspaces/${workspaceId}`);

      if (response.status === 401) {
        // User is not authenticated, silently ignore
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch workspace details');
      }

      const data = await response.json();
      setCurrentWorkspace(data.workspace);

      // Store in localStorage for persistence
      localStorage.setItem('currentWorkspaceId', workspaceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const refreshWorkspaces = async () => {
    await fetchWorkspaces();
  };

  useEffect(() => {
    // Only fetch workspaces when user is authenticated
    if (status === 'authenticated') {
      fetchWorkspaces();
    } else if (status === 'unauthenticated') {
      // Clear workspaces when user is not authenticated
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setIsLoading(false);
    }
  }, [status]);

  // Restore current workspace from localStorage
  useEffect(() => {
    const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
    if (savedWorkspaceId && workspaces.length > 0 && status === 'authenticated') {
      const workspace = workspaces.find(w => w.id.toString() === savedWorkspaceId);
      if (workspace) {
        switchWorkspace(savedWorkspaceId);
      }
    }
  }, [workspaces, status]);

  const value: WorkspaceContextType = {
    currentWorkspace,
    workspaces,
    isLoading,
    error,
    setCurrentWorkspace,
    refreshWorkspaces,
    switchWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
