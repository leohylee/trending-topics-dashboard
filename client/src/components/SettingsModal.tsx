import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Section, APP_LIMITS } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Section[];
  onAddSection: (keyword: string, maxResults: number, cacheRetention: { value: number; unit: 'hour' | 'day' }) => void;
  onUpdateSection: (sectionId: string, updates: Partial<Section>) => void;
  editingSection?: Section | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  sections,
  onAddSection,
  onUpdateSection,
  editingSection
}) => {
  const [keyword, setKeyword] = useState('');
  const [maxResults, setMaxResults] = useState(5);
  const [cacheRetentionValue, setCacheRetentionValue] = useState(1);
  const [cacheRetentionUnit, setCacheRetentionUnit] = useState<'hour' | 'day'>('hour');
  
  useEffect(() => {
    if (editingSection) {
      setKeyword(editingSection.keyword);
      setMaxResults(editingSection.maxResults);
      setCacheRetentionValue(editingSection.cacheRetention?.value || 1);
      setCacheRetentionUnit(editingSection.cacheRetention?.unit || 'hour');
    } else {
      setKeyword('');
      setMaxResults(5);
      setCacheRetentionValue(1);
      setCacheRetentionUnit('hour');
    }
  }, [editingSection, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!keyword.trim()) return;
    
    const cacheRetention = {
      value: cacheRetentionValue,
      unit: cacheRetentionUnit
    };
    
    if (editingSection) {
      onUpdateSection(editingSection.id, {
        keyword: keyword.trim(),
        maxResults,
        cacheRetention
      });
    } else {
      onAddSection(keyword.trim(), maxResults, cacheRetention);
    }
    
    setKeyword('');
    setMaxResults(5);
    setCacheRetentionValue(1);
    setCacheRetentionUnit('hour');
    onClose();
  };

  const canAddMore = sections.length < APP_LIMITS.maxKeywords;
  const isEditing = !!editingSection;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Section' : 'Add New Section'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Keyword
            </label>
            <input
              type="text"
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              placeholder="e.g., Technology, Sports, AI..."
              required
            />
          </div>
          
          <div>
            <label htmlFor="maxResults" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Max Topics: {maxResults}
            </label>
            <input
              type="range"
              id="maxResults"
              min={APP_LIMITS.minResultsPerKeyword}
              max={APP_LIMITS.maxResultsPerKeyword}
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>{APP_LIMITS.minResultsPerKeyword}</span>
              <span>{APP_LIMITS.maxResultsPerKeyword}</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Cache Retention Time
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={cacheRetentionUnit === 'hour' ? 168 : 7}
                value={cacheRetentionValue}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  const maxValue = cacheRetentionUnit === 'hour' ? 168 : 7;
                  if (value >= 1 && value <= maxValue) {
                    setCacheRetentionValue(value);
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <select
                value={cacheRetentionUnit}
                onChange={(e) => {
                  const newUnit = e.target.value as 'hour' | 'day';
                  setCacheRetentionUnit(newUnit);
                  const maxValue = newUnit === 'hour' ? 168 : 7;
                  if (cacheRetentionValue > maxValue) {
                    setCacheRetentionValue(maxValue);
                  }
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="hour">Hours</option>
                <option value="day">Days</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Range: 1-{cacheRetentionUnit === 'hour' ? 168 : 7} {cacheRetentionUnit}s (max 7 days)
            </p>
          </div>
          
          {!isEditing && (
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Sections: {sections.length}/{APP_LIMITS.maxKeywords}
              </p>
              {!canAddMore && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Maximum sections reached. Remove a section to add a new one.
                </p>
              )}
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!keyword.trim() || (!isEditing && !canAddMore)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {isEditing ? (
                'Update'
              ) : (
                <>
                  <Plus size={16} />
                  Add Section
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};