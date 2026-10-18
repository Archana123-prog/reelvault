import React, { useState } from 'react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { Plus, Trash2, Edit2, Check, AlertCircle } from 'lucide-react';
import { createCategory, updateCategory, deleteCategory } from '../api/categories';
import { useToast } from './Toast';

const PRESET_COLORS = [
  '#6366F1', // Indigo
  '#3B82F6', // Blue
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#F59E0B', // Amber
  '#F97316', // Orange
  '#EF4444', // Red
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#64748B'  // Slate
];

const PRESET_EMOJIS = ['📚', '❤️', '😂', '🔥', '✨', '🎵', '🍔', '✈️', '💪', '🎮', '💡', '💼', '🎬', '🎨', '🧠', '📌'];

export const CategoryModal = ({ isOpen, onClose, categories = [], onCategoriesUpdated }) => {
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366F1');
  const [icon, setIcon] = useState('📌');
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Delete dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleStartEdit = (cat) => {
    setEditingId(cat._id);
    setName(cat.name);
    setColor(cat.color || '#6366F1');
    setIcon(cat.icon || '📌');
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setColor('#6366F1');
    setIcon('📌');
    setError('');
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide a category name.');
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await updateCategory(editingId, {
          name: name.trim(),
          color,
          icon
        });
        addToast({ message: `Category "${name.trim()}" updated successfully!` });
      } else {
        await createCategory({
          name: name.trim(),
          color,
          icon
        });
        addToast({ message: `Category "${name.trim()}" created successfully!` });
      }

      handleCancelEdit();
      onCategoriesUpdated();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const promptDelete = (cat) => {
    if (cat.name.toLowerCase() === 'other') {
      addToast({
        message: 'The default "Other" category cannot be deleted.',
        type: 'error'
      });
      return;
    }
    setCategoryToDelete(cat);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await deleteCategory(categoryToDelete._id);
      addToast({
        message: res.message || `Category "${categoryToDelete.name}" deleted.`,
        type: 'info'
      });
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
      onCategoriesUpdated();
    } catch (err) {
      addToast({
        message: err.response?.data?.message || 'Failed to delete category',
        type: 'error'
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Manage Categories" maxWidth="max-w-xl">
        <div className="flex flex-col gap-6">
          {/* Create or Edit Form */}
          <form
            onSubmit={handleSaveCategory}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800"
          >
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              {editingId ? 'Edit Category' : 'Create New Category'}
            </h4>

            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs mb-3">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                {/* Emoji Selector */}
                <div className="relative">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Icon</label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {PRESET_EMOJIS.map((em) => (
                      <option key={em} value={em}>
                        {em}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name Input */}
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Category Name</label>
                  <input
                    type="text"
                    maxLength={40}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g., Tech Reviews, Fitness"
                    className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Color Accent</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
                        color === c ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    >
                      {color === c && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{loading ? 'Saving...' : editingId ? 'Update Category' : 'Add Category'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Category List */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Existing Categories ({categories.length})
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-64 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className="py-2.5 flex items-center justify-between gap-3 group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-sm"
                      style={{ backgroundColor: `${cat.color || '#6366F1'}25` }}
                    >
                      {cat.icon || '📌'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {cat.name}
                        </span>
                        {cat.isDefault && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {cat.count ?? 0} {cat.count === 1 ? 'reel' : 'reels'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {cat.name.toLowerCase() !== 'other' && (
                      <button
                        type="button"
                        onClick={() => promptDelete(cat)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title={`Delete "${categoryToDelete?.name}"?`}
        message={
          categoryToDelete?.count > 0
            ? `This category has ${categoryToDelete.count} reel(s). If you delete it, all its reels will be safely moved to the "Other" category.`
            : `Are you sure you want to delete this category?`
        }
        confirmText="Delete Category"
      />
    </>
  );
};

export default CategoryModal;
