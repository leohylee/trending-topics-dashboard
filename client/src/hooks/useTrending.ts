import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { trendingApi } from '../services/api';
import { TrendingData } from '../types';

export const useTrending = (keywords: string[]) => {
  const [progressiveData, setProgressiveData] = useState<TrendingData[]>([]);
  const [isProgressiveLoading, setIsProgressiveLoading] = useState(false);
  const [uncachedKeywords, setUncachedKeywords] = useState<string[]>([]);
  
  const queryClient = useQueryClient();
  
  // First, get cached data immediately
  const cachedQuery = useQuery({
    queryKey: ['trending-cached', keywords],
    queryFn: () => trendingApi.getCachedTrending(keywords),
    enabled: keywords.length > 0,
    staleTime: 0, // Always check for cached data
  });

  // Then, fetch fresh data for uncached keywords
  const freshQuery = useQuery({
    queryKey: ['trending-fresh', uncachedKeywords],
    queryFn: () => trendingApi.getTrending(uncachedKeywords),
    enabled: uncachedKeywords.length > 0,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Effect to handle progressive loading
  useEffect(() => {
    if (cachedQuery.data) {
      const cached = cachedQuery.data;
      console.log(`📊 Progressive Loading: ${cached.cacheHits}/${cached.totalRequested} cached, ${cached.uncachedKeywords.length} need fetching`);
      
      // Immediately set cached data
      setProgressiveData(cached.cachedData);
      setUncachedKeywords(cached.uncachedKeywords);
      
      // Set loading state if there are uncached keywords
      setIsProgressiveLoading(cached.uncachedKeywords.length > 0);
    }
  }, [cachedQuery.data]);

  // Effect to merge fresh data with cached data
  useEffect(() => {
    if (freshQuery.data && cachedQuery.data) {
      const allData = [...cachedQuery.data.cachedData, ...freshQuery.data];
      
      // Sort by original keyword order
      const sortedData = allData.sort((a, b) => 
        keywords.indexOf(a.keyword) - keywords.indexOf(b.keyword)
      );
      
      setProgressiveData(sortedData);
      setIsProgressiveLoading(false);
      
      console.log(`✅ Progressive Loading Complete: ${sortedData.length} total sections loaded`);
      
      // Update the main query cache with complete data
      queryClient.setQueryData(['trending', keywords], sortedData);
    }
  }, [freshQuery.data, cachedQuery.data, keywords, queryClient]);

  return {
    data: progressiveData,
    isLoading: cachedQuery.isLoading, // Only show loading for initial cache check
    isProgressiveLoading, // Show when fetching fresh data
    error: cachedQuery.error || freshQuery.error,
    isError: cachedQuery.isError || freshQuery.isError,
    cacheStats: cachedQuery.data ? {
      hits: cachedQuery.data.cacheHits,
      total: cachedQuery.data.totalRequested,
      hitRate: Math.round((cachedQuery.data.cacheHits / cachedQuery.data.totalRequested) * 100)
    } : null
  };
};

export const useRefreshTrending = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (keywords: string[]) => trendingApi.refreshTrending(keywords),
    onSuccess: (data: TrendingData[], keywords: string[]) => {
      // Update the specific query data
      queryClient.setQueryData(['trending', keywords], data);
      
      // Invalidate all trending queries to refresh them
      queryClient.invalidateQueries({
        queryKey: ['trending'],
      });

      // Also invalidate cache stats since they might have changed
      queryClient.invalidateQueries({
        queryKey: ['cache', 'stats'],
      });
    },
  });
};

export const useRefreshSingleSection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (keyword: string) => trendingApi.refreshSingleKeyword(keyword),
    onSuccess: (newData: TrendingData, keyword: string) => {
      // Update all queries that include this keyword
      queryClient.setQueriesData(
        { queryKey: ['trending-cached'] },
        (oldData: any) => {
          if (!oldData?.cachedData) return oldData;
          
          const updatedCachedData = oldData.cachedData.map((item: TrendingData) =>
            item.keyword === keyword ? newData : item
          );
          
          return {
            ...oldData,
            cachedData: updatedCachedData
          };
        }
      );

      // Update progressive data by invalidating fresh queries
      queryClient.invalidateQueries({
        queryKey: ['trending-fresh'],
      });

      // Invalidate main trending queries
      queryClient.invalidateQueries({
        queryKey: ['trending'],
      });

      console.log(`✅ Refreshed single section: ${keyword}`);
    },
  });
};

// Health check hook
export const useHealth = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => trendingApi.getHealth(),
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    retry: 3,
  });
};

// Cache statistics hook
export const useCacheStats = () => {
  return useQuery({
    queryKey: ['cache', 'stats'],
    queryFn: () => trendingApi.getCacheStats(),
    refetchInterval: 1000 * 30, // 30 seconds for real-time stats
    retry: 2,
  });
};

// Cache information hook
export const useCacheInfo = () => {
  return useQuery({
    queryKey: ['cache', 'info'],
    queryFn: () => trendingApi.getCacheInfo(),
    refetchInterval: 1000 * 60, // 1 minute
    retry: 2,
  });
};