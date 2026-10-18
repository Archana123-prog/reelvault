/**
 * Detects the social platform from a given URL string.
 * Supported platforms: 'instagram', 'youtube', 'tiktok', 'facebook', 'twitter', 'other'
 */
export const detectPlatform = (url) => {
  try {
    const parsed = new URL(url);
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
 * Normalizes a URL by stripping tracking parameters, query junk, and trailing slashes.
 */
export const normalizeUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('A valid URL string is required');
  }

  let trimmed = rawUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  const parsed = new URL(trimmed);

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS URLs are allowed');
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

  // For Reel platforms whose identity is solely in the pathname, strip all query params
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
    // For standard YouTube watch URLs, only preserve the 'v' parameter
    const videoId = parsed.searchParams.get('v');
    parsed.search = '';
    if (videoId) {
      parsed.searchParams.set('v', videoId);
    }
  } else {
    // List of tracking query parameters to remove
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

    trackingParams.forEach((param) => {
      parsed.searchParams.delete(param);
    });
  }

  // Remove trailing slashes from pathname (keep root /)
  if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  }

  let normalized = parsed.origin + parsed.pathname;
  const search = parsed.searchParams.toString();
  if (search) {
    normalized += `?${search}`;
  }
  return normalized;
};
