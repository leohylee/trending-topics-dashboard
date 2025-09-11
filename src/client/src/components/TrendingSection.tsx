import React from 'react';
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
  isRefreshing
}) => {
  const handleTopicClick = (searchUrl: string) => {
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 h-full flex flex-col transition-colors">
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
      
      <div className="flex-1 p-4 overflow-y-auto">
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
              {data.topics.slice(0, section.maxResults).map((topic, index) => (
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
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  {data.cached ? (
                    <>
                      <span className="text-green-500">⚡</span>
                      <span>Cached data</span>
                    </>
                  ) : (
                    <>
                      <span className="text-blue-500">🌐</span>
                      <span>Fresh from web</span>
                    </>
                  )}
                </span>
                <span>
                  Updated {formatDistanceToNow(data.lastUpdated, { addSuffix: true })}
                </span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};