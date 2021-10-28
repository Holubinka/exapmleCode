export interface LoginStatus {
  accessToken: string;
}

export interface RegistrationStatus {
  success: boolean;
  message: string;
}

export interface JwtPayload {
  email: string;
}
