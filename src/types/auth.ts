export interface AdminUser {
  mobile: string;
  loggedInAt?: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  expiresIn?: number;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  user?: AdminUser;
}
