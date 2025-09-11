import { DashboardSettings, Section } from '../types';

const STORAGE_KEY = 'trending-dashboard-settings';

export const storage = {
  getSettings(): DashboardSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
    
    return this.getDefaultSettings();
  },

  saveSettings(settings: DashboardSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
  },

  getDefaultSettings(): DashboardSettings {
    return {
      sections: [
        {
          id: 'default-1',
          keyword: 'Technology',
          maxResults: 5,
          position: { x: 0, y: 0, w: 1, h: 2 }
        },
        {
          id: 'default-2',
          keyword: 'Science',
          maxResults: 5,
          position: { x: 1, y: 0, w: 1, h: 2 }
        }
      ]
    };
  },

  addSection(keyword: string, maxResults: number = 5): Section {
    const settings = this.getSettings();
    const newSection: Section = {
      id: `section-${Date.now()}`,
      keyword,
      maxResults,
      position: { x: 0, y: 0, w: 1, h: 2 }
    };
    
    settings.sections.push(newSection);
    this.saveSettings(settings);
    
    return newSection;
  },

  removeSection(sectionId: string): void {
    const settings = this.getSettings();
    settings.sections = settings.sections.filter(s => s.id !== sectionId);
    this.saveSettings(settings);
  },

  updateSection(sectionId: string, updates: Partial<Section>): void {
    const settings = this.getSettings();
    const sectionIndex = settings.sections.findIndex(s => s.id === sectionId);
    
    if (sectionIndex >= 0) {
      settings.sections[sectionIndex] = { ...settings.sections[sectionIndex], ...updates };
      this.saveSettings(settings);
    }
  }
};