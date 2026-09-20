import axios from 'axios';
import type { AdminUser, SendOtpResponse, VerifyOtpResponse } from '../types/auth';

const OTP_STORAGE_KEY = 'mystify_active_otp_session';

interface StoredOtpSession {
  mobile: string;
  expiresAt: number;
}

// ---------------------------------------------------------------------------
// API config — base URL from env, endpoints defined here as part of the
// API contract (they don't change between dev/staging/prod)
// ---------------------------------------------------------------------------
const AUTH_BASE_URL = (import.meta.env.VITE_AUTH_MS_URL as string | undefined)?.trim() ?? '';

const AUTH_ENDPOINTS = {
  sendOtp: '/v1/auth/send-otp',
  verifyOtp: '/v1/auth/verify-otp',
} as const;

/**
 * Build an absolute URL from the auth base URL + an endpoint path.
 * In development without a base URL the path is used as-is (Vite proxy handles it).
 */
const buildUrl = (endpoint: string): string => {
  if (AUTH_BASE_URL) {
    return `${AUTH_BASE_URL.replace(/\/+$/, '')}${endpoint}`;
  }
  return endpoint;
};

/**
 * Authentication Service for Admin Mobile OTP Flow
 */
export const authService = {
  /**
   * Request OTP for a given mobile number using POST /v1/auth/send-otp
   */
  async sendOtp(mobile: string): Promise<SendOtpResponse> {
    const cleanDigits = mobile.replace(/\D/g, '');

    if (!cleanDigits || cleanDigits.length < 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    const formattedPhoneNumber = `+91${cleanDigits.slice(-10)}`;
    const targetUrl = buildUrl(AUTH_ENDPOINTS.sendOtp);

    try {
      const response = await axios.post(
        targetUrl,
        {
          phoneNumber: formattedPhoneNumber,
        },
        {
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const resData = response.data;
      const success = resData.success !== false && (response.status >= 200 && response.status < 300);
      const message = resData.message || resData.data?.message || 'OTP sent successfully';

      if (!success) {
        throw new Error(message || 'Failed to send OTP. Please try again.');
      }

      // Store session metadata
      const session: StoredOtpSession = {
        mobile: cleanDigits.slice(-10),
        expiresAt: Date.now() + 5 * 60 * 1000,
      };

      try {
        sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(session));
      } catch {
        // ignore storage failures
      }

      return {
        success: true,
        message,
        expiresIn: 300,
      };
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMsg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Failed to send OTP. Please check your connection.';
        throw new Error(errorMsg);
      }
      throw err;
    }
  },

  /**
   * Verify the entered OTP using POST /v1/auth/verify-otp
   */
  async verifyOtp(mobile: string, otp: string): Promise<VerifyOtpResponse> {
    const cleanDigits = mobile.replace(/\D/g, '');
    const cleanOtp = otp.trim();

    if (!cleanDigits || cleanDigits.length < 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    if (!cleanOtp || cleanOtp.length !== 6) {
      throw new Error('Please enter a valid 6-digit OTP.');
    }

    const formattedPhoneNumber = `+91${cleanDigits.slice(-10)}`;
    const targetUrl = buildUrl(AUTH_ENDPOINTS.verifyOtp);

    try {
      const response = await axios.post(
        targetUrl,
        {
          phoneNumber: formattedPhoneNumber,
          otp: cleanOtp,
        },
        {
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const resData = response.data;
      const success = resData.success !== false && (response.status >= 200 && response.status < 300);
      const message = resData.message || 'OTP verified successfully';

      if (!success) {
        throw new Error(message || 'Invalid or expired OTP. Please try again.');
      }

      // Clean up stored OTP session
      sessionStorage.removeItem(OTP_STORAGE_KEY);

      const user: AdminUser = {
        mobile: cleanDigits.slice(-10),
        loggedInAt: new Date().toISOString(),
      };

      return {
        success: true,
        message,
        user,
      };
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMsg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Invalid OTP. Please check the code and try again.';
        throw new Error(errorMsg);
      }
      throw err;
    }
  },
};
