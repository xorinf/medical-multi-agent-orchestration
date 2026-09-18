export type UserRole = 'patient' | 'doctor' | 'admin';

export type UserStatus = 'active' | 'pending_verification' | 'suspended';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  specialty?: string;
  license_no?: string;
  city?: string;
  bio?: string;
  rating?: number;
  cases_count?: number;
  avatar_url?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  emergency_contact?: {
    name: string;
    phone: string;
    relation: string;
  };
  availability?: string[];
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  duration_min: number;
  notes_from_patient?: string;
  notes_from_doctor?: string;
  status: AppointmentStatus;
  patient_name?: string;
  doctor_name?: string;
  specialty?: string;
  doctor_city?: string;
}

export interface Doctor {
  id: string;
  name: string;
  email?: string;
  specialty: string;
  city: string;
  rating: number;
  cases_count: number;
  bio: string;
  verified: boolean;
  availability?: string[];
  score?: number;
  reasons?: string[];
}

export interface ChatMessage {
  id?: string;
  role: 'patient' | 'agent' | 'doctor';
  content: string;
  thinking?: string;
  agent?: string;
  ts: string;
  image_url?: string;
  requires_validation?: boolean;
}

export interface ChatConversation {
  id: string;
  title: string;
  status?: string;
  updated_at: string;
  messages?: ChatMessage[];
  patient_id?: string;
  doctor_id?: string | null;
  specialty_detected?: string;
}

export interface CaseItem {
  id: string;
  patient_id: string;
  title: string;
  status: 'open' | 'awaiting_doctor' | 'in_progress' | 'closed';
  updated_at: string;
  patient?: {
    id: string;
    name: string;
    email: string;
    dob?: string;
    gender?: string;
    emergency_contact?: any;
  };
  messages?: ChatMessage[];
}

export interface CuratorTopic {
  topic: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

export interface CuratorDigest {
  id?: string;
  date: string;
  topics: CuratorTopic[];
  cached?: boolean;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  action: string;
  target?: {
    type?: string;
    id?: string;
  };
  ip?: string;
  ts: string;
  detail?: Record<string, any>;
}

export interface AdminStats {
  users: number;
  patients: number;
  doctors: number;
  doctors_pending: number;
  chats_today: number;
  active_appointments_today?: number;
  system_health?: string;
}

export interface PlatformNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  read: boolean;
  timestamp: string;
  roleTarget?: UserRole | 'all';
  link?: string;
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  recipient_id: string;
  recipient_name: string;
  content: string;
  created_at: string;
  read: boolean;
}
