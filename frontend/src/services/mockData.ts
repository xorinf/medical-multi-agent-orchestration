import type { User, Doctor, Appointment, ChatConversation, CaseItem, CuratorDigest, AuditLog, AdminStats, PlatformNotification, DirectMessage } from '../types';

export const mockUsers: User[] = [
  {
    id: 'pat-001',
    name: 'Elena Rostova',
    email: 'patient@medassist.local',
    role: 'patient',
    status: 'active',
    dob: '1992-04-14',
    gender: 'Female',
    emergency_contact: {
      name: 'Alexander Rostova',
      phone: '+1 (555) 234-8901',
      relation: 'Spouse',
    },
  },
  {
    id: 'doc-001',
    name: 'Dr. Clara Vance, MD',
    email: 'doctor@medassist.local',
    role: 'doctor',
    status: 'active',
    specialty: 'Neurology',
    license_no: 'MED-99482-NEURO',
    city: 'Boston, MA',
    rating: 4.95,
    cases_count: 142,
    bio: 'Board-certified clinical neurologist specializing in cognitive assessment, headache syndromes, and multi-agent neural triage.',
    availability: ['Mon 09:00 - 15:00', 'Wed 10:00 - 17:00', 'Thu 12:00 - 18:00'],
  },
  {
    id: 'doc-002',
    name: 'Dr. Marcus Thorne, MD',
    email: 'm.thorne@medassist.local',
    role: 'doctor',
    status: 'active',
    specialty: 'Pulmonology & Critical Care',
    license_no: 'MED-77182-PULM',
    city: 'New York, NY',
    rating: 4.88,
    cases_count: 218,
    bio: 'Pulmonologist with extensive experience in acute respiratory distress, thoracic imaging diagnostics, and post-viral recovery.',
    availability: ['Tue 08:30 - 14:00', 'Thu 09:00 - 16:30', 'Fri 10:00 - 15:00'],
  },
  {
    id: 'doc-003',
    name: 'Dr. Evelyn Song, MD',
    email: 'e.song@medassist.local',
    role: 'doctor',
    status: 'pending_verification',
    specialty: 'Dermatology',
    license_no: 'MED-55092-DERM',
    city: 'San Francisco, CA',
    rating: 4.92,
    cases_count: 89,
    bio: 'Specialist in computerized dermoscopy, melanoma triage, and clinical cutaneous oncology.',
    availability: ['Mon 10:00 - 16:00', 'Wed 09:00 - 15:00'],
  },
  {
    id: 'adm-001',
    name: 'Chief Admin Sarah Jenkins',
    email: 'admin@medassist.local',
    role: 'admin',
    status: 'active',
  }
];

export const mockDoctors: Doctor[] = [
  {
    id: 'doc-001',
    name: 'Dr. Clara Vance, MD',
    email: 'doctor@medassist.local',
    specialty: 'Neurology',
    city: 'Boston, MA',
    rating: 4.95,
    cases_count: 142,
    bio: 'Board-certified clinical neurologist specializing in cognitive assessment, headache syndromes, and multi-agent neural triage.',
    verified: true,
    availability: ['Today 14:00', 'Tomorrow 10:30', 'Tomorrow 15:00', 'Friday 11:00'],
  },
  {
    id: 'doc-002',
    name: 'Dr. Marcus Thorne, MD',
    email: 'm.thorne@medassist.local',
    specialty: 'Pulmonology & Critical Care',
    city: 'New York, NY',
    rating: 4.88,
    cases_count: 218,
    bio: 'Pulmonologist with extensive experience in acute respiratory distress, thoracic imaging diagnostics, and post-viral recovery.',
    verified: true,
    availability: ['Tomorrow 09:00', 'Thursday 13:00', 'Friday 14:30'],
  },
  {
    id: 'doc-004',
    name: 'Dr. Aris Sterling, MD',
    email: 'a.sterling@medassist.local',
    specialty: 'Cardiology',
    city: 'Chicago, IL',
    rating: 4.91,
    cases_count: 175,
    bio: 'Preventive cardiology, echocardiography interpretation, and arrhythmia monitoring clinician.',
    verified: true,
    availability: ['Today 16:30', 'Wednesday 11:00', 'Thursday 15:30'],
  },
  {
    id: 'doc-005',
    name: 'Dr. Maya Lin, MD',
    email: 'm.lin@medassist.local',
    specialty: 'General Internal Medicine',
    city: 'Seattle, WA',
    rating: 4.86,
    cases_count: 310,
    bio: 'Comprehensive internal medicine, metabolic syndrome management, and preventative health screenings.',
    verified: true,
    availability: ['Today 13:00', 'Tomorrow 14:00', 'Thursday 10:00'],
  }
];

export const mockAppointments: Appointment[] = [
  {
    id: 'apt-001',
    patient_id: 'pat-001',
    doctor_id: 'doc-001',
    doctor_name: 'Dr. Clara Vance, MD',
    patient_name: 'Elena Rostova',
    specialty: 'Neurology',
    scheduled_at: new Date(Date.now() + 86400000 * 1.5).toISOString(),
    duration_min: 30,
    notes_from_patient: 'Follow-up on episodic tension headaches and mild photophobia.',
    notes_from_doctor: 'Requested review of recent symptom diary and sleep logs.',
    status: 'confirmed',
  },
  {
    id: 'apt-002',
    patient_id: 'pat-001',
    doctor_id: 'doc-002',
    doctor_name: 'Dr. Marcus Thorne, MD',
    patient_name: 'Elena Rostova',
    specialty: 'Pulmonology & Critical Care',
    scheduled_at: new Date(Date.now() + 86400000 * 5).toISOString(),
    duration_min: 45,
    notes_from_patient: 'Routine pulmonary function test review.',
    status: 'pending',
  },
  {
    id: 'apt-003',
    patient_id: 'pat-001',
    doctor_id: 'doc-005',
    doctor_name: 'Dr. Maya Lin, MD',
    patient_name: 'Elena Rostova',
    specialty: 'General Internal Medicine',
    scheduled_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    duration_min: 30,
    notes_from_patient: 'Annual preventative wellness checkup.',
    notes_from_doctor: 'Vitals stable. Recommended vitamin D3 supplementation and repeat metabolic panel in 6 months.',
    status: 'completed',
  }
];

export const mockConversations: ChatConversation[] = [
  {
    id: 'conv-001',
    title: 'Migraine evaluation with visual aura',
    status: 'open',
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    specialty_detected: 'Neurology',
    messages: [
      {
        role: 'patient',
        content: 'Hello, I have been experiencing throbbing headaches behind my right temple with shimmering lights in my peripheral vision.',
        ts: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        role: 'agent',
        content: 'Thank you for sharing your symptoms. Based on your description of unilateral throbbing temple pain accompanied by visual photopsia (scintillating scotoma), these signs strongly correlate with **Migraine with Typical Aura**.\n\n### Clinical Observations:\n1. **Aura Characteristics**: Visual disturbances typically precede the headache phase by 20 to 60 minutes.\n2. **Red Flag Screening**: No reported sudden thunderclap onset, persistent fever, or focal motor weakness.\n\n### Recommended Next Steps:\n- Maintain a structured headache log (duration, triggers, food intake).\n- Avoid intense screen exposure and abrupt illumination changes during acute episodes.\n- Consider scheduling a neurological consultation with Dr. Clara Vance for formal prophylactic assessment.',
        thinking: '1. Patient reported unilateral throbbing temporal headache with shimmering visual phenomena.\n2. Cross-referenced ICD-10 G43.109 (Migraine with aura).\n3. Evaluated red flags (SNOOP mnemonic): no systemic symptoms, no acute onset thunderclap, age < 50.\n4. Formulation: Low urgency, moderate discomfort. Recommend hydration, dark environment, and neurological referral.',
        agent: 'RAG_CLINICAL_DECISION_AGENT',
        ts: new Date(Date.now() - 3600000 * 2 + 5000).toISOString(),
      }
    ]
  },
  {
    id: 'conv-002',
    title: 'Chest radiograph consultation',
    status: 'awaiting_doctor',
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    specialty_detected: 'Pulmonology',
    messages: [
      {
        role: 'patient',
        content: 'Could you analyze my recent chest X-ray? I have had a mild persistent cough for 10 days.',
        ts: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        role: 'agent',
        content: 'The computer-vision chest diagnostic agent has processed your radiograph.\n\n**Preliminary Classification**: Bilateral lung fields appear clear without focal consolidation, pneumothorax, or pleural effusion. Cardiothoracic ratio is within normal limits (< 0.50).\n\n*Note*: Because this involves computer-vision image triage, clinical protocol requires secondary verification by a certified physician before final diagnostic confirmation.',
        thinking: 'CV Agent executed ResNet-50 / DenseNet-121 ensemble. Output: Normal (confidence 0.94), Pneumonia (confidence 0.04), COVID-19 (confidence 0.02). Triggered human-in-the-loop requirement flag.',
        agent: 'CHEST_XRAY_CV_AGENT_HUMAN_VALIDATION',
        requires_validation: true,
        ts: new Date(Date.now() - 86400000 + 4000).toISOString(),
      }
    ]
  }
];

export const mockCases: CaseItem[] = [
  {
    id: 'conv-002',
    patient_id: 'pat-001',
    title: 'Bilateral Thoracic Radiograph Review (Mild Cough)',
    status: 'awaiting_doctor',
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    patient: {
      id: 'pat-001',
      name: 'Elena Rostova',
      email: 'patient@medassist.local',
      dob: '1992-04-14',
      gender: 'Female',
    },
    messages: mockConversations[1].messages,
  },
  {
    id: 'conv-003',
    patient_id: 'pat-002',
    title: 'Dermatological lesion assessment (Left shoulder)',
    status: 'open',
    updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    patient: {
      id: 'pat-002',
      name: 'Jordan Miller',
      email: 'jordan.m@example.com',
      dob: '1985-11-20',
      gender: 'Male',
    },
    messages: [
      {
        role: 'patient',
        content: 'I noticed a pigmented macule on my shoulder that has slightly darkened over the past 3 months.',
        ts: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
      {
        role: 'agent',
        content: 'Initial dermoscopic analysis indicates benign melanocytic nevus characteristics (uniform pigment network, symmetric border). However, ongoing observation or clinical dermoscopic evaluation is recommended.',
        agent: 'SKIN_LESION_CV_AGENT_HUMAN_VALIDATION',
        requires_validation: true,
        ts: new Date(Date.now() - 3600000 * 8 + 3000).toISOString(),
      }
    ]
  }
];

export const mockCuratorDigest: CuratorDigest = {
  date: new Date().toISOString().split('T')[0],
  cached: true,
  topics: [
    {
      topic: 'Latest Neurology Clinical Practice Guidelines 2026',
      sources: [
        {
          title: 'AAN 2026 Consensus on Calcitonin Gene-Related Peptide (CGRP) Antagonists',
          url: 'https://pubmed.ncbi.nlm.nih.gov/clinical-guidelines-cgrp-2026',
          snippet: 'Updated multicenter randomized trial data reinforces early intervention with second-generation CGRP receptor monoclonal antibodies for refractory chronic migraine prophylaxis, demonstrating a 62% reduction in monthly migraine days.',
        },
        {
          title: 'Neuromodulation Protocols in Cluster Headache Management',
          url: 'https://pubmed.ncbi.nlm.nih.gov/neuromod-cluster-headache',
          snippet: 'Non-invasive vagal nerve stimulation and sphenopalatine ganglion micro-stimulation show sustained efficacy without cardiac chronotropic side effects in outpatient settings.',
        }
      ]
    },
    {
      topic: 'Recent Neuro-Oncology Case Reports & AI Biomarker Discoveries',
      sources: [
        {
          title: 'Multi-Modal MRI Perfusion Radiomics for IDH-1 Mutation Profiling',
          url: 'https://pubmed.ncbi.nlm.nih.gov/radiomics-idh1-2026',
          snippet: 'Deep transformer models trained on combined T1c, T2-FLAIR, and dynamic susceptibility contrast (DSC) perfusion images achieved 96.4% sensitivity in non-invasive gliomas genotyping.',
        }
      ]
    },
    {
      topic: 'Emerging Therapeutic Agents in Neurovascular Disease',
      sources: [
        {
          title: 'Tenecteplase vs Alteplase in Extended Window Ischemic Stroke (4.5h - 9h)',
          url: 'https://pubmed.ncbi.nlm.nih.gov/tenecteplase-extended-window',
          snippet: 'Phase III international trial validates non-inferiority and superior reperfusion rates with single-bolus tenecteplase for large vessel occlusion patients receiving mechanical thrombectomy.',
        }
      ]
    }
  ]
};

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'aud-001',
    actor_id: 'doc-001',
    action: 'case.claimed',
    target: { type: 'case', id: 'conv-002' },
    ip: '192.168.1.104',
    ts: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    detail: { specialty: 'Neurology' }
  },
  {
    id: 'aud-002',
    actor_id: 'adm-001',
    action: 'doctor.approved',
    target: { type: 'doctor', id: 'doc-001' },
    ip: '10.0.0.12',
    ts: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    detail: { license_no: 'MED-99482-NEURO', decision: 'approve' }
  },
  {
    id: 'aud-003',
    actor_id: 'pat-001',
    action: 'appointment.created',
    target: { type: 'appointment', id: 'apt-001' },
    ip: '74.125.20.14',
    ts: new Date(Date.now() - 1000 * 3600 * 3).toISOString(),
    detail: { doctor_id: 'doc-001', duration_min: 30 }
  },
  {
    id: 'aud-004',
    actor_id: 'pat-001',
    action: 'chat.message',
    target: { type: 'chat', id: 'conv-001' },
    ip: '74.125.20.14',
    ts: new Date(Date.now() - 1000 * 3600 * 4).toISOString(),
    detail: { agent: 'RAG_CLINICAL_DECISION_AGENT', has_image: false }
  },
  {
    id: 'aud-005',
    actor_id: 'doc-001',
    action: 'login.success',
    target: { type: 'user', id: 'doc-001' },
    ip: '192.168.1.104',
    ts: new Date(Date.now() - 1000 * 3600 * 6).toISOString(),
    detail: { user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  }
];

export const mockAdminStats: AdminStats = {
  users: 148,
  patients: 122,
  doctors: 24,
  doctors_pending: 2,
  chats_today: 49,
  active_appointments_today: 14,
  system_health: 'All 4 Multi-Agent Pipelines Operational',
};

export const mockNotifications: PlatformNotification[] = [
  {
    id: 'notif-001',
    title: 'Doctor Credential Review Pending',
    message: 'Dr. Evelyn Song submitted credentials for board verification.',
    type: 'warning',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    roleTarget: 'admin',
    link: '/admin/users/pending',
  },
  {
    id: 'notif-002',
    title: 'Consultation Appointment Confirmed',
    message: 'Your appointment with Dr. Clara Vance is scheduled for tomorrow at 14:00.',
    type: 'success',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    roleTarget: 'patient',
    link: '/app/appointments',
  },
  {
    id: 'notif-003',
    title: 'New Patient Case in Queue',
    message: 'A patient chest radiograph triage case is awaiting physician sign-off.',
    type: 'info',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 3600 * 5).toISOString(),
    roleTarget: 'doctor',
    link: '/doctor/queue',
  }
];

export const mockDirectMessages: DirectMessage[] = [
  {
    id: 'msg-001',
    conversation_id: 'dm-001',
    sender_id: 'doc-001',
    sender_name: 'Dr. Clara Vance, MD',
    sender_role: 'doctor',
    recipient_id: 'pat-001',
    recipient_name: 'Elena Rostova',
    content: 'Good morning Elena. I reviewed your symptom timeline before our appointment tomorrow. Please bring any prior brain MRI CDs if available.',
    created_at: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
    read: true,
  },
  {
    id: 'msg-002',
    conversation_id: 'dm-001',
    sender_id: 'pat-001',
    sender_name: 'Elena Rostova',
    sender_role: 'patient',
    recipient_id: 'doc-001',
    recipient_name: 'Dr. Clara Vance, MD',
    content: 'Thank you Dr. Vance! I have the optical disk from 2024 and will bring it along.',
    created_at: new Date(Date.now() - 1000 * 1800).toISOString(),
    read: false,
  }
];
