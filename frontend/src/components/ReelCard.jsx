import React, { useState } from 'react';
import {
  ExternalLink,
  Star,
  Edit3,
  Trash2,
  Calendar,
  Tag,
  Instagram,
  Youtube,
  Video,
  Facebook,
  Twitter,
  Globe,
  Film
} from 'lucide-react';
import { PLATFORM_INFO } from '../utils/detectPlatform';

const PlatformIcon = ({ platform, className = 'w-3.5 h-3.5' }) => {
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

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

export const ReelCard = ({
  reel,
  onEdit,
  onDelete,
  onToggleFavorite,
  onTagClick
}) => {
  const [imageError, setImageError] = useState(false);
  const platform = reel.platform || 'other';
  const platformMeta = PLATFORM_INFO[platform] || PLATFORM_INFO.other;

  const displayTitle =
    reel.title || `${platformMeta.name} Reel #${reel._id.slice(-4)}`;

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden">
      <div>
        {/* Media / Thumbnail Section */}
        <div className="relative w-full h-44 overflow-hidden bg-slate-900">
          {reel.thumbnail && !imageError ? (
            <img
              src={reel.thumbnail}
              alt={displayTitle}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            /* Platform colored gradient placeholder */
            <div
              className={`w-full h-full flex flex-col items-center justify-center p-6 text-white ${platformMeta.bgColor}`}
            >
              <PlatformIcon platform={platform} className="w-12 h-12 mb-2 drop-shadow-md opacity-90" />
              <span className="text-xs font-semibold tracking-wider uppercase opacity-80">
                {platformMeta.name}
              </span>
            </div>
          )}

          {/* Dark gradient overlay for badge readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

          {/* Floating Platform Badge (Top Left) */}
          <div className="absolute top-3 left-3">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-slate-700/50"
              style={{ color: platformMeta.color }}
            >
              <PlatformIcon platform={platform} className="w-3.5 h-3.5" />
              <span>{platformMeta.name}</span>
            </span>
          </div>

          {/* Floating Favorite Star (Top Right) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(reel._id);
            }}
            className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 shadow-sm transition-all hover:scale-110 active:scale-95"
            aria-label={reel.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star
              className={`w-4 h-4 transition-colors ${
                reel.isFavorite
                  ? 'text-amber-500 fill-amber-500'
                  : 'hover:text-amber-500'
              }`}
            />
          </button>

          {/* Bottom Bar on Thumbnail: Category Tag */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
            {reel.category && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium backdrop-blur-md shadow-sm border border-white/10"
                style={{
                  backgroundColor: `${reel.category.color || '#6366F1'}cc`,
                  color: '#ffffff'
                }}
              >
                <span>{reel.category.icon || '📌'}</span>
                <span>{reel.category.name}</span>
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-white/80 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
              <Calendar className="w-3 h-3" />
              {formatDate(reel.createdAt)}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5">
          {/* Title */}
          <h4
            className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base line-clamp-2 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
            title={displayTitle}
          >
            {displayTitle}
          </h4>

          {/* Note */}
          {reel.note && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-3 italic bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              "{reel.note}"
            </p>
          )}

          {/* Tags */}
          {reel.tags && reel.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 my-2">
              {reel.tags.map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onTagClick && onTagClick(tag)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                >
                  <Tag className="w-2.5 h-2.5" />
                  <span>#{tag}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50/70 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <a
          href={reel.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>Open Reel</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(reel)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            title="Edit reel"
            aria-label="Edit reel"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(reel)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete reel"
            aria-label="Delete reel"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReelCard;
