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

// Storage keys - using localStorage for persistence across browser sessions
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const EXPIRATION_KEY = 'auth_expiration';

// Get authentication token from storage
export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem('authToken') || null;
};

// Get user data from storage
export const getAuthUser = (): AuthUser | null => {
  try {
    const userData = localStorage.getItem(USER_KEY) || sessionStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Get token expiration time
export const getTokenExpiration = (): number | null => {
  const expiration = localStorage.getItem(EXPIRATION_KEY) || sessionStorage.getItem('tokenExpiration');
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

// Store authentication data
export const storeAuthData = (authToken: AuthToken): void => {
  try {
    // Store in localStorage for persistence
    localStorage.setItem(TOKEN_KEY, authToken.token);
    localStorage.setItem(USER_KEY, JSON.stringify(authToken.user));
    localStorage.setItem(EXPIRATION_KEY, authToken.expirationTime.toString());
    
    // Also store in sessionStorage for current session
    sessionStorage.setItem('authToken', authToken.token);
    sessionStorage.setItem('userData', JSON.stringify(authToken.user));
    sessionStorage.setItem('tokenExpiration', authToken.expirationTime.toString());
  } catch (error) {
    console.error('Error storing authentication data:', error);
  }
};

// Clear authentication data
export const clearAuthData = (): void => {
  try {
    // Clear localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRATION_KEY);
    
    // Clear sessionStorage
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('tokenExpiration');
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