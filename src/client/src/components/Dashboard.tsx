import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { RefreshCw, Settings, Plus } from 'lucide-react';
import { TrendingSection } from './TrendingSection';
import { MobileSectionCarousel } from './MobileSectionCarousel';
import { SettingsModal } from './SettingsModal';
import { ThemeToggle } from './ThemeToggle';
import { useProgressiveTrendingWithRetention, useRefreshSingleSectionWithRetention } from '../hooks/useTrending';
import { Section } from '../types';
import { storage } from '../utils/storage';
import 'react-grid-layout/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export const Dashboard: React.FC = () => {
  const [sections, setSections] = useState<Section[]>(() => storage.getSettings().sections);
  const [showSettings, setShowSettings] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  // Detect mobile devices
  useEffect(() => {
    const checkIsMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth <= 768;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const mobile = isMobileDevice || isSmallScreen || isTouchDevice;
      setIsMobile(mobile);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Use progressive loading - each section loads independently
  const sectionQueries = useProgressiveTrendingWithRetention(sections);
  const refreshSingleMutation = useRefreshSingleSectionWithRetention();

  // Helper to get data for a specific section
  const getSectionQuery = (sectionId: string) => {
    return sectionQueries.find(q => q.section.id === sectionId);
  };

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
      // Refresh all sections individually for immediate visual feedback
      sections.forEach(section => {
        refreshSingleMutation.mutate(section);
      });
    }
  };

  const handleSingleRefresh = (keyword: string) => {
    const section = sections.find(s => s.keyword === keyword);
    if (section) {
      refreshSingleMutation.mutate(section);
    }
  };

  // Check if any sections are loading
  const hasAnySectionLoading = sectionQueries.some(q => q.isLoading);

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
    <div
      className={`${isMobile ? 'h-screen' : 'min-h-screen'} bg-gray-50 dark:bg-gray-900 transition-colors ${isMobile ? 'overflow-hidden' : ''}`}
      style={isMobile ? {
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-x pan-y'
      } : {}}
    >
      <header className={`bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 ${isMobile ? 'sticky top-0 z-50' : ''}`}>
        <div className={`${isMobile ? 'px-3 py-2' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'}`}>
          <div className="flex items-center justify-between">
            <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 dark:text-white`}>
              {isMobile ? 'Trending' : 'Trending Topics'}
            </h1>
            <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'}`}>
              {hasAnySectionLoading && isMobile && (
                <div className="w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              )}
              {hasAnySectionLoading && !isMobile && (
                <div className="text-sm text-blue-600 dark:text-blue-400 animate-pulse">
                  Loading sections...
                </div>
              )}
              <ThemeToggle />
              {!isMobile && (
                <button
                  onClick={handleRefresh}
                  disabled={refreshSingleMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw size={16} className={refreshSingleMutation.isPending ? 'animate-spin' : ''} />
                  {refreshSingleMutation.isPending ? 'Refreshing...' : 'Refresh All'}
                </button>
              )}
              <button
                onClick={() => setShowSettings(true)}
                className={`flex items-center gap-2 ${isMobile ? 'p-2' : 'px-4 py-2'} text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors`}
              >
                <Plus size={isMobile ? 18 : 16} />
                {!isMobile && 'Add Section'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className={`${isMobile ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
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
        ) : isMobile ? (
          <div
            className="fixed inset-x-0 top-[60px] bottom-0 px-4 overflow-hidden"
            style={{
              overscrollBehavior: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <MobileSectionCarousel
              sections={sections}
              getSectionQuery={getSectionQuery}
              onRemove={handleRemoveSection}
              onSettings={handleSectionSettings}
              onRefresh={handleSingleRefresh}
              refreshSingleMutation={refreshSingleMutation}
            />
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
            {sections.map((section) => {
              const sectionQuery = getSectionQuery(section.id);
              return (
                <div key={section.id}>
                  <TrendingSection
                    section={section}
                    data={sectionQuery?.data}
                    isLoading={sectionQuery?.isLoading || false}
                    isProgressiveLoading={false} // Not needed with individual loading
                    error={sectionQuery?.error}
                    onRemove={handleRemoveSection}
                    onSettings={handleSectionSettings}
                    onRefresh={handleSingleRefresh}
                    isRefreshing={refreshSingleMutation.isPending && refreshSingleMutation.variables?.keyword === section.keyword}
                  />
                </div>
              );
            })}
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