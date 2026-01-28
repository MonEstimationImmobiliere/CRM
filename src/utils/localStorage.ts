/**
 * Utility functions for localStorage operations
 * Provides type-safe storage with error handling
 */

export interface StorageOptions {
  expiry?: number; // Expiry time in milliseconds
}

export class LocalStorage {
  /**
   * Save data to localStorage with optional expiry
   */
  static set<T>(key: string, data: T, options?: StorageOptions): boolean {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        expiry: options?.expiry ? Date.now() + options.expiry : null,
      };

      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  /**
   * Get data from localStorage with expiry check
   */
  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);

      // Check if item has expired
      if (parsed.expiry && Date.now() > parsed.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  /**
   * Remove item from localStorage
   */
  static remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  /**
   * Clear all localStorage data
   */
  static clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  /**
   * Check if localStorage is available
   */
  static isAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all keys from localStorage with a specific prefix
   */
  static getKeysWithPrefix(prefix: string): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    return keys;
  }
}

// Predefined storage keys to avoid typos
export const STORAGE_KEYS = {
  REMINDERS: 'crm_reminders',
  PROPERTIES: 'crm_properties',
  USER_PREFERENCES: 'crm_user_preferences',
  DASHBOARD_STATE: 'crm_dashboard_state',
  FILTERS_STATE: 'crm_filters_state',
} as const;
