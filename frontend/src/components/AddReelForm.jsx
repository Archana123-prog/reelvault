import React, { useState, useEffect } from 'react';
import {
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Star,
  Check,
  AlertCircle,
  Instagram,
  Youtube,
  Video,
  Facebook,
  Twitter,
  Globe
} from 'lucide-react';
import { detectPlatform, PLATFORM_INFO } from '../utils/detectPlatform';
import { isValidUrl, parseTags } from '../utils/validators';

const PlatformIcon = ({ platform, className = 'w-4 h-4' }) => {
  switch (platform) {
    case 'instagram':
      return <Instagram className={className} />;
    case 'youtube':
      return <Youtube className={className} />;
    case 'tiktok':
      return <Video className={className} />;
    case 'facebook':
      return <Facebook className={className} />;
    case 'twitter':
      return <Twitter className={className} />;
    default:
      return <Globe className={className} />;
  }
};

export const AddReelForm = ({
  categories = [],
  onReelAdded,
  initialUrl = '',
  initialCategory = '',
  onClose
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [categoryId, setCategoryId] = useState(initialCategory || '');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Default to first category if none selected
  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      const defaultCat = categories.find((c) => c.name.toLowerCase() === 'other') || categories[0];
      setCategoryId(defaultCat._id);
    }
  }, [categories, categoryId]);

  // Detected platform
  const detectedPlatform = detectPlatform(url);
  const platformMeta = PLATFORM_INFO[detectedPlatform];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter or paste a reel link.');
      return;
    }

    if (!isValidUrl(url)) {
      setError('Please provide a valid HTTP or HTTPS video URL.');
      return;
    }

    if (!categoryId) {
      setError('Please select a category for this reel.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        url: url.trim(),
        categoryId,
        title: title.trim() || undefined,
        note: note.trim() || undefined,
        tags: parseTags(tagsInput),
        isFavorite
      };

      await onReelAdded(payload);

      // Reset form
      setUrl('');
      setTitle('');
      setNote('');
      setTagsInput('');
      setIsFavorite(false);
      setIsDetailsOpen(false);

      if (onClose) {
        onClose();
      }
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.message;
      setError(serverMessage || 'Failed to save reel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm mb-8 transition-all"
    >
      <div className="flex flex-col gap-4">
        {/* URL Input Bar with instant platform badge */}
        <div>
          <label htmlFor="reel-url" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
            Quick Save Reel
          </label>
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <LinkIcon className="w-5 h-5" />
            </div>
            <input
              id="reel-url"
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError('');
              }}
              placeholder="Paste Instagram Reel, YouTube Short, TikTok, or video link..."
              className="w-full pl-11 pr-28 py-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
              required
            />
            {/* Live Detected Platform Badge */}
            {url.trim().length > 3 && (
              <div className="absolute right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border backdrop-blur-md shadow-sm transition-all animate-fade-in" style={{ borderColor: platformMeta.color + '40', color: platformMeta.color }}>
                <PlatformIcon platform={detectedPlatform} className="w-3.5 h-3.5" />
                <span>{platformMeta.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Category Picker Chips */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
            Select Category
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
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
                      : 'bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{cat.icon || '📌'}</span>
                  <span>{cat.name}</span>
                  {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible Details (Title, Notes, Tags, Favorite) */}
        <div>
          <button
            type="button"
            onClick={() => setIsDetailsOpen((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors py-1"
          >
            {isDetailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{isDetailsOpen ? 'Hide extra details' : '+ Add custom title, notes, or tags (optional)'}</span>
          </button>

          {isDetailsOpen && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-3 animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Custom Title (Optional - auto-scraped if blank)
                </label>
                <input
                  type="text"
                  maxLength={150}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Amazing Pasta Carbonara Recipe"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Personal Note (Optional, max 500 chars)
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Key takeaways, timestamp notes, ideas..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="cooking, dinner, easy"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={isFavorite}
                      onChange={(e) => setIsFavorite(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300 dark:border-slate-700"
                    />
                    <Star className={`w-3.5 h-3.5 ${isFavorite ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                    <span>Mark as Favorite</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs sm:text-sm animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Saving Reel...' : 'Save to Vault'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddReelForm;
