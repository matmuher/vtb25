// src/hooks/useExtensionStorage.js
import { useState, useEffect, useCallback } from 'react';

// Define a prefix to avoid key collisions with other potential storage uses
const STORAGE_PREFIX = 'cashback_ext_';

const useExtensionStorage = (key, defaultValue = null) => {
  const fullKey = STORAGE_PREFIX + key;

  const [state, setState] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial state from browser.storage or localStorage
  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        setLoading(true);
        // Check if we are in an extension environment
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
          // Use chrome.storage.sync for syncing across Firefox profiles, or chrome.storage.local for local-only
          const result = await chrome.storage.sync.get(fullKey);
          if (result.hasOwnProperty(fullKey)) {
            setState(result[fullKey]);
          } else {
            setState(defaultValue);
          }
        } else {
          // Fallback to localStorage if not in extension environment
          const savedValue = localStorage.getItem(fullKey);
          if (savedValue !== null) {
            // localStorage stores strings, so we need to parse JSON if the default value is an object/array
            // This assumes defaultValue is the correct type to parse the stored string
            try {
              const parsedValue = JSON.parse(savedValue);
              setState(parsedValue);
            } catch (e) {
              // If parsing fails, assume it was a string and use as-is, or fallback to default
              console.warn(`Failed to parse localStorage value for key '${fullKey}', using default.`);
              setState(defaultValue);
            }
          } else {
            setState(defaultValue);
          }
        }
      } catch (err) {
        console.error(`Error loading state for key '${fullKey}' from storage:`, err);
        setError(err);
        setState(defaultValue); // Fallback to default value on error
      } finally {
        setLoading(false);
      }
    };

    loadFromStorage();
  }, [fullKey, defaultValue]);

  // Function to update state and save to browser.storage or localStorage
  const setStateAndSave = useCallback(async (newState) => {
    const valueToStore = typeof newState === 'function' ? newState(state) : newState;

    try {
      setState(valueToStore);
      // Check if we are in an extension environment
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        await chrome.storage.sync.set({ [fullKey]: valueToStore });
      } else {
        // Fallback to localStorage
        localStorage.setItem(fullKey, JSON.stringify(valueToStore));
      }
      setError(null); // Clear any previous error on successful save
    } catch (err) {
      console.error(`Error saving state for key '${fullKey}' to storage:`, err);
      setError(err);
      // Optionally revert state here if needed, though setState might have already updated it optimistically
    }
  }, [fullKey, state]);

  // Function to remove the item from storage and reset state
  const removeState = useCallback(async () => {
    try {
      // Check if we are in an extension environment
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        await chrome.storage.sync.remove(fullKey);
      } else {
        // Fallback to localStorage
        localStorage.removeItem(fullKey);
      }
      setState(defaultValue);
      setError(null);
    } catch (err) {
      console.error(`Error removing key '${fullKey}' from storage:`, err);
      setError(err);
    }
  }, [fullKey, defaultValue]);

  // Return state, setter, loading status, error, and remove function
  return [state, setStateAndSave, loading, error, removeState];
};

export default useExtensionStorage;
