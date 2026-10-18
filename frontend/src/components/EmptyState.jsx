import React from 'react';
import { Film, Search, Star, BookmarkPlus } from 'lucide-react';

export const EmptyState = ({ type = 'no-reels', onAction, actionText = 'Save Your First Reel' }) => {
  const configs = {
    'no-reels': {
      icon: Film,
      title: 'Your ReelVault is empty',
      description: 'Start organizing your favorite reels, shorts, and TikToks by pasting your first link above!',
      showAction: true
    },
    'no-results': {
      icon: Search,
      title: 'No matching reels found',
      description: 'Try adjusting your search terms or clearing your filters to see more reels.',
      showAction: false
    },
    'no-favorites': {
      icon: Star,
      title: 'No favorites yet',
      description: 'Click the star icon on any reel to save it here for quick access.',
      showAction: false
    },
    'no-category': {
      icon: BookmarkPlus,
      title: 'No reels in this category',
      description: 'Save a reel and assign it to this category, or choose a different category.',
      showAction: true
    }
  };

  const config = configs[type] || configs['no-reels'];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white/50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 my-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
        {config.title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        {config.description}
      </p>

      {config.showAction && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <BookmarkPlus className="w-4 h-4" />
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
