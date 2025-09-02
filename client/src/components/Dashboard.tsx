import React, { useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { RefreshCw, Settings, Plus } from 'lucide-react';
import { TrendingSection } from './TrendingSection';
import { SettingsModal } from './SettingsModal';
import { ThemeToggle } from './ThemeToggle';
import { useTrendingWithRetention, useRefreshTrendingWithRetention, useRefreshSingleSectionWithRetention } from '../hooks/useTrending';
import { Section, TrendingData } from '../types';
import { storage } from '../utils/storage';
import 'react-grid-layout/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export const Dashboard: React.FC = () => {
  const [sections, setSections] = useState<Section[]>(() => storage.getSettings().sections);
  const [showSettings, setShowSettings] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  // const keywords = useMemo(() => sections.map(s => s.keyword), [sections]); // Not needed with retention-aware hooks
  
  // Use the new hook with cache retention support
  const { data: trendingData, isLoading, error } = useTrendingWithRetention(sections);
  const isProgressiveLoading = false; // Simplified for now - can be enhanced later
  const refreshMutation = useRefreshTrendingWithRetention();
  const refreshSingleMutation = useRefreshSingleSectionWithRetention();

  const handleLayoutChange = (layout: any[]) => {
    const updatedSections = sections.map(section => {
      const layoutItem = layout.find(l => l.i === section.id);
      if (layoutItem) {
        return {
          ...section,
          position: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          }
        };
      }
      return section;
    });
    
    setSections(updatedSections);
    storage.saveSettings({ sections: updatedSections });
  };

  const handleAddSection = (keyword: string, maxResults: number, cacheRetention: { value: number; unit: 'hour' | 'day' }) => {
    const newSection = storage.addSection(keyword, maxResults, cacheRetention);
    setSections(prev => [...prev, newSection]);
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<Section>) => {
    storage.updateSection(sectionId, updates);
    setSections(prev => 
      prev.map(s => s.id === sectionId ? { ...s, ...updates } : s)
    );
    setEditingSection(null);
  };

  const handleRemoveSection = (sectionId: string) => {
    storage.removeSection(sectionId);
    setSections(prev => prev.filter(s => s.id !== sectionId));
  };

  const handleSectionSettings = (section: Section) => {
    setEditingSection(section);
    setShowSettings(true);
  };

  const handleRefresh = () => {
    if (sections.length > 0) {
      refreshMutation.mutate(sections);
    }
  };

  const handleSingleRefresh = (keyword: string) => {
    const section = sections.find(s => s.keyword === keyword);
    if (section) {
      refreshSingleMutation.mutate(section);
    }
  };

  const getTrendingDataForKeyword = (keyword: string): TrendingData | undefined => {
    return trendingData?.find(data => data.keyword === keyword);
  };

  const layouts = {
    lg: sections.map(section => ({
      i: section.id,
      x: section.position.x,
      y: section.position.y,
      w: section.position.w || 2,
      h: section.position.h || 2,
      minW: 1,
      minH: 2
    })),
    md: sections.map(section => ({
      i: section.id,
      x: section.position.x % 3,
      y: section.position.y,
      w: Math.min(section.position.w || 2, 2),
      h: section.position.h || 2,
      minW: 1,
      minH: 2
    })),
    sm: sections.map(section => ({
      i: section.id,
      x: section.position.x % 2,
      y: section.position.y,
      w: Math.min(section.position.w || 1, 1),
      h: section.position.h || 2,
      minW: 1,
      minH: 2
    })),
    xs: sections.map((section, index) => ({
      i: section.id,
      x: 0,
      y: index * 2,
      w: 1,
      h: section.position.h || 2,
      minW: 1,
      minH: 2
    }))
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Trending Topics
            </h1>
            <div className="flex items-center gap-3">
              {isProgressiveLoading && (
                <div className="text-sm text-blue-600 dark:text-blue-400 animate-pulse">
                  Loading fresh data...
                </div>
              )}
              <ThemeToggle />
              <button
                onClick={handleRefresh}
                disabled={refreshMutation.isPending || isLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={16} className={(refreshMutation.isPending || isProgressiveLoading) ? 'animate-spin' : ''} />
                {isProgressiveLoading ? 'Loading...' : 'Refresh'}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Add Section
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sections.length === 0 ? (
          <div className="text-center py-12">
            <Settings size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No sections configured</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Add your first section to start tracking trending topics</p>
            <button
              onClick={() => setShowSettings(true)}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add Section
            </button>
          </div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
            cols={{ lg: 4, md: 3, sm: 2, xs: 1 }}
            rowHeight={200}
            onLayoutChange={handleLayoutChange}
            isDraggable={true}
            isResizable={true}
            margin={[16, 16]}
          >
            {sections.map((section) => (
              <div key={section.id}>
                <TrendingSection
                  section={section}
                  data={getTrendingDataForKeyword(section.keyword)}
                  isLoading={isLoading && !trendingData} // Only show loading if no data at all
                  isProgressiveLoading={isProgressiveLoading && !getTrendingDataForKeyword(section.keyword)}
                  error={error}
                  onRemove={handleRemoveSection}
                  onSettings={handleSectionSettings}
                  onRefresh={handleSingleRefresh}
                  isRefreshing={refreshSingleMutation.isPending && refreshSingleMutation.variables?.keyword === section.keyword}
                />
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </main>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => {
          setShowSettings(false);
          setEditingSection(null);
        }}
        sections={sections}
        onAddSection={handleAddSection}
        onUpdateSection={handleUpdateSection}
        editingSection={editingSection}
      />
    </div>
  );
};