/**
 * Validates whether an input is a valid HTTP or HTTPS URL.
 */
export const isValidUrl = (string) => {
  if (!string || typeof string !== 'string') return false;
  try {
    let toTest = string.trim();
    if (!/^https?:\/\//i.test(toTest)) {
      toTest = `https://${toTest}`;
    }
    const url = new URL(toTest);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Normalizes URL on client side (for pre-checks and display).
 */
export const normalizeClientUrl = (rawUrl) => {
  if (!rawUrl) return '';
  let trimmed = rawUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

    const isInstagramReel = (hostname.includes('instagram.com') || hostname === 'instagr.am') && 
      (parsed.pathname.includes('/reel/') || parsed.pathname.includes('/p/'));
    const isYouTubeShort = (hostname.includes('youtube.com') || hostname === 'youtu.be') && 
      parsed.pathname.includes('/shorts/');
    const isTikTokVideo = hostname.includes('tiktok.com') && 
      (parsed.pathname.includes('/video/') || parsed.pathname.includes('/v/'));
    const isFacebookReel = (hostname.includes('facebook.com') || hostname === 'fb.watch') && 
      (parsed.pathname.includes('/reel/') || parsed.pathname.includes('/reels/'));

    if (isInstagramReel || isYouTubeShort || isTikTokVideo || isFacebookReel) {
      parsed.search = '';
    } else if (hostname.includes('youtube.com') && parsed.pathname === '/watch') {
      const videoId = parsed.searchParams.get('v');
      parsed.search = '';
      if (videoId) {
        parsed.searchParams.set('v', videoId);
      }
    } else {
      const trackingParams = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'igshid',
        'igsh',
        'si',
        'fbclid',
        'ref',
        'ref_src',
        'feature',
        '_r',
        'is_from_webapp',
        'sender_device',
        'share_app_id',
        't',
        's'
      ];
      trackingParams.forEach((param) => parsed.searchParams.delete(param));
    }

    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    }
    let res = parsed.origin + parsed.pathname;
    const search = parsed.searchParams.toString();
    if (search) res += `?${search}`;
    return res;
  } catch {
    return rawUrl.trim();
  }
};

/**
 * Parses comma-separated tags into a clean array of strings.
 */
export const parseTags = (tagsInput) => {
  if (Array.isArray(tagsInput)) {
    return tagsInput.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof tagsInput === 'string') {
    return tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);
  }
  return [];
};
