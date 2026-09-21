import { createApiClient } from './api';
import type { MediaType, UploadResponse } from '../types/media';

export type ProgressCallback = (percentage: number) => void;

// ---------------------------------------------------------------------------
// API config — base URL from env, endpoints defined here as part of the
// API contract (they don't change between dev/staging/prod)
// ---------------------------------------------------------------------------
const USER_BASE_URL = (import.meta.env.VITE_USER_MS_URL as string | undefined)?.trim() ?? '';

const USER_ENDPOINTS: Record<MediaType, string> = {
  avatar: '/v1/admin/save-avatar',
  cover:  '/v1/admin/save-cover',
  theme:  '/media/upload/theme',
  audio:  '/media/upload/audio',
} as const;

// 'file' is the multipart field name expected by the API — not environment-specific
const FILE_FIELD_NAME = 'file';

/**
 * Build an absolute URL from the user-ms base URL + an endpoint path.
 * Falls back to the path alone when no base URL is set (Vite proxy handles it).
 */
const buildUserUrl = (endpoint: string): string => {
  if (USER_BASE_URL) {
    return `${USER_BASE_URL.replace(/\/+$/, '')}${endpoint}`;
  }
  return endpoint;
};


/**
 * Extract audio duration (in seconds) from an Audio File locally
 */
export const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      resolve(audio.duration || 0);
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => {
      resolve(0);
      URL.revokeObjectURL(url);
    };
    audio.src = url;
  });
};

/**
 * Convert File to Base64 String (Data URL)
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Direct Media Upload Handler
 * Handles JSON payload for Avatar and multipart/form-data for other media types
 */
export const uploadMediaFile = async (
  file: File,
  category: MediaType,
  onProgress: ProgressCallback,
  categoryName?: string
): Promise<UploadResponse> => {
  const endpoint = buildUserUrl(USER_ENDPOINTS[category]);
  const client = createApiClient('');

  try {
    // Specialized handler for Avatar & Cover APIs:
    // POST /v1/admin/save-avatar?category=xxx  (multipart 'file')
    // POST /v1/admin/save-cover?category=xxx   (multipart 'file')
    if (category === 'avatar' || category === 'cover') {
      const queryParam = categoryName ? `?category=${encodeURIComponent(categoryName.trim())}` : '';
      const requestUrl = `${endpoint}${queryParam}`;

      const formData = new FormData();
      formData.append(FILE_FIELD_NAME, file);

      const response = await client.post(
        requestUrl,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.min(
                100,
                Math.round((progressEvent.loaded * 100) / progressEvent.total)
              );
              onProgress(percent);
            }
          },
        }
      );

      const responseData = response.data?.data || response.data;
      const label = category === 'cover' ? 'Cover' : 'Avatar';

      return {
        success: true,
        url: responseData?.coverUrl || responseData?.avatarUrl || responseData?.url || URL.createObjectURL(file),
        mediaId: responseData?.id ? String(responseData.id) : `${category}_${Date.now()}`,
        mimeType: file.type,
        size: file.size,
        message: response.data?.message || `${label} saved successfully to database!`,
      };
    }

    // Standard Multipart FormData for other media types (Cover, Theme, Audio)
    const formData = new FormData();
    formData.append(FILE_FIELD_NAME, file);
    formData.append('mediaCategory', category);
    if (categoryName && categoryName.trim()) {
      formData.append('category', categoryName.trim());
      formData.append('categoryName', categoryName.trim());
    }
    formData.append('originalFileName', file.name);
    formData.append('mimeType', file.type);

    const response = await client.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.min(100, Math.round((progressEvent.loaded * 100) / progressEvent.total));
          onProgress(percent);
        }
      },
    });

    let duration: number | undefined;
    if (category === 'audio') {
      duration = await getAudioDuration(file);
    }

    return {
      success: true,
      url: response.data?.url || response.data?.data?.url || URL.createObjectURL(file),
      mediaId: response.data?.id || response.data?.mediaId || `med_${Date.now()}`,
      mimeType: file.type,
      size: file.size,
      duration,
      message: response.data?.message || `${category.toUpperCase()} uploaded successfully!`,
    };
  } catch (error: unknown) {
    const err = error as Error;
    throw new Error(err.message || `Failed to upload ${category} file.`);
  }
};
