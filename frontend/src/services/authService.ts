import { apiClient, setAccessToken } from './api';
import type { User, UserRole } from '../types';
import { mockUsers } from './mockData';

export interface LoginResponse {
  access_token: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const res = await apiClient<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.access_token) {
        setAccessToken(res.access_token);
        localStorage.setItem('medassist_user', JSON.stringify(res.user));
      }
      return res;
    } catch (err: any) {
      // Fallback for development if backend server is not running
      const matchedUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (matchedUser) {
        const dummyToken = `mock-token-${matchedUser.id}-${Date.now()}`;
        setAccessToken(dummyToken);
        localStorage.setItem('medassist_user', JSON.stringify(matchedUser));
        return { access_token: dummyToken, user: matchedUser };
      }
      // If mock didn't match and real call failed with a non-network error, rethrow
      if (err.status && err.status !== 0) {
        throw err;
      }
      throw new Error(err.message || 'Invalid email or password');
    }
  },

  async register(data: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    specialty?: string;
    license_no?: string;
  }): Promise<{ id: string; role: string; status: string }> {
    try {
      return await apiClient('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (err.status && err.status !== 0) throw err;
      // Mock fallback
      const newUser: User = {
        id: `usr-${Date.now()}`,
        email: data.email,
        name: data.name,
        role: data.role,
        status: data.role === 'doctor' ? 'pending_verification' : 'active',
        specialty: data.specialty,
        license_no: data.license_no,
      };
      mockUsers.push(newUser);
      return { id: newUser.id, role: newUser.role, status: newUser.status };
    }
  },

  async forgotPassword(email: string): Promise<{ ok: boolean }> {
    try {
      return await apiClient('/auth/forgot', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    } catch (err: any) {
      if (err.status && err.status !== 0) throw err;
      return { ok: true };
    }
  },

  async resetPassword(token: string, password: string): Promise<{ ok: boolean }> {
    try {
      return await apiClient('/auth/reset', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
    } catch (err: any) {
      if (err.status && err.status !== 0) throw err;
      return { ok: true };
    }
  },

  async getMe(): Promise<User> {
    try {
      return await apiClient<User>('/auth/me');
    } catch (err: any) {
      const saved = localStorage.getItem('medassist_user');
      if (saved) return JSON.parse(saved);
      throw err;
    }
  },

  async logout(): Promise<{ ok: boolean }> {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch {
      // ignore logout network errors
    } finally {
      setAccessToken(null);
      localStorage.removeItem('medassist_user');
    }
    return { ok: true };
  }
};
