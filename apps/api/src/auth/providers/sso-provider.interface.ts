export interface SsoUserProfile {
  email: string;
  name: string;
}

export interface SsoProvider {
  verifyIdToken(idToken: string): Promise<SsoUserProfile>;
}
