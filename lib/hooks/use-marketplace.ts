import { useState, useEffect, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { RealMarketplaceApp, MarketplaceFilters, MarketplaceResponse, AppInstallationStatus } from '@/types/marketplace';

// Custom debounce hook
function useDebounceInternal<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface UseMarketplaceAppsOptions {
  initialFilters?: Partial<MarketplaceFilters>;
  enabled?: boolean;
}

interface UseMarketplaceAppsReturn {
  apps: RealMarketplaceApp[];
  loading: boolean;
  error: Error | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: MarketplaceFilters;
  setFilters: (filters: Partial<MarketplaceFilters>) => void;
  refetch: () => void;
  mutate: (data?: MarketplaceResponse) => void;
}

const fetcher = async (url: string): Promise<MarketplaceResponse> => {
  const response = await fetch(url, {
    credentials: 'include', // Include cookies for authentication
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch marketplace data');
  }
  return result.data;
};

export function useMarketplaceApps(options: UseMarketplaceAppsOptions = {}): UseMarketplaceAppsReturn {
  const { initialFilters = {}, enabled = true } = options;

  const [filters, setFiltersState] = useState<MarketplaceFilters>({
    page: 1,
    limit: 24, // Default page size
    ...initialFilters,
  });

  // Debounce search query to avoid excessive API calls
  const debouncedQuery = useDebounceInternal(filters.query, 300); // 300ms debounce

  // Create the API URL with query parameters
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (filters.category) params.set('category', filters.category);
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.page) params.set('page', filters.page.toString());
    if (filters.limit) params.set('limit', filters.limit.toString());
    if (filters.pricing) params.set('pricing', filters.pricing);
    if (filters.requires_auth !== undefined) params.set('auth', filters.requires_auth.toString());
    if (filters.tags?.length) params.set('tags', filters.tags.join(','));

    return `/api/marketplace/apps?${params.toString()}`;
  }, [debouncedQuery, filters.category, filters.sort, filters.page, filters.limit, filters.pricing, filters.requires_auth, filters.tags]);

  // Use SWR for data fetching with caching
  const { data, error, isLoading, mutate } = useSWR<MarketplaceResponse>(
    enabled ? apiUrl : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    }
  );

  const setFilters = useCallback((newFilters: Partial<MarketplaceFilters>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when changing filters (except when explicitly setting page)
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  }, []);

  const refetch = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    apps: data?.apps || [],
    loading: isLoading,
    error: error || null,
    pagination: data?.pagination || {
      page: 1,
      limit: 24, // Default page size
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
    filters,
    setFilters,
    refetch,
    mutate,
  };
}

interface UseAppDetailsOptions {
  enabled?: boolean;
}

interface UseAppDetailsReturn {
  app: RealMarketplaceApp | null;
  loading: boolean;
  error: Error | null;
  installationStatus: AppInstallationStatus | null;
  refetch: () => void;
}

export function useAppDetails(slug: string, options: UseAppDetailsOptions = {}): UseAppDetailsReturn {
  const { enabled = true } = options;

  const { data, error, isLoading, mutate } = useSWR<{
    app: RealMarketplaceApp;
    installationStatus: AppInstallationStatus | null;
  }>(
    enabled && slug ? `/api/marketplace/apps/${slug}` : null,
    async (url: string) => {
      const response = await fetch(url, {
        credentials: 'include', // Include cookies for authentication
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch app details');
      }
      return result.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      errorRetryCount: 3,
    }
  );

  const refetch = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    app: data?.app || null,
    loading: isLoading,
    error: error || null,
    installationStatus: data?.installationStatus || null,
    refetch,
  };
}

interface UseAppInstallationOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

interface UseAppInstallationReturn {
  installApp: (appSlug: string, workspaceId: string) => Promise<void>;
  uninstallApp: (appSlug: string, workspaceId: string) => Promise<void>;
  installing: boolean;
  uninstalling: boolean;
  error: Error | null;
}

export function useAppInstallation(options: UseAppInstallationOptions = {}): UseAppInstallationReturn {
  const { onSuccess, onError } = options;
  const [installing, setInstalling] = useState(false);
  const [uninstalling, setUninstalling] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const installApp = useCallback(async (appSlug: string, workspaceId: string) => {
    setInstalling(true);
    setError(null);

    console.log('🔧 Installing app:', appSlug, 'in workspace:', workspaceId);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          toolSlug: appSlug,
        }),
      });

      const result = await response.json();
      console.log('📡 Install response:', response.status, result);

      // Handle OAuth connection requirement
      if (response.status === 400 && result.requiresConnection) {
        console.log('🔐 OAuth connection required, initiating...');

        // Initiate OAuth connection
        const connectResponse = await fetch('/api/composio/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for authentication
          body: JSON.stringify({
            toolkit: appSlug,
            workspaceId: workspaceId,
          }),
        });

        const connectResult = await connectResponse.json();
        console.log('🚀 Connect response:', connectResponse.status, connectResult);

        if (!connectResponse.ok) {
          throw new Error('Failed to initiate OAuth connection');
        }

        // Redirect to OAuth provider
        if (connectResult.redirectUrl) {
          console.log('🔗 Redirecting to:', connectResult.redirectUrl);
          window.location.href = connectResult.redirectUrl;
          return; // Don't continue execution after redirect
        }
      }

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // API returns { tool } on success, or { error } on failure
      if (result.error) {
        throw new Error(result.error || 'Failed to install app');
      }

      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setInstalling(false);
    }
  }, [onSuccess, onError]);

  const uninstallApp = useCallback(async (appSlug: string, workspaceId: string) => {
    setUninstalling(true);
    setError(null);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/tools?toolSlug=${encodeURIComponent(appSlug)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to uninstall app');
      }

      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setUninstalling(false);
    }
  }, [onSuccess, onError]);

  return {
    installApp,
    uninstallApp,
    installing,
    uninstalling,
    error,
  };
}

// Removed duplicate useDebounce function
