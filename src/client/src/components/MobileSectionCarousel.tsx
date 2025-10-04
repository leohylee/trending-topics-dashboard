import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TrendingSection } from './TrendingSection';
import { Section } from '../types';

interface MobileSectionCarouselProps {
  sections: Section[];
  getSectionQuery: (sectionId: string) => any;
  onRemove: (sectionId: string) => void;
  onSettings: (section: Section) => void;
  onRefresh: (keyword: string) => void;
  refreshSingleMutation: any;
}

export const MobileSectionCarousel: React.FC<MobileSectionCarouselProps> = ({
  sections,
  getSectionQuery,
  onRemove,
  onSettings,
  onRefresh,
  refreshSingleMutation
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-adjust currentIndex when sections change
  useEffect(() => {
    // Safety check: ensure sections is defined and is an array
    if (!sections || !Array.isArray(sections)) {
      setCurrentIndex(0);
      return;
    }

    if (sections.length === 0) {
      setCurrentIndex(0);
    } else {
      // Use functional update to avoid needing currentIndex in dependencies
      setCurrentIndex(prevIndex => {
        if (prevIndex >= sections.length) {
          return Math.max(0, sections.length - 1);
        }
        return prevIndex;
      });
    }
  }, [sections?.length]);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  // Handle touch events for swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't start dragging if touch started on a button
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      isDragging.current = false;
      return;
    }
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    currentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;

    const diffX = startX.current - currentX.current;
    const threshold = 50; // Minimum swipe distance

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0 && currentIndex < sections.length - 1) {
        // Swipe left - next section
        setCurrentIndex(prev => prev + 1);
      } else if (diffX < 0 && currentIndex > 0) {
        // Swipe right - previous section
        setCurrentIndex(prev => prev - 1);
      }
    }

    isDragging.current = false;
  };

  // Navigation functions
  const goToPrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => Math.min(sections.length - 1, prev + 1));
  };

  const goToSection = (index: number) => {
    setCurrentIndex(index);
  };

  // Safety checks
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return null;
  }

  const currentSection = sections[currentIndex];

  // Safety check: if currentSection is undefined, don't render
  if (!currentSection) {
    return null;
  }

  return (
    <div
      className="relative h-full bg-gray-50 dark:bg-gray-900"
      style={{
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Compact header with title and indicators */}
      <div className="flex items-center justify-between px-4 py-2 mb-2">
        {/* Navigation button - Left */}
        {sections.length > 1 && (
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="p-1.5 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous section"
          >
            <ChevronLeft size={16} className="text-gray-600 dark:text-gray-300" />
          </button>
        )}
        {sections.length <= 1 && <div className="w-8" />}

        {/* Center: Title and indicators */}
        <div className="flex flex-col items-center flex-1 mx-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate max-w-full">
            {currentSection.keyword}
          </h2>
          <div className="flex gap-1.5 mt-1">
            {sections.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSection(index)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === currentIndex
                    ? 'bg-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
                aria-label={`Go to section ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Navigation button - Right */}
        {sections.length > 1 && (
          <button
            onClick={goToNext}
            disabled={currentIndex === sections.length - 1}
            className="p-1.5 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next section"
          >
            <ChevronRight size={16} className="text-gray-600 dark:text-gray-300" />
          </button>
        )}
        {sections.length <= 1 && <div className="w-8" />}
      </div>

      {/* Swipeable container */}
      <div
        ref={containerRef}
        className="h-full overflow-x-hidden overflow-y-auto rounded-lg bg-gray-50 dark:bg-gray-900"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          touchAction: 'pan-y pinch-zoom',
          overscrollBehavior: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {sections.map((section) => {
            const query = getSectionQuery(section.id);
            return (
              <div key={section.id} className="w-full flex-shrink-0 h-full bg-gray-50 dark:bg-gray-900 relative">
                <TrendingSection
                  section={section}
                  data={query?.data}
                  isLoading={query?.isLoading || false}
                  isProgressiveLoading={false}
                  error={query?.error}
                  onRemove={onRemove}
                  onSettings={onSettings}
                  onRefresh={onRefresh}
                  isRefreshing={refreshSingleMutation.isPending && refreshSingleMutation.variables?.keyword === section.keyword}
                  isMobileCarousel={true}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};