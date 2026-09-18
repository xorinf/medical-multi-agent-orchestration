import { apiClient } from './api';
import type { User, AuditLog, AdminStats } from '../types';
import { mockUsers, mockAuditLogs, mockAdminStats } from './mockData';

export const adminService = {
  async getStats(): Promise<AdminStats> {
    try {
      return await apiClient<AdminStats>('/admin/stats');
    } catch {
      return mockAdminStats;
    }
  },

  async getUsers(params?: { role?: string; status?: string; q?: string }): Promise<User[]> {
    const query = new URLSearchParams();
    if (params?.role) query.set('role', params.role);
    if (params?.status) query.set('status', params.status);
    if (params?.q) query.set('q', params.q);

    const qs = query.toString() ? `?${query.toString()}` : '';
    try {
      return await apiClient<User[]>(`/admin/users${qs}`);
    } catch {
      let filtered = [...mockUsers];
      if (params?.role && params.role !== 'all') {
        filtered = filtered.filter(u => u.role === params.role);
      }
      if (params?.status && params.status !== 'all') {
        filtered = filtered.filter(u => u.status === params.status);
      }
      if (params?.q) {
        const ql = params.q.toLowerCase();
        filtered = filtered.filter(u => u.name.toLowerCase().includes(ql) || u.email.toLowerCase().includes(ql));
      }
      return filtered;
    }
  },

  async getPendingDoctors(): Promise<User[]> {
    try {
      return await apiClient<User[]>('/admin/doctors/pending');
    } catch {
      return mockUsers.filter(u => u.role === 'doctor' && u.status === 'pending_verification');
    }
  },

  async verifyDoctor(id: string, decision: 'approve' | 'reject', reason: string = ''): Promise<{ ok: boolean; status: string }> {
    try {
      return await apiClient(`/admin/doctors/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ decision, reason }),
      });
    } catch {
      const doc = mockUsers.find(u => u.id === id);
      const newStatus = decision === 'approve' ? 'active' : 'suspended';
      if (doc) doc.status = newStatus;
      return { ok: true, status: newStatus };
    }
  },

  async suspendUser(id: string, reason: string = ''): Promise<{ ok: boolean }> {
    try {
      return await apiClient(`/admin/users/${id}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    } catch {
      const u = mockUsers.find(user => user.id === id);
      if (u) u.status = 'suspended';
      return { ok: true };
    }
  },

  async getAuditLogs(params?: { actor?: string; action?: string; from?: string; to?: string; limit?: number }): Promise<AuditLog[]> {
    const query = new URLSearchParams();
    if (params?.actor) query.set('actor', params.actor);
    if (params?.action) query.set('action', params.action);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : '';
    try {
      return await apiClient<AuditLog[]>(`/admin/audit${qs}`);
    } catch {
      let logs = [...mockAuditLogs];
      if (params?.limit) logs = logs.slice(0, params.limit);
      return logs;
    }
  }
};
