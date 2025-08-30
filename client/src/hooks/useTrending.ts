import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trendingApi } from '../services/api';
import { TrendingData } from '../types';

export const useTrending = (keywords: string[]) => {
  return useQuery({
    queryKey: ['trending', keywords],
    queryFn: () => trendingApi.getTrending(keywords),
    enabled: keywords.length > 0,
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchInterval: 1000 * 60 * 60, // 1 hour
  });
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