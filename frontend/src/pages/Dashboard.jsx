import React, { useState, useEffect, useCallback } from 'react';
import {
  Film,
  Plus,
  Filter,
  Star,
  ArrowUpDown,
  RefreshCw,
  SlidersHorizontal,
  Instagram,
  Youtube,
  Video,
  Facebook,
  Twitter,
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReels } from '../hooks/useReels';
import { getCategories } from '../api/categories';
import { useToast } from '../components/Toast';

import ReelCard from '../components/ReelCard';
import AddReelForm from '../components/AddReelForm';
import CategoryFilter from '../components/CategoryFilter';
import SearchBar from '../components/SearchBar';
import { ReelSkeleton } from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import EditReelModal from '../components/EditReelModal';
import CategoryModal from '../components/CategoryModal';

const PLATFORM_FILTERS = [
  { id: 'all', label: 'All Platforms' },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'youtube', label: 'YouTube Shorts', icon: Youtube },
  { id: 'tiktok', label: 'TikTok', icon: Video },
  { id: 'facebook', label: 'Facebook', icon: Facebook },
  { id: 'twitter', label: 'Twitter / X', icon: Twitter },
  { id: 'other', label: 'Web Video', icon: Globe }
];

export const Dashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  // Categories state
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');

  // Modal dialog states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingReel, setEditingReel] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [reelToDelete, setReelToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Hook for reels
  const {
    reels,
    loading,
    loadingMore,
    pagination,
    loadMore,
    addReel,
    editReel,
    removeReel,
    toggleFavoriteReel,
    refetch
  } = useReels({
    category: selectedCategory,
    platform: selectedPlatform,
    search: searchQuery,
    favorite: onlyFavorites,
    sort: sortOrder
  });

  // Fetch categories with counts
  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const res = await getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Handle Add Reel
  const handleAddReel = async (reelData) => {
    try {
      await addReel(reelData);
      addToast({ message: 'Reel saved to your vault! ✨' });
      loadCategories(); // update category counts
    } catch (err) {
      throw err;
    }
  };

  // Handle Edit Reel
  const handleOpenEdit = (reel) => {
    setEditingReel(reel);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (id, updatedFields) => {
    try {
      await editReel(id, updatedFields);
      addToast({ message: 'Reel updated successfully!' });
      loadCategories();
    } catch (err) {
      throw err;
    }
  };

  // Handle Delete Reel
  const handleOpenDelete = (reel) => {
    setReelToDelete(reel);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!reelToDelete) return;
    try {
      setDeleteLoading(true);
      await removeReel(reelToDelete._id);
      addToast({ message: 'Reel removed from your vault.', type: 'info' });
      setIsDeleteDialogOpen(false);
      setReelToDelete(null);
      loadCategories();
    } catch (err) {
      addToast({
        message: err.response?.data?.message || 'Failed to delete reel',
        type: 'error'
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle Favorite Toggle
  const handleToggleFavorite = async (id) => {
    try {
      const isFav = await toggleFavoriteReel(id);
      addToast({
        message: isFav ? 'Added to favorites ⭐' : 'Removed from favorites',
        type: 'info'
      });
    } catch {
      addToast({ message: 'Failed to update favorite status', type: 'error' });
    }
  };

  // Total reels across all categories
  const totalReelsCount = categories.reduce((sum, cat) => sum + (cat.count || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Quick Add Form Section */}
      <AddReelForm
        categories={categories}
        onReelAdded={handleAddReel}
        onCategoriesRequested={loadCategories}
      />

      {/* Filter and Control Bar */}
      <div className="space-y-4 mb-8">
        {/* Category Horizontal Filter Chips */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onManageCategories={() => setIsCategoryModalOpen(true)}
          totalReels={totalReelsCount}
        />

        {/* Search, Platform Filter, Favorites, and Sort Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <SearchBar onSearch={setSearchQuery} />
          </div>

          {/* Action Filters: Platform, Favorites, Sort */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
            {/* Platform Select */}
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              aria-label="Filter by platform"
            >
              {PLATFORM_FILTERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>

            {/* Favorites Toggle Button */}
            <button
              type="button"
              onClick={() => setOnlyFavorites((prev) => !prev)}
              className={`h-10 px-3.5 rounded-xl text-xs sm:text-sm font-medium border flex items-center gap-2 transition-all shrink-0 ${
                onlyFavorites
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Show only favorite reels"
            >
              <Star className={`w-4 h-4 ${onlyFavorites ? 'fill-white' : 'text-amber-500'}`} />
              <span className="hidden sm:inline">Favorites</span>
            </button>

            {/* Sort Toggle */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              aria-label="Sort reels"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => {
                refetch();
                loadCategories();
              }}
              className="h-10 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Refresh reels"
              aria-label="Refresh reels"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Reels Grid Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <ReelSkeleton key={idx} />
          ))}
        </div>
      ) : reels.length === 0 ? (
        <EmptyState
          type={
            searchQuery
              ? 'no-results'
              : onlyFavorites
              ? 'no-favorites'
              : selectedCategory !== 'all'
              ? 'no-category'
              : 'no-reels'
          }
          onAction={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          actionText="Save a Reel"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {reels.map((reel) => (
              <ReelCard
                key={reel._id}
                reel={reel}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
                onToggleFavorite={handleToggleFavorite}
                onTagClick={(tag) => setSearchQuery(tag)}
              />
            ))}
          </div>

          {/* Pagination / Load More Button */}
          {pagination.hasMore && (
            <div className="flex justify-center mt-10">
              <button
                type="button"
                disabled={loadingMore}
                onClick={loadMore}
                className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {loadingMore ? 'Loading more reels...' : `Load More (${reels.length} of ${pagination.total})`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit Reel Modal */}
      <EditReelModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingReel(null);
        }}
        reel={editingReel}
        categories={categories}
        onSave={handleSaveEdit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setReelToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Delete Reel?"
        message={`Are you sure you want to remove "${reelToDelete?.title || 'this reel'}" from your vault? This cannot be undone.`}
        confirmText="Delete Reel"
      />

      {/* Category Manager Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onCategoriesUpdated={() => {
          loadCategories();
          refetch();
        }}
      />
    </div>
  );
};

export default Dashboard;
