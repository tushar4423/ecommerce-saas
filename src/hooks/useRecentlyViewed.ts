import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function useRecentlyViewed() {
  const { user } = useAuth();
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadRecentlyViewed = useCallback(async () => {
    try {
      setLoading(true);
      const items = await api.getRecentlyViewed(user?.id);
      setRecentlyViewed(items);
    } catch (e) {
      console.warn('Failed to load recently viewed products:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadRecentlyViewed();
  }, [loadRecentlyViewed]);

  const addRecentlyViewed = useCallback(
    async (productId: string) => {
      try {
        await api.recordRecentlyViewed(productId, user?.id);
        // Refresh local list
        loadRecentlyViewed();
      } catch (e) {
        console.warn('Failed to record recently viewed product:', e);
      }
    },
    [user?.id, loadRecentlyViewed]
  );

  return {
    recentlyViewed,
    loading,
    addRecentlyViewed,
    refreshRecentlyViewed: loadRecentlyViewed,
  };
}
