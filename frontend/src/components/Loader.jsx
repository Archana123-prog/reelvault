import React from 'react';
import { Loader2, Server } from 'lucide-react';

export const Loader = ({ text = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500 dark:text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400 mb-3" />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
};

export const ReelSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm animate-pulse flex flex-col justify-between h-[360px]">
      <div>
        {/* Thumbnail skeleton */}
        <div className="w-full h-44 bg-slate-200 dark:bg-slate-800 rounded-xl mb-4" />
        {/* Badges skeleton */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-16 h-6 bg-slate-200 dark:bg-slate-800 rounded-full" />
          <div className="w-20 h-6 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
        {/* Title skeleton */}
        <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-800 rounded-md mb-2" />
        <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
        <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const ServerWakingBanner = () => {
  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-amber-700 dark:text-amber-300 text-xs sm:text-sm font-medium flex items-center justify-center gap-2.5 text-center animate-fade-in">
      <Server className="w-4 h-4 animate-bounce text-amber-600 dark:text-amber-400 shrink-0" />
      <span>
        <strong>Waking up server:</strong> Free-tier host is spinning up from idle sleep. This may take 20–30 seconds...
      </span>
      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
    </div>
  );
};

export default Loader;
