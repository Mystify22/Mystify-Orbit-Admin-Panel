export interface ThemePromptFormData {
  name: string;
  prompt: string;
  category: string;
  tag: string;
}

export interface BackendThemeCategory {
  id: number | string;
  createdAt?: string;
  updatedAt?: string;
  category: string;
}

export interface BackendThemeTag {
  id: number | string;
  createdAt?: string;
  updatedAt?: string;
  tagName: string;
  themeCategory: BackendThemeCategory;
}

export interface BackendThemePromptData {
  id: number | string;
  createdAt?: string;
  updatedAt?: string;
  name: string;
  prompt: string;
  themeTag: BackendThemeTag;
}

export interface BackendSaveThemePromptApiResponse {
  timestamp?: string;
  code?: number;
  status?: string;
  success?: boolean;
  message?: string | null;
  data: BackendThemePromptData;
}

export interface ThemePromptBackendResponse {
  id: string | number; // Prompt ID
  name: string;
  prompt: string;
  tagName: string; // Tag Name
  themeCategoryId: string | number; // theme category id
  themeName: string; // theme name
  savedAt: string;
  status?: string;
  rawPayload?: Record<string, unknown>;
}
