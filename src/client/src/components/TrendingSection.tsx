import React, { useState, useEffect } from 'react';
import { ExternalLink, Loader2, Trash2, Settings, RefreshCw } from 'lucide-react';
import { TrendingData, Section } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface TrendingSectionProps {
  section: Section;
  data?: TrendingData;
  isLoading?: boolean;
  isProgressiveLoading?: boolean;
  error?: Error | null;
  onRemove: (sectionId: string) => void;
  onSettings: (section: Section) => void;
  onRefresh?: (keyword: string) => void;
  isRefreshing?: boolean;
  isMobileCarousel?: boolean;
}

export const TrendingSection: React.FC<TrendingSectionProps> = ({
  section,
  data,
  isLoading,
  isProgressiveLoading,
  error,
  onRemove,
  onSettings,
  onRefresh,
  isRefreshing,
  isMobileCarousel = false
}) => {
  // Real-time timestamp updates
  const [, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date()); // This forces re-render every minute
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleTopicClick = (searchUrl: string) => {
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 h-full flex flex-col transition-colors ${isMobileCarousel ? 'border-0 shadow-none relative' : ''}`}>
      {!isMobileCarousel && (
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg text-gray-900 dark:text-white">{section.keyword}</h2>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRefresh(section.keyword);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                disabled={isRefreshing}
                className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50"
                title={isRefreshing ? 'Refreshing...' : (isProgressiveLoading ? 'Loading fresh data...' : 'Refresh this section')}
              >
                <RefreshCw size={16} className={(isRefreshing || isProgressiveLoading) ? 'animate-spin' : ''} />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSettings(section);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(section.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Remove section"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
      
      {/* Mobile carousel floating actions */}
      {isMobileCarousel && (
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          {onRefresh && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRefresh(section.keyword);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              disabled={isRefreshing}
              className="p-2 bg-white dark:bg-gray-800 text-blue-500 hover:text-blue-700 shadow-md rounded-full border border-gray-200 dark:border-gray-600 transition-colors disabled:opacity-50"
              title={isRefreshing ? 'Refreshing...' : 'Refresh this section'}
            >
              <RefreshCw size={18} className={(isRefreshing || isProgressiveLoading) ? 'animate-spin' : ''} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSettings(section);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="p-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 shadow-md rounded-full border border-gray-200 dark:border-gray-600 transition-colors"
            title="Settings"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(section.id);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="p-2 bg-white dark:bg-gray-800 text-red-500 hover:text-red-700 shadow-md rounded-full border border-gray-200 dark:border-gray-600 transition-colors"
            title="Remove section"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}

      <div
        className={`flex-1 overflow-y-auto ${isMobileCarousel ? 'p-4 pt-16' : 'p-4'}`}
        style={isMobileCarousel ? {
          touchAction: 'pan-y',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch'
        } : { touchAction: 'pan-y' }}
      >
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600 dark:text-gray-300">Loading trends...</span>
          </div>
        )}
        
        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400 mb-2">Failed to load trends</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{error.message}</p>
          </div>
        )}
        
        {data && !isLoading && (
          <>
            <div className="space-y-3">
              {data.topics.slice(0, section.maxResults).map((topic: any, index: number) => (
                <div key={index} className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-3 last:pb-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTopicClick(topic.searchUrl);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="text-left w-full group"
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-start gap-2 transition-colors">
                      {topic.title}
                      <ExternalLink size={14} className="text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 mt-0.5 flex-shrink-0 transition-colors" />
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors">
                      {topic.summary}
                    </p>
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                Updated {formatDistanceToNow(data.lastUpdated, { 
                  addSuffix: true, 
                  includeSeconds: false
                })}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};