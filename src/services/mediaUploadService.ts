import { createApiClient } from './api';
import type { MediaType, UploadResponse } from '../types/media';

export type ProgressCallback = (percentage: number) => void;

// ---------------------------------------------------------------------------
// API config — base URL from env, endpoints defined here as part of the
// API contract (they don't change between dev/staging/prod)
// ---------------------------------------------------------------------------
const USER_BASE_URL     = (import.meta.env.VITE_USER_MS_URL     as string | undefined)?.trim() ?? '';
const QUESTION_BASE_URL = (import.meta.env.VITE_QUESTION_MS_URL as string | undefined)?.trim() ?? '';

// Audio lives on the Question MS — separate from the User MS endpoints below
const AUDIO_ENDPOINT = '/v1/admin/save-audio';

const USER_ENDPOINTS: Record<Exclude<MediaType, 'audio'>, string> = {
  avatar: '/v1/admin/save-avatar',
  cover:  '/v1/admin/save-cover',
  theme:  '/media/upload/theme',
} as const;

// 'file' is the multipart field name expected by all APIs
const FILE_FIELD_NAME = 'file';

/**
 * Build an absolute URL for the User MS.
 * Falls back to a relative path when no base URL is set (Vite proxy handles it).
 */
const buildUserUrl = (endpoint: string): string => {
  if (USER_BASE_URL) {
    return `${USER_BASE_URL.replace(/\/+$/, '')}${endpoint}`;
  }
  return endpoint;
};

/**
 * Build an absolute URL for the Question MS (audio endpoint).
 * Falls back to a relative path when no base URL is set (Vite proxy handles it).
 */
const buildQuestionUrl = (endpoint: string): string => {
  if (QUESTION_BASE_URL) {
    return `${QUESTION_BASE_URL.replace(/\/+$/, '')}${endpoint}`;
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
  category: Exclude<MediaType, 'audio'>,
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


    return {
      success: true,
      url: response.data?.url || response.data?.data?.url || URL.createObjectURL(file),
      mediaId: response.data?.id || response.data?.mediaId || `med_${Date.now()}`,
      mimeType: file.type,
      size: file.size,
      message: response.data?.message || `${category.toUpperCase()} uploaded successfully!`,
    };
  } catch (error: unknown) {
    const err = error as Error;
    throw new Error(err.message || `Failed to upload ${category} file.`);
  }
};

/**
 * Upload an Audio File to POST /v1/admin/save-audio
 *
 * Multipart contract (mirrors the curl):
 *   -F 'file=@track.mp3;type=audio/mpeg'
 *   -F 'data={"title":"Harry","categoryId":2}'
 */
export const uploadAudioFile = async (
  file: File,
  title: string,
  categoryId: number,
  onProgress: ProgressCallback
): Promise<UploadResponse> => {
  const endpoint = buildQuestionUrl(AUDIO_ENDPOINT);
  const client = createApiClient('');

  const formData = new FormData();
  formData.append(FILE_FIELD_NAME, file);
  // Spring Boot @RequestPart requires the JSON part to declare its own
  // Content-Type: application/json — wrap it in a Blob to achieve this.
  const dataBlob = new Blob(
    [JSON.stringify({ title: title.trim(), categoryId })],
    { type: 'application/json' }
  );
  formData.append('data', dataBlob);

  try {
    const response = await client.post(endpoint, formData, {
      // Do NOT set Content-Type manually — the browser must set it automatically
      // with the correct multipart boundary (omitting it causes HTTP 415)
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.min(
            100,
            Math.round((progressEvent.loaded * 100) / progressEvent.total)
          );
          onProgress(percent);
        }
      },
    });

    const responseData = response.data?.data || response.data;

    return {
      success: true,
      url: responseData?.audioUrl || responseData?.url || URL.createObjectURL(file),
      mediaId: responseData?.id ? String(responseData.id) : `audio_${Date.now()}`,
      mimeType: file.type,
      size: file.size,
      message: response.data?.message || 'Audio saved successfully!',
    };
  } catch (error: unknown) {
    const err = error as Error;
    throw new Error(err.message || 'Failed to upload audio file.');
  }
};
