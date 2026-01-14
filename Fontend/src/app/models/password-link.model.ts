export type PasswordLinkType = 'invite' | 'reset';
export type PasswordLinkInvalidReason = 'expired' | 'used' | 'invalid';

export interface GeneratePasswordLinkRequest {
  type: PasswordLinkType;
}

export interface GeneratePasswordLinkResponse {
  linkUrl: string;
  expiresAt: string; // ISO
  ttlMinutes: number; // 30
}

export interface ValidatePasswordLinkResponse {
  valid: boolean;
  reason?: PasswordLinkInvalidReason;
  expiresAt?: string; // ISO
}

export interface SetPasswordByTokenRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export type SetPasswordErrorCode =
  | 'PASSWORD_POLICY'
  | 'PASSWORD_SAME_AS_OLD'
  | 'TOKEN_EXPIRED_OR_USED';

export interface SetPasswordByTokenResponse {
  success: boolean;
  code?: SetPasswordErrorCode;
  message?: string;
}

