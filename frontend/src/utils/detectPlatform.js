/**
 * Client-side platform detection for instant visual feedback as the user types/pastes a URL.
 */
export const detectPlatform = (url) => {
  if (!url || typeof url !== 'string') return 'other';

  try {
    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const parsed = new URL(cleanUrl);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

    if (hostname.includes('instagram.com') || hostname === 'instagr.am') {
      return 'instagram';
    }

    if (hostname.includes('youtube.com') || hostname === 'youtu.be') {
      return 'youtube';
    }

    if (hostname.includes('tiktok.com') || hostname === 'vm.tiktok.com') {
      return 'tiktok';
    }

    if (
      hostname.includes('facebook.com') ||
      hostname === 'fb.watch' ||
      hostname.includes('fb.com')
    ) {
      return 'facebook';
    }

    if (
      hostname.includes('twitter.com') ||
      hostname === 'x.com' ||
      hostname.includes('t.co')
    ) {
      return 'twitter';
    }

    return 'other';
  } catch {
    return 'other';
  }
};

/**
 * Platform display metadata (names, brand colors, gradients, and badges).
 */
export const PLATFORM_INFO = {
  instagram: {
    name: 'Instagram',
    color: '#E1306C',
    bgColor: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40',
    textColor: 'text-rose-600 dark:text-rose-400',
    icon: 'Instagram'
  },
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    bgColor: 'bg-gradient-to-tr from-red-600 to-red-500',
    badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40',
    textColor: 'text-red-600 dark:text-red-400',
    icon: 'Youtube'
  },
  tiktok: {
    name: 'TikTok',
    color: '#00F2FE',
    bgColor: 'bg-gradient-to-tr from-slate-900 via-teal-900 to-slate-950',
    badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/40',
    textColor: 'text-teal-600 dark:text-teal-400',
    icon: 'Video'
  },
  facebook: {
    name: 'Facebook',
    color: '#1877F2',
    bgColor: 'bg-gradient-to-tr from-blue-700 to-blue-500',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40',
    textColor: 'text-blue-600 dark:text-blue-400',
    icon: 'Facebook'
  },
  twitter: {
    name: 'X (Twitter)',
    color: '#000000',
    bgColor: 'bg-gradient-to-tr from-slate-900 to-zinc-800',
    badgeClass: 'bg-slate-500/10 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
    textColor: 'text-slate-900 dark:text-slate-100',
    icon: 'Twitter'
  },
  other: {
    name: 'Web Video',
    color: '#6366F1',
    bgColor: 'bg-gradient-to-tr from-indigo-600 to-purple-600',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    icon: 'Globe'
  }
};
