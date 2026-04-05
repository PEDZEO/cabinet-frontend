import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../config/constants';

const STORAGE_KEY = STORAGE_KEYS.FAVORITE_SETTING_CATEGORIES;

export function useFavoriteSettingCategories() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // Ignore storage errors
    }
  }, [favorites]);

  const toggleFavoriteCategory = useCallback((categoryKey: string) => {
    setFavorites((prev) => {
      if (prev.includes(categoryKey)) {
        return prev.filter((key) => key !== categoryKey);
      }
      return [...prev, categoryKey];
    });
  }, []);

  const isFavoriteCategory = useCallback(
    (categoryKey: string) => favorites.includes(categoryKey),
    [favorites],
  );

  return {
    favorites,
    toggleFavoriteCategory,
    isFavoriteCategory,
    count: favorites.length,
  };
}
