import { useState, useEffect, useCallback } from 'react';
import {
  getReels,
  createReel as createReelApi,
  updateReel as updateReelApi,
  deleteReel as deleteReelApi,
  toggleFavorite as toggleFavoriteApi
} from '../api/reels';

export const useReels = (filters = {}) => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    hasMore: false
  });

  const {
    category = 'all',
    platform = 'all',
    search = '',
    favorite = false,
    sort = 'newest'
  } = filters;

  const fetchReelsData = useCallback(
    async (pageToFetch = 1, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const params = {
          page: pageToFetch,
          limit: 12,
          sort
        };

        if (category && category !== 'all') params.category = category;
        if (platform && platform !== 'all') params.platform = platform;
        if (search && search.trim()) params.search = search.trim();
        if (favorite) params.favorite = 'true';

        const response = await getReels(params);
        if (response.success && response.data) {
          const { reels: fetchedReels, pagination: newPagination } = response.data;
          setReels((prev) => (append ? [...prev, ...fetchedReels] : fetchedReels));
          setPagination(newPagination);
        }
      } catch (err) {
        console.error('Error fetching reels:', err);
        setError(err.response?.data?.message || 'Failed to load reels. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category, platform, search, favorite, sort]
  );

  // Trigger fetch when filters change
  useEffect(() => {
    fetchReelsData(1, false);
  }, [fetchReelsData]);

  const loadMore = () => {
    if (pagination.hasMore && !loadingMore && !loading) {
      fetchReelsData(pagination.page + 1, true);
    }
  };

  const addReel = async (reelData) => {
    const response = await createReelApi(reelData);
    if (response.success && response.data) {
      // Prepend to current list if matches filter
      setReels((prev) => [response.data, ...prev]);
      setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
      return response.data;
    }
    throw new Error(response.message || 'Failed to save reel');
  };

  const editReel = async (id, updatedFields) => {
    const response = await updateReelApi(id, updatedFields);
    if (response.success && response.data) {
      setReels((prev) =>
        prev.map((reel) => (reel._id === id ? response.data : reel))
      );
      return response.data;
    }
    throw new Error(response.message || 'Failed to update reel');
  };

  const removeReel = async (id) => {
    const response = await deleteReelApi(id);
    if (response.success) {
      setReels((prev) => prev.filter((reel) => reel._id !== id));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      return true;
    }
    throw new Error(response.message || 'Failed to delete reel');
  };

  const toggleFavoriteReel = async (id) => {
    // Optimistic update
    setReels((prev) =>
      prev.map((r) => (r._id === id ? { ...r, isFavorite: !r.isFavorite } : r))
    );

    try {
      const response = await toggleFavoriteApi(id);
      if (response.success && response.data) {
        setReels((prev) =>
          prev.map((r) =>
            r._id === id ? { ...r, isFavorite: response.data.isFavorite } : r
          )
        );
        return response.data.isFavorite;
      }
    } catch (err) {
      // Revert optimistic update
      setReels((prev) =>
        prev.map((r) => (r._id === id ? { ...r, isFavorite: !r.isFavorite } : r))
      );
      throw err;
    }
  };

  return {
    reels,
    loading,
    loadingMore,
    error,
    pagination,
    loadMore,
    addReel,
    editReel,
    removeReel,
    toggleFavoriteReel,
    refetch: () => fetchReelsData(1, false)
  };
};

export default useReels;
