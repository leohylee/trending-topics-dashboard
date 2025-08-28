import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Section, APP_LIMITS } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Section[];
  onAddSection: (keyword: string, maxResults: number) => void;
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
  
  useEffect(() => {
    if (editingSection) {
      setKeyword(editingSection.keyword);
      setMaxResults(editingSection.maxResults);
    } else {
      setKeyword('');
      setMaxResults(5);
    }
  }, [editingSection, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!keyword.trim()) return;
    
    if (editingSection) {
      onUpdateSection(editingSection.id, {
        keyword: keyword.trim(),
        maxResults
      });
    } else {
      onAddSection(keyword.trim(), maxResults);
    }
    
    setKeyword('');
    setMaxResults(5);
    onClose();
  };

  const canAddMore = sections.length < APP_LIMITS.MAX_KEYWORDS;
  const isEditing = !!editingSection;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Edit Section' : 'Add New Section'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">
              Keyword
            </label>
            <input
              type="text"
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Technology, Sports, AI..."
              required
            />
          </div>
          
          <div>
            <label htmlFor="maxResults" className="block text-sm font-medium text-gray-700 mb-1">
              Max Topics: {maxResults}
            </label>
            <input
              type="range"
              id="maxResults"
              min={APP_LIMITS.MIN_RESULTS_PER_KEYWORD}
              max={APP_LIMITS.MAX_RESULTS_PER_KEYWORD}
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{APP_LIMITS.MIN_RESULTS_PER_KEYWORD}</span>
              <span>{APP_LIMITS.MAX_RESULTS_PER_KEYWORD}</span>
            </div>
          </div>
          
          {!isEditing && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600">
                Sections: {sections.length}/{APP_LIMITS.MAX_KEYWORDS}
              </p>
              {!canAddMore && (
                <p className="text-sm text-red-600 mt-1">
                  Maximum sections reached. Remove a section to add a new one.
                </p>
              )}
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!keyword.trim() || (!isEditing && !canAddMore)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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