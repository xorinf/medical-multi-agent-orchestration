/**
 * Centralized API client for MedAssist.
 * Automatically handles JWT Bearer tokens, refresh rotation, and normalized errors.
 */

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let accessToken: string | null = localStorage.getItem('medassist_token');

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('medassist_token', token);
  } else {
    localStorage.removeItem('medassist_token');
  }
};

export const getAccessToken = () => accessToken;

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // for httpOnly refresh cookie 'rt'
  };

  try {
    let response = await fetch(url, config);

    // Handle token expiration & automatic refresh
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.access_token) {
            setAccessToken(refreshData.access_token);
            headers.set('Authorization', `Bearer ${refreshData.access_token}`);
            response = await fetch(url, { ...config, headers });
          }
        } else {
          // Token refresh failed, clear session
          setAccessToken(null);
          localStorage.removeItem('medassist_user');
          if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login?expired=1';
          }
        }
      } catch {
        setAccessToken(null);
      }
    }

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: response.statusText };
      }
      throw new ApiError(errorData.detail || errorData.error || `HTTP ${response.status}`, response.status, errorData);
    }

    // Return empty object on 204 or empty response
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network or connection error
    throw new ApiError(err.message || 'Network connection failure', 0, { networkError: true });
  }
}
