import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Star, Check, AlertCircle } from 'lucide-react';
import { parseTags } from '../utils/validators';

export const EditReelModal = ({
  isOpen,
  onClose,
  reel,
  categories = [],
  onSave
}) => {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (reel) {
      setTitle(reel.title || '');
      setCategoryId(reel.category?._id || reel.category || '');
      setNote(reel.note || '');
      setTagsInput(reel.tags ? reel.tags.join(', ') : '');
      setIsFavorite(Boolean(reel.isFavorite));
      setError('');
    }
  }, [reel]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId) {
      setError('Please select a category.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave(reel._id, {
        title: title.trim(),
        categoryId,
        note: note.trim(),
        tags: parseTags(tagsInput),
        isFavorite
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update reel');
    } finally {
      setLoading(false);
    }
  };

  if (!reel) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Reel Details" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* URL Display (Read only) */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Reel URL</label>
          <input
            type="text"
            readOnly
            value={reel.url}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-500 select-all cursor-not-allowed"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Title
          </label>
          <input
            type="text"
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Custom title"
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Category Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Category
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {categories.map((cat) => {
              const isSelected = categoryId === cat._id;
              return (
                <button
                  type="button"
                  key={cat._id}
                  onClick={() => setCategoryId(cat._id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span>{cat.icon || '📌'}</span>
                  <span>{cat.name}</span>
                  {isSelected && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Personal Note (max 500 chars)
          </label>
          <textarea
            rows={3}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What was memorable about this video?"
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Tags (Comma-separated)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. funny, viral, inspiration"
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Favorite */}
        <div className="pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300 dark:border-slate-700"
            />
            <Star className={`w-4 h-4 ${isFavorite ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
            <span>Mark as favorite</span>
          </label>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditReelModal;
