import React, { useState, useRef } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  // Handle touch events for swiping
  const handleTouchStart = (e: React.TouchEvent) => {
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

  if (sections.length === 0) {
    return null;
  }

  const currentSection = sections[currentIndex];

  return (
    <div
      className="relative h-full bg-gray-50 dark:bg-gray-900"
      style={{
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Section indicators */}
      <div className="flex justify-center mb-3 gap-2 pt-2">
        {sections.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSection(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex
                ? 'bg-blue-500'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
            aria-label={`Go to section ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      {sections.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous section"
          >
            <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>

          <button
            onClick={goToNext}
            disabled={currentIndex === sections.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next section"
          >
            <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </>
      )}

      {/* Current section title */}
      <div className="text-center mb-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {currentSection.keyword}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {currentIndex + 1} of {sections.length}
        </p>
      </div>

      {/* Swipeable container */}
      <div
        ref={containerRef}
        className="h-full overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900"
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
              <div key={section.id} className="w-full flex-shrink-0 h-full bg-gray-50 dark:bg-gray-900">
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