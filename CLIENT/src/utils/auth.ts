// Authentication Utility
// Centralized authentication token management

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthToken {
  token: string;
  expirationTime: number;
  user: AuthUser;
}

// Storage keys - using sessionStorage for better security (session-only)
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const EXPIRATION_KEY = 'auth_expiration';

// Get authentication token from storage
export const getAuthToken = (): string | null => {
  return sessionStorage.getItem(TOKEN_KEY) || sessionStorage.getItem('authToken') || null;
};

// Get user data from storage
export const getAuthUser = (): AuthUser | null => {
  try {
    const userData = sessionStorage.getItem(USER_KEY) || sessionStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Get token expiration time
export const getTokenExpiration = (): number | null => {
  const expiration = sessionStorage.getItem(EXPIRATION_KEY) || sessionStorage.getItem('tokenExpiration');
  return expiration ? parseInt(expiration, 10) : null;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const expiration = getTokenExpiration();
  
  if (!token || !expiration) {
    return false;
  }
  
  // Check if token is expired
  const now = Date.now();
  return now < expiration;
};

// Check if token is about to expire (within 5 minutes)
export const isTokenExpiringSoon = (): boolean => {
  const expiration = getTokenExpiration();
  if (!expiration) return false;
  
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
  return (expiration - now) < fiveMinutes;
};

// Refresh token
export const refreshToken = async (): Promise<boolean> => {
  const token = getAuthToken();
  if (!token) return false;
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.token && data.user) {
        // Store new token
        const expirationTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours
        const authToken: AuthToken = {
          token: data.token,
          expirationTime,
          user: data.user
        };
        storeAuthData(authToken);
        return true;
      }
    }
    
    // Refresh failed, clear auth data
    clearAuthData();
    return false;
  } catch (error) {
    console.error('Token refresh error:', error);
    clearAuthData();
    return false;
  }
};

// Auto-refresh token if needed
export const autoRefreshToken = async (): Promise<boolean> => {
  if (isTokenExpiringSoon()) {
    return await refreshToken();
  }
  return true; // Token is still valid
};

// Store authentication data
export const storeAuthData = (authToken: AuthToken): void => {
  try {
    // Store only in sessionStorage for better security (session-only)
    sessionStorage.setItem(TOKEN_KEY, authToken.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(authToken.user));
    sessionStorage.setItem(EXPIRATION_KEY, authToken.expirationTime.toString());
  } catch (error) {
    console.error('Error storing authentication data:', error);
  }
};

// Clear authentication data
export const clearAuthData = (): void => {
  try {
    // Clear sessionStorage
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(EXPIRATION_KEY);
  } catch (error) {
    console.error('Error clearing authentication data:', error);
  }
};

// Get authorization header for API requests
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Verify token with server
export const verifyToken = async (): Promise<{ success: boolean; user?: AuthUser }> => {
  const token = getAuthToken();
  if (!token) {
    return { success: false };
  }
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const result = await response.json();
    
    if (result.success) {
      return { success: true, user: result.user };
    } else {
      clearAuthData();
      return { success: false };
    }
  } catch (error) {
    console.error('Token verification error:', error);
    clearAuthData();
    return { success: false };
  }
};

// Get user role
export const getUserRole = (): string | null => {
  const user = getAuthUser();
  return user?.role || null;
};