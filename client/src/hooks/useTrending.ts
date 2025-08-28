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
      queryClient.setQueryData(['trending', keywords], data);
      
      queryClient.invalidateQueries({
        queryKey: ['trending'],
      });
    },
  });
};