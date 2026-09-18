import { apiClient } from './api';
import type { CuratorDigest } from '../types';
import { mockCuratorDigest } from './mockData';

export const curatorService = {
  async getToday(): Promise<CuratorDigest> {
    try {
      return await apiClient<CuratorDigest>('/curator/today');
    } catch {
      return mockCuratorDigest;
    }
  },

  async refresh(): Promise<CuratorDigest> {
    try {
      return await apiClient<CuratorDigest>('/curator/refresh', { method: 'POST' });
    } catch {
      return {
        ...mockCuratorDigest,
        cached: false,
      };
    }
  },

  async saveTopic(digestId: string, topicIdx: number): Promise<{ ok: boolean }> {
    try {
      return await apiClient('/curator/save', {
        method: 'POST',
        body: JSON.stringify({ digest_id: digestId, topic_idx: topicIdx }),
      });
    } catch {
      return { ok: true };
    }
  }
};
