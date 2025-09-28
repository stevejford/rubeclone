import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import useSWRInfinite from 'swr/infinite';
import { RealMarketplaceApp, MarketplaceFilters, MarketplaceResponse } from '@/types/marketplace';

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

interface UseInfiniteMarketplaceOptions {
  initialFilters?: Partial<MarketplaceFilters>;
  enabled?: boolean;
  pageSize?: number;
}

interface UseInfiniteMarketplaceReturn {
  apps: RealMarketplaceApp[];
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  total: number;
  filters: MarketplaceFilters;
  setFilters: (filters: Partial<MarketplaceFilters>) => void;
  loadMore: () => void;
  refresh: () => void;
  isRefreshing: boolean;
}

const fetcher = async (url: string): Promise<MarketplaceResponse> => {
  const response = await fetch(url, {
    credentials: 'include',
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

export function useInfiniteMarketplace(options: UseInfiniteMarketplaceOptions = {}): UseInfiniteMarketplaceReturn {
  const { initialFilters = {}, enabled = true, pageSize = 24 } = options;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [filters, setFiltersState] = useState<MarketplaceFilters>({
    page: 1,
    limit: pageSize,
    ...initialFilters,
  });

  // Debounce search query to avoid excessive API calls
  const debouncedQuery = useDebounceInternal(filters.query, 300);

  // Create the key function for SWR Infinite
  const getKey = useCallback((pageIndex: number, previousPageData: MarketplaceResponse | null) => {
    // If we've reached the end, return null to stop fetching
    if (previousPageData && !previousPageData.pagination.hasNext) return null;

    const params = new URLSearchParams();
    
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (filters.category) params.set('category', filters.category);
    if (filters.sort) params.set('sort', filters.sort);
    params.set('page', (pageIndex + 1).toString());
    params.set('limit', pageSize.toString());
    if (filters.pricing) params.set('pricing', filters.pricing);
    if (filters.requires_auth !== undefined) params.set('auth', filters.requires_auth.toString());
    if (filters.tags?.length) params.set('tags', filters.tags.join(','));

    return `/api/marketplace/apps?${params.toString()}`;
  }, [debouncedQuery, filters.category, filters.sort, filters.pricing, filters.requires_auth, filters.tags, pageSize]);

  // Use SWR Infinite for infinite loading
  const {
    data,
    error,
    isLoading,
    isValidating,
    size,
    setSize,
    mutate
  } = useSWRInfinite<MarketplaceResponse>(
    enabled ? getKey : () => null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      parallel: false, // Load pages sequentially
    }
  );

  // Flatten all apps from all pages
  const apps = useMemo(() => {
    if (!data) return [];
    return data.flatMap(page => page.apps);
  }, [data]);

  // Calculate if there are more pages to load
  const hasMore = useMemo(() => {
    if (!data || data.length === 0) return false;
    const lastPage = data[data.length - 1];
    return lastPage?.pagination?.hasNext || false;
  }, [data]);

  // Get total count from the first page
  const total = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return data[0]?.pagination?.total || 0;
  }, [data]);

  // Load more function
  const loadMore = useCallback(() => {
    if (!isLoading && !isValidating && hasMore) {
      setSize(size + 1);
    }
  }, [isLoading, isValidating, hasMore, size, setSize]);

  // Set filters function that resets pagination
  const setFilters = useCallback((newFilters: Partial<MarketplaceFilters>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Always reset to page 1 when filters change
    }));
    // Reset to first page when filters change
    setSize(1);
  }, [setSize]);

  // Refresh function
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await mutate();
      setSize(1); // Reset to first page
    } finally {
      setIsRefreshing(false);
    }
  }, [mutate, setSize]);

  return {
    apps,
    loading: isLoading && size === 1, // Only show loading for initial load
    loadingMore: isValidating && size > 1, // Show loading more for subsequent pages
    error: error || null,
    hasMore,
    total,
    filters,
    setFilters,
    loadMore,
    refresh,
    isRefreshing,
  };
}

// Hook for intersection observer to trigger loading
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          callback();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
        ...options,
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [callback, options]);

  return targetRef;
}
