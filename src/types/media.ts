export type MediaType = 'avatar' | 'cover' | 'theme' | 'audio';

export type UploadStatus = 'idle' | 'validating' | 'uploading' | 'success' | 'error';

export interface MediaItem {
  id: string;
  name: string;
  category: MediaType;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  duration?: number; // for audio in seconds
  status: UploadStatus;
  progress: number;
  errorMessage?: string;
}

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ApiConfig {
  baseUrl: string;
  avatarEndpoint: string;
  coverEndpoint: string;
  themeEndpoint: string;
  audioEndpoint: string;
  fileFieldName: string; // e.g., 'file' or 'multipartFile'
  authToken: string;
}

export interface UploadResponse {
  success: boolean;
  message?: string;
  url: string;
  mediaId?: string;
  mimeType?: string;
  size?: number;
  duration?: number;
}

export interface CategorySpec {
  title: string;
  description: string;
  acceptedMimeTypes: string[];
  acceptedExtensions: string[];
  maxSizeBytes: number;
  maxSizeLabel: string;
}
