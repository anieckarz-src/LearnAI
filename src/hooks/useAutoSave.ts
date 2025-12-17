import { useEffect, useRef, useCallback } from "react";

interface UseAutoSaveOptions<T> {
  key: string;
  data: T;
  onSave?: (data: T) => void;
  delay?: number; // in milliseconds
  enabled?: boolean;
}

/**
 * Custom hook for auto-saving form data to localStorage
 * Debounces saves to avoid excessive writes
 */
export function useAutoSave<T>({
  key,
  data,
  onSave,
  delay = 30000, // 30 seconds default
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string | null>(null);

  const save = useCallback(() => {
    if (!enabled) return;

    try {
      const dataString = JSON.stringify(data);

      // Only save if data has changed
      if (dataString !== lastSavedRef.current) {
        localStorage.setItem(key, dataString);
        lastSavedRef.current = dataString;

        if (onSave) {
          onSave(data);
        }
      }
    } catch (error) {
      console.error("Error auto-saving to localStorage:", error);
    }
  }, [key, data, onSave, enabled]);

  // Auto-save with debounce
  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, save, enabled]);

  // Load saved data
  const loadSaved = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved) as T;
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
    }
    return null;
  }, [key]);

  // Clear saved data
  const clearSaved = useCallback(() => {
    try {
      localStorage.removeItem(key);
      lastSavedRef.current = null;
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  }, [key]);

  // Manual save
  const manualSave = useCallback(() => {
    save();
  }, [save]);

  return {
    loadSaved,
    clearSaved,
    manualSave,
  };
}
