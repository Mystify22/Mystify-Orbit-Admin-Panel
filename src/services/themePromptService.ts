import axios from 'axios';
import type {
  ThemePromptFormData,
  ThemePromptBackendResponse,
  BackendSaveThemePromptApiResponse,
} from '../types/themePrompt';

// Base URL from environment (fallback to empty in dev so Vite proxy forwards to question-ms-imao)
const QUESTION_BASE_URL = (import.meta.env.VITE_QUESTION_MS_URL as string | undefined)?.trim() ?? '';
const SAVE_THEME_PROMPT_ENDPOINT = '/v1/admin/save-theme-prompt';

/**
 * Build the absolute or proxied URL for the theme prompt endpoint.
 */
const getSaveThemePromptUrl = (): string => {
  if (QUESTION_BASE_URL) {
    return `${QUESTION_BASE_URL.replace(/\/+$/, '')}${SAVE_THEME_PROMPT_ENDPOINT}`;
  }
  return SAVE_THEME_PROMPT_ENDPOINT;
};

/**
 * Save theme prompt to live backend API:
 * POST https://question-ms-imao.onrender.com/v1/admin/save-theme-prompt
 * Request Body: { name, prompt, category, tag }
 */
export const saveThemePromptApi = async (
  data: ThemePromptFormData
): Promise<ThemePromptBackendResponse> => {
  const targetUrl = getSaveThemePromptUrl();

  try {
    const response = await axios.post<BackendSaveThemePromptApiResponse>(
      targetUrl,
      {
        name: data.name.trim(),
        prompt: data.prompt.trim(),
        category: data.category.trim(),
        tag: data.tag.trim(),
      },
      {
        headers: {
          accept: '*/*',
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const resData = response.data;
    const promptData = resData?.data;

    if (!promptData) {
      throw new Error(resData?.message || 'Server did not return prompt data.');
    }

    return {
      id: promptData.id,
      name: promptData.name,
      prompt: promptData.prompt,
      tagName: promptData.themeTag?.tagName ?? '',
      themeCategoryId: promptData.themeTag?.themeCategory?.id ?? '',
      themeName: promptData.name ?? promptData.themeTag?.themeCategory?.category ?? '',
      savedAt: promptData.createdAt ?? new Date().toISOString(),
      status: resData.status ?? 'OK',
      rawPayload: resData as unknown as Record<string, unknown>,
    };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to save theme prompt. Please check your connection.';
      throw new Error(errorMsg);
    }
    throw err;
  }
};
