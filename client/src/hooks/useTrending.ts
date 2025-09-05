import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trendingApi } from '../services/api';
import { TrendingData, Section } from '../types';

// Removed unused legacy hooks: useTrending, useRefreshTrending, useRefreshSingleSection
// These were replaced by progressive loading hooks with cache retention support

// Removed unused monitoring hooks: useHealth, useCacheStats, useCacheInfo
// These were only used for automatic refresh which has been removed

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