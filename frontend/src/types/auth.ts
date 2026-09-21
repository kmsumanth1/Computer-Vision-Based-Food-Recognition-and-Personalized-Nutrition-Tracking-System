export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  /** false until the personal information setup has been submitted */
  profile_completed: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  user: AuthUser;
}
