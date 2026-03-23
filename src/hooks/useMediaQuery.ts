import { useEffect, useState } from 'react';

const getMatch = (query: string): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia(query).matches;
};

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => getMatch(query));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(query);
    const handleChange = () => setMatches(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}
