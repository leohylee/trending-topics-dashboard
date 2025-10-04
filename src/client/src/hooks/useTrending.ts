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
    queryKey: ['trending-with-retention', sections?.map?.(s => ({ keyword: s.keyword, retention: s.cacheRetention })) || []],
    queryFn: () => trendingApi.getTrendingWithRetention(sections),
    enabled: sections && Array.isArray(sections) && sections.length > 0,
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
          if (!oldData || !Array.isArray(oldData)) return oldData;

          return oldData.map((item: TrendingData) =>
            item.keyword === section.keyword ? newData : item
          );
        }
      );

      // Update individual section query
      queryClient.setQueryData(
        [
          'trending-section',
          section.keyword,
          section.cacheRetention?.value || 1,
          section.cacheRetention?.unit || 'hour'
        ],
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
  // Safety check
  if (!section || !section.keyword) {
    return {
      data: undefined,
      isLoading: false,
      error: new Error('Invalid section provided'),
      isError: true,
    };
  }

  return useQuery({
    queryKey: [
      'trending-section',
      section.keyword,
      section.cacheRetention?.value || 1,
      section.cacheRetention?.unit || 'hour'
    ],
    queryFn: async () => {
      const data = await trendingApi.getTrendingWithRetention([section]);
      if (!data || !Array.isArray(data) || data.length === 0) {
        return undefined;
      }
      return data[0];
    },
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
  });
};

// Progressive loading hook that manages individual sections
export const useProgressiveTrendingWithRetention = (sections: Section[]) => {
  // Safety check: ensure sections is a valid array
  const safeSections = sections && Array.isArray(sections) ? sections : [];

  // Use a single query that fetches all sections together
  const { data, isLoading, error } = useQuery({
    queryKey: [
      'trending-progressive',
      safeSections.map(s => ({
        keyword: s.keyword,
        retention: s.cacheRetention
      }))
    ],
    queryFn: async () => {
      if (safeSections.length === 0) return [];
      return await trendingApi.getTrendingWithRetention(safeSections);
    },
    enabled: safeSections.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
  });

  // Map the data back to individual section results
  return safeSections.map((section, index) => ({
    section,
    data: data?.[index],
    isLoading,
    error
  }));
};