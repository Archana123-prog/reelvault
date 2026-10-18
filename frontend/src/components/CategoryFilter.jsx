import React from 'react';
import { Layers, Plus, Settings2 } from 'lucide-react';

export const CategoryFilter = ({
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
  onManageCategories,
  totalReels = 0
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none py-1">
      {/* "All" Category Chip */}
      <button
        onClick={() => onSelectCategory('all')}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 border ${
          selectedCategory === 'all'
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80'
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        <span>All Reels</span>
        <span
          className={`px-1.5 py-0.5 rounded-md text-[11px] font-semibold ${
            selectedCategory === 'all'
              ? 'bg-indigo-700 text-indigo-100'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          {totalReels}
        </span>
      </button>

      {/* Individual Category Chips */}
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat._id;
        return (
          <button
            key={cat._id}
            onClick={() => onSelectCategory(cat._id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 border ${
              isSelected
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80'
            }`}
          >
            <span className="text-sm">{cat.icon || '📌'}</span>
            <span>{cat.name}</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[11px] font-semibold ${
                isSelected
                  ? 'bg-indigo-700 text-indigo-100'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {cat.count ?? 0}
            </span>
          </button>
        );
      })}

      {/* Manage / Add Custom Category Button */}
      <button
        onClick={onManageCategories}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/60 transition-colors shrink-0"
        title="Manage Categories"
      >
        <Settings2 className="w-3.5 h-3.5" />
        <span>Categories</span>
      </button>
    </div>
  );
};

export default CategoryFilter;
