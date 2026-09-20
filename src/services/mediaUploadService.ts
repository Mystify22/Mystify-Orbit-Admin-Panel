import { createApiClient } from './api';
import type { MediaType, UploadResponse } from '../types/media';

export type ProgressCallback = (percentage: number) => void;

// Direct environment configuration (or edit endpoints directly here)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const FILE_FIELD_NAME = import.meta.env.VITE_FILE_FIELD_NAME || 'file';
const AUTH_TOKEN = import.meta.env.VITE_AUTH_TOKEN || '';

const ENDPOINTS: Record<MediaType, string> = {
  avatar: import.meta.env.VITE_AVATAR_ENDPOINT || '/media/upload/avatar',
  cover: import.meta.env.VITE_COVER_ENDPOINT || '/media/upload/cover',
  theme: import.meta.env.VITE_THEME_ENDPOINT || '/media/upload/theme',
  audio: import.meta.env.VITE_AUDIO_ENDPOINT || '/media/upload/audio',
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
  const endpoint = ENDPOINTS[category];
  const client = createApiClient(API_BASE_URL, AUTH_TOKEN);

  try {
    // Specialized handler for Avatar API: POST /v1/admin/save-avatar?category=xxx (MultipartFile 'file')
    if (category === 'avatar') {
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

      return {
        success: true,
        url: responseData?.avatarUrl || responseData?.url || URL.createObjectURL(file),
        mediaId: responseData?.id ? String(responseData.id) : `avatar_${Date.now()}`,
        mimeType: file.type,
        size: file.size,
        message: response.data?.message || 'Avatar saved successfully to database!',
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
