import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../config/constants';

const STORAGE_KEY = STORAGE_KEYS.FAVORITE_ADMIN_LINKS;

export function useFavoriteAdminLinks() {
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

  const toggleFavoriteLink = useCallback((path: string) => {
    setFavorites((prev) => {
      if (prev.includes(path)) {
        return prev.filter((item) => item !== path);
      }
      return [...prev, path];
    });
  }, []);

  const isFavoriteLink = useCallback((path: string) => favorites.includes(path), [favorites]);

  return {
    favorites,
    toggleFavoriteLink,
    isFavoriteLink,
  };
}
