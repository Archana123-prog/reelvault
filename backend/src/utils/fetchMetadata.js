import axios from 'axios';
import * as cheerio from 'cheerio';
import dns from 'node:dns/promises';
import net from 'node:net';

/**
 * Checks if an IP address is private, loopback, or reserved (SSRF protection).
 */
const isPrivateIp = (ip) => {
  if (!ip) return true;

  // IPv4 check
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    // 0.0.0.0/8
    if (parts[0] === 0) return true;
    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    // 127.0.0.0/8 (loopback)
    if (parts[0] === 127) return true;
    // 169.254.0.0/16 (link local)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 224.0.0.0/4 (multicast) & 240.0.0.0/4 (reserved)
    if (parts[0] >= 224) return true;
    return false;
  }

  // IPv6 check
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::' || lower.startsWith('fe80:') || lower.startsWith('fc00:') || lower.startsWith('fd')) {
      return true;
    }
    return false;
  }

  return true;
};

/**
 * Validates whether a URL is safe to fetch against SSRF.
 */
const validateSafeUrl = async (urlString) => {
  const parsed = new URL(urlString);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS are permitted');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    throw new Error('Internal hostnames are blocked');
  }

  // Check if hostname is direct IP
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error('Private IP addresses are blocked');
    }
    return;
  }

  // Resolve DNS to verify IP
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    for (const record of addresses) {
      if (isPrivateIp(record.address)) {
        throw new Error(`Hostname resolved to private IP: ${record.address}`);
      }
    }
  } catch (err) {
    throw new Error(`DNS validation failed: ${err.message}`);
  }
};

/**
 * Tries fetching metadata using oEmbed for supported platforms.
 */
const fetchOEmbed = async (url, platform) => {
  let oembedUrl = null;

  if (platform === 'youtube') {
    oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  } else if (platform === 'tiktok') {
    oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  }

  if (!oembedUrl) return null;

  try {
    await validateSafeUrl(oembedUrl);
    const response = await axios.get(oembedUrl, {
      timeout: 4000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ReelVault/1.0',
        Accept: 'application/json'
      }
    });

    if (response.data) {
      return {
        title: response.data.title || null,
        thumbnail: response.data.thumbnail_url || null
      };
    }
  } catch {
    // Silently continue to Open Graph fallback
  }

  return null;
};

/**
 * Fetches title and thumbnail via Open Graph / HTML parsing with strict timeout & SSRF protection.
 * Never throws an error; returns null values gracefully.
 */
export const fetchMetadata = async (url, platform = 'other') => {
  try {
    await validateSafeUrl(url);

    // 1. Try oEmbed first if supported
    const oembedResult = await fetchOEmbed(url, platform);
    if (oembedResult && (oembedResult.title || oembedResult.thumbnail)) {
      return {
        title: oembedResult.title ? oembedResult.title.slice(0, 150) : null,
        thumbnail: oembedResult.thumbnail || null
      };
    }

    // 2. Fall back to Open Graph scraping
    const response = await axios.get(url, {
      timeout: 4000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html) ReelVault/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      maxRedirects: 3,
      responseType: 'text'
    });

    const html = response.data;
    if (typeof html !== 'string') {
      return { title: null, thumbnail: null };
    }

    const $ = cheerio.load(html);

    // Extract Title
    let title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      null;

    if (title) {
      title = title.trim().replace(/\s+/g, ' ').slice(0, 150);
    }

    // Extract Thumbnail
    let thumbnail =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('link[rel="image_src"]').attr('href') ||
      null;

    if (thumbnail && !/^https?:\/\//i.test(thumbnail)) {
      try {
        thumbnail = new URL(thumbnail, url).toString();
      } catch {
        thumbnail = null;
      }
    }

    return {
      title: title || null,
      thumbnail: thumbnail || null
    };
  } catch (err) {
    // Never fail the reel save if metadata fetch fails
    return {
      title: null,
      thumbnail: null
    };
  }
};
