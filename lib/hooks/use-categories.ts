import { useState } from 'react';
import useSWR from 'swr';
import { CategoryMapping } from '@/lib/constants/categories';

interface CategoryResponse {
  success: boolean;
  categories: CategoryMapping[];
  total: number;
  totalAvailable?: number;
  filtered?: boolean;
  filters?: {
    search: string | null;
    limit: number | null;
    minApps: number;
  };
  fallback?: boolean;
  error?: string;
  lastUpdated: string;
}

const fetcher = async (url: string): Promise<CategoryResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

interface UseCategoriesOptions {
  limit?: number;
  search?: string;
  minApps?: number;
}

export function useCategories(options: UseCategoriesOptions = {}) {
  const { limit = 50, search, minApps = 5 } = options;

  // Build query string
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());
  if (search) params.set('search', search);
  if (minApps) params.set('minApps', minApps.toString());

  const queryString = params.toString();
  const url = `/api/marketplace/categories${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<CategoryResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // 5 minutes
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      fallbackData: {
        success: true,
        categories: [],
        total: 0,
        lastUpdated: new Date().toISOString()
      }
    }
  );

  const refreshCategories = async () => {
    try {
      // Trigger sync and then refresh data
      await fetch('/api/marketplace/categories', { method: 'POST' });
      await mutate();
    } catch (error) {
      console.error('Failed to refresh categories:', error);
    }
  };

  return {
    categories: data?.categories || [],
    loading: isLoading,
    error,
    total: data?.total || 0,
    totalAvailable: data?.totalAvailable || 0,
    filtered: data?.filtered || false,
    filters: data?.filters,
    isFallback: data?.fallback || false,
    lastUpdated: data?.lastUpdated,
    refreshCategories,
    mutate
  };
}

// Hook for admin category management
export function useCategoryAdmin() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const syncCategories = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/admin/sync-categories', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      setSyncResult(result);
      return result;
    } catch (error) {
      console.error('Category sync failed:', error);
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  const getCategoryStats = async () => {
    try {
      const response = await fetch('/api/admin/sync-categories');
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Failed to fetch category stats:', error);
      throw error;
    }
  };

  return {
    syncing,
    syncResult,
    syncCategories,
    getCategoryStats
  };
}
