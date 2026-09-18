import { apiClient } from './api';
import type { Doctor, Appointment, AppointmentStatus } from '../types';
import { mockDoctors, mockAppointments } from './mockData';

export const doctorService = {
  async listDoctors(params?: { specialty?: string; city?: string; q?: string }): Promise<Doctor[]> {
    const query = new URLSearchParams();
    if (params?.specialty) query.set('specialty', params.specialty);
    if (params?.city) query.set('city', params.city);
    if (params?.q) query.set('q', params.q);

    const queryString = query.toString() ? `?${query.toString()}` : '';

    try {
      return await apiClient<Doctor[]>(`/doctors${queryString}`);
    } catch {
      let filtered = [...mockDoctors];
      if (params?.specialty && params.specialty !== 'all') {
        filtered = filtered.filter(d => d.specialty.toLowerCase().includes(params.specialty!.toLowerCase()));
      }
      if (params?.city) {
        filtered = filtered.filter(d => d.city.toLowerCase().includes(params.city!.toLowerCase()));
      }
      if (params?.q) {
        const ql = params.q.toLowerCase();
        filtered = filtered.filter(d => d.name.toLowerCase().includes(ql) || d.bio.toLowerCase().includes(ql) || d.specialty.toLowerCase().includes(ql));
      }
      return filtered;
    }
  },

  async getDoctor(id: string): Promise<Doctor> {
    try {
      return await apiClient<Doctor>(`/doctors/${id}`);
    } catch {
      const doc = mockDoctors.find(d => d.id === id);
      if (doc) return doc;
      throw new Error('Doctor not found');
    }
  },

  async matchDoctors(symptoms_text: string, city: string = '', limit: number = 5): Promise<{
    specialty: string;
    urgency: string;
    red_flags: string[];
    doctors: Doctor[];
  }> {
    try {
      return await apiClient('/doctors/match', {
        method: 'POST',
        body: JSON.stringify({ symptoms_text, city, limit }),
      });
    } catch {
      // Mock match fallback based on keywords
      const text = symptoms_text.toLowerCase();
      let matchedSpecialty = 'General Internal Medicine';
      if (text.includes('head') || text.includes('dizzy') || text.includes('migraine') || text.includes('brain')) {
        matchedSpecialty = 'Neurology';
      } else if (text.includes('chest') || text.includes('breath') || text.includes('cough') || text.includes('lung')) {
        matchedSpecialty = 'Pulmonology & Critical Care';
      } else if (text.includes('skin') || text.includes('mole') || text.includes('rash') || text.includes('lesion')) {
        matchedSpecialty = 'Dermatology';
      } else if (text.includes('heart') || text.includes('palpitation') || text.includes('pressure')) {
        matchedSpecialty = 'Cardiology';
      }

      const relevantDocs = mockDoctors.filter(d => d.specialty === matchedSpecialty);
      const fallbackDocs = relevantDocs.length > 0 ? relevantDocs : mockDoctors.slice(0, limit);

      return {
        specialty: matchedSpecialty,
        urgency: text.includes('severe') || text.includes('acute') ? 'Moderate' : 'Routine',
        red_flags: text.includes('chest pain') ? ['Acute chest tightness reported'] : [],
        doctors: fallbackDocs.map(d => ({
          ...d,
          score: 9.4,
          reasons: [`Clinical focus matches reported symptom profile (${matchedSpecialty})`]
        }))
      };
    }
  },

  async createAppointment(data: {
    doctor_id: string;
    scheduled_at: string;
    duration_min?: number;
    notes?: string;
  }): Promise<{ id: string; status: string }> {
    try {
      return await apiClient('/appointments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const doc = mockDoctors.find(d => d.id === data.doctor_id);
      const newApt: Appointment = {
        id: `apt-${Date.now()}`,
        patient_id: 'pat-001',
        doctor_id: data.doctor_id,
        doctor_name: doc?.name || 'Dr. Clara Vance, MD',
        patient_name: 'Elena Rostova',
        specialty: doc?.specialty || 'Neurology',
        scheduled_at: data.scheduled_at,
        duration_min: data.duration_min || 30,
        notes_from_patient: data.notes || '',
        status: 'pending',
      };
      mockAppointments.unshift(newApt);
      return { id: newApt.id, status: newApt.status };
    }
  },

  async listAppointments(params?: { role?: 'patient' | 'doctor'; status?: string } | 'patient' | 'doctor'): Promise<Appointment[]> {
    const role = typeof params === 'string' ? params : params?.role;
    const status = typeof params === 'object' ? params?.status : undefined;
    const query = new URLSearchParams();
    if (role) query.set('role', role);
    if (status) query.set('status', status);

    const qs = query.toString() ? `?${query.toString()}` : '';

    try {
      return await apiClient<Appointment[]>(`/appointments${qs}`);
    } catch {
      let list = [...mockAppointments];
      if (status) {
        list = list.filter(a => a.status === status);
      }
      return list;
    }
  },

  async updateAppointment(id: string, patch: { status?: AppointmentStatus; notes_from_doctor?: string }): Promise<{ ok: boolean }> {
    try {
      return await apiClient(`/appointments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
    } catch {
      const found = mockAppointments.find(a => a.id === id);
      if (found) {
        if (patch.status) found.status = patch.status;
        if (patch.notes_from_doctor) found.notes_from_doctor = patch.notes_from_doctor;
      }
      return { ok: true };
    }
  }
};
