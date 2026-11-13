/**
 * Utility to optimize image delivery from CDN providers (such as Cloudinary).
 * Dynamically injects format auto-negotiation (WebP/AVIF), automatic quality compression,
 * and responsive width resizing to reduce multi-megabyte images down to a few kilobytes.
 */
export const getOptimizedImageUrl = (url: string, width: number = 600): string => {
  if (!url || typeof url !== 'string') return url;

  // Cloudinary dynamic URL transformation
  if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
    if (url.includes('/image/upload/f_auto') || url.includes('/image/upload/q_auto')) {
      return url;
    }
    return url.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width}/`);
  }

  return url;
};
