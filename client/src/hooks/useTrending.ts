import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { trendingApi } from '../services/api';
import { TrendingData, Section } from '../types';

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
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log(`📊 Progressive Loading: ${cached.cacheHits}/${cached.totalRequested} cached, ${cached.uncachedKeywords.length} need fetching`);
      }
      
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
      
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log(`✅ Progressive Loading Complete: ${sortedData.length} total sections loaded`);
      }
      
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

      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log(`✅ Refreshed single section: ${keyword}`);
      }
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

// Trending hook with cache retention support
export const useTrendingWithRetention = (sections: Section[]) => {
  return useQuery({
    queryKey: ['trending-with-retention', sections.map(s => ({ keyword: s.keyword, retention: s.cacheRetention }))],
    queryFn: () => trendingApi.getTrendingWithRetention(sections),
    enabled: sections.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Refresh trending with cache retention support
export const useRefreshTrendingWithRetention = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sections: Section[]) => trendingApi.refreshTrendingWithRetention(sections),
    onSuccess: (data: TrendingData[], sections: Section[]) => {
      // Update the with-retention query data
      const queryKey = ['trending-with-retention', sections.map(s => ({ keyword: s.keyword, retention: s.cacheRetention }))];
      queryClient.setQueryData(queryKey, data);
      
      // Invalidate all trending queries to refresh them
      queryClient.invalidateQueries({
        queryKey: ['trending'],
      });

      // Invalidate cache queries since TTL might have changed
      queryClient.invalidateQueries({
        queryKey: ['cache'],
      });
    },
  });
};

// Refresh single section with cache retention support
export const useRefreshSingleSectionWithRetention = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (section: Section) => trendingApi.refreshSingleSectionWithRetention(section),
    onSuccess: (newData: TrendingData, section: Section) => {
      // Update with-retention query data
      queryClient.setQueriesData(
        { queryKey: ['trending-with-retention'] },
        (oldData: TrendingData[]) => {
          if (!oldData) return oldData;
          
          return oldData.map((item: TrendingData) =>
            item.keyword === section.keyword ? newData : item
          );
        }
      );

      // Update individual section query
      queryClient.setQueryData(
        ['trending-section', section.keyword, section.cacheRetention],
        newData
      );

      // Invalidate all trending queries
      queryClient.invalidateQueries({
        queryKey: ['trending'],
      });

      // Invalidate cache queries since TTL might have changed
      queryClient.invalidateQueries({
        queryKey: ['cache'],
      });

      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log(`✅ Refreshed single section with retention: ${section.keyword}`);
      }
    },
  });
};

// Individual section hook for progressive loading
export const useTrendingSectionWithRetention = (section: Section) => {
  return useQuery({
    queryKey: ['trending-section', section.keyword, section.cacheRetention],
    queryFn: () => trendingApi.getTrendingWithRetention([section]).then(data => data[0]),
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
  });
};

// Progressive loading hook that manages individual sections
export const useProgressiveTrendingWithRetention = (sections: Section[]) => {
  return sections.map(section => ({
    section,
    ...useTrendingSectionWithRetention(section)
  }));
};