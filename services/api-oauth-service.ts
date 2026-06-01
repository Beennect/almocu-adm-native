import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { API_URL } from './api-service';

export type OAuthLoginResult = {
  token: string | null;
  cancelled: boolean;
};

export function getGoogleRedirectUri(): string {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/oauth-callback`;
  }
  return Linking.createURL('oauth-callback');
}

export function buildGoogleAuthUrl(redirectUri: string): string {
  return `${API_URL}/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
}

export function extractTokenFromCallbackUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('token');
  } catch {
    return null;
  }
}

export async function startGoogleLogin(): Promise<OAuthLoginResult> {
  const redirectUri = getGoogleRedirectUri();
  if (!redirectUri) {
    return { token: null, cancelled: false };
  }

  const authUrl = buildGoogleAuthUrl(redirectUri);

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') {
      return { token: null, cancelled: false };
    }
    window.location.href = authUrl;
    return { token: null, cancelled: false };
  }

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  if (result.type !== 'success' || !result.url) {
    return { token: null, cancelled: true };
  }

  return {
    token: extractTokenFromCallbackUrl(result.url),
    cancelled: false,
  };
}
