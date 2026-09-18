import { apiClient } from './api';
import type { CaseItem } from '../types';
import { mockCases } from './mockData';

export const caseService = {
  async getQueue(status?: string): Promise<CaseItem[]> {
    const qs = status ? `?status=${status}` : '';
    try {
      return await apiClient<CaseItem[]>(`/cases${qs}`);
    } catch {
      return mockCases;
    }
  },

  async getUnassigned(): Promise<CaseItem[]> {
    try {
      return await apiClient<CaseItem[]>('/cases/unassigned');
    } catch {
      return mockCases.filter(c => c.status === 'open' || c.status === 'awaiting_doctor');
    }
  },

  async claimCase(id: string): Promise<{ ok: boolean }> {
    try {
      return await apiClient(`/cases/${id}/claim`, { method: 'POST' });
    } catch {
      const c = mockCases.find(item => item.id === id);
      if (c) c.status = 'awaiting_doctor';
      return { ok: true };
    }
  },

  async getCaseDetail(id: string): Promise<CaseItem> {
    try {
      return await apiClient<CaseItem>(`/cases/${id}`);
    } catch {
      const c = mockCases.find(item => item.id === id);
      if (c) return c;
      return mockCases[0];
    }
  },

  async addNote(id: string, note: string): Promise<{ ok: boolean }> {
    try {
      return await apiClient(`/cases/${id}/note`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      });
    } catch {
      const c = mockCases.find(item => item.id === id);
      if (c) {
        c.messages = c.messages || [];
        c.messages.push({
          role: 'doctor',
          content: note,
          ts: new Date().toISOString(),
        });
      }
      return { ok: true };
    }
  },

  async closeCase(id: string): Promise<{ ok: boolean }> {
    try {
      return await apiClient(`/cases/${id}/close`, { method: 'POST' });
    } catch {
      const c = mockCases.find(item => item.id === id);
      if (c) c.status = 'closed';
      return { ok: true };
    }
  }
};
