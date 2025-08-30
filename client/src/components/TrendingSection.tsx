import React from 'react';
import { ExternalLink, Loader2, Trash2, Settings } from 'lucide-react';
import { TrendingData, Section } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface TrendingSectionProps {
  section: Section;
  data?: TrendingData;
  isLoading?: boolean;
  error?: Error | null;
  onRemove: (sectionId: string) => void;
  onSettings: (section: Section) => void;
}

export const TrendingSection: React.FC<TrendingSectionProps> = ({
  section,
  data,
  isLoading,
  error,
  onRemove,
  onSettings
}) => {
  const handleTopicClick = (searchUrl: string) => {
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="font-semibold text-lg text-gray-900">{section.keyword}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSettings(section);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
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
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
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
            <span className="ml-2 text-gray-600">Loading trends...</span>
          </div>
        )}
        
        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">Failed to load trends</p>
            <p className="text-sm text-gray-500">{error.message}</p>
          </div>
        )}
        
        {data && !isLoading && (
          <>
            <div className="space-y-3">
              {data.topics.slice(0, section.maxResults).map((topic, index) => (
                <div key={index} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTopicClick(topic.searchUrl);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="text-left w-full group"
                  >
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 flex items-start gap-2">
                      {topic.title}
                      <ExternalLink size={14} className="text-gray-400 group-hover:text-blue-500 mt-0.5 flex-shrink-0" />
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 group-hover:text-gray-800">
                      {topic.summary}
                    </p>
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                {data.cached && '📋 '}
                Updated {formatDistanceToNow(data.lastUpdated, { addSuffix: true })}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};