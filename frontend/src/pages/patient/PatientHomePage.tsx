import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  MessageSquare, Calendar, Search, ArrowRight,
  Stethoscope, Clock, AlertTriangle, ShieldCheck, FileText
} from 'lucide-react';
import { doctorService } from '../../services/doctorService';
import { chatService } from '../../services/chatService';
import type { Appointment, ChatConversation } from '../../types';

export const PatientHomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apts, convs] = await Promise.all([
          doctorService.listAppointments({ role: 'patient' }),
          chatService.getConversations(),
        ]);
        setAppointments(apts);
        setConversations(convs);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      }
    };
    fetchData();
  }, []);

  const upcomingApt = appointments.find(a => a.status === 'confirmed' || a.status === 'pending');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sage-900 via-charcoal-900 to-charcoal-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-elevated">
        <div className="relative z-10 max-w-xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-sage-300 mb-2 block">
            Patient Health Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Welcome back, {user?.name ? user.name.split(' ')[0] : 'Patient'}
          </h1>
          <p className="text-sm text-sage-100/80 leading-relaxed mb-6">
            Describe your current symptoms or upload medical imaging to triage with our multi-agent clinical diagnostic assistant.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/app/chat">
              <Button variant="primary" className="bg-white text-charcoal-950 hover:bg-ivory-100" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Start AI Symptom Triage
              </Button>
            </Link>
            <Link to="/app/doctors">
              <Button variant="outline" className="border-white/40 text-white hover:bg-white/10">
                Find a Doctor
              </Button>
            </Link>
          </div>
        </div>

        {/* Ambient watermark icon */}
        <div className="absolute -right-6 -bottom-6 text-white/5 pointer-events-none">
          <Stethoscope className="w-64 h-64" />
        </div>
      </div>

      {/* Emergency Advisory notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <strong className="font-semibold">Urgent Medical Notice:</strong> If you are experiencing sudden severe chest pressure, severe shortness of breath, sudden facial numbness, or uncontrolled bleeding, please immediately contact emergency services (911) or visit your nearest hospital emergency room.
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Next Appointment Card */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">Upcoming Visit</span>
              <Calendar className="w-4 h-4 text-sage-600 dark:text-sage-400" />
            </div>

            {upcomingApt ? (
              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                    {upcomingApt.doctor_name || 'Assigned Physician'}
                  </h3>
                  <p className="text-xs text-sage-700 dark:text-sage-400 font-medium">
                    {upcomingApt.specialty || 'General Medicine'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-charcoal-600 dark:text-charcoal-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(upcomingApt.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                {upcomingApt.notes_from_patient && (
                  <p className="text-xs text-charcoal-500 italic bg-charcoal-50 dark:bg-charcoal-800/60 p-2.5 rounded-lg">
                    "{upcomingApt.notes_from_patient}"
                  </p>
                )}
                <Badge variant={upcomingApt.status === 'confirmed' ? 'active' : 'pending'}>
                  {upcomingApt.status}
                </Badge>
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-xs text-charcoal-500 mb-3">No upcoming appointments scheduled</p>
                <Link to="/app/doctors">
                  <Button variant="outline" size="sm">Book with Doctor</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-charcoal-100 dark:border-charcoal-800 mt-4">
            <Link to="/app/appointments" className="text-xs font-semibold text-sage-700 dark:text-sage-400 hover:underline flex items-center gap-1">
              View all appointments <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        {/* AI Multimodal Assistant Card */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">AI Medical Assistant</span>
              <MessageSquare className="w-4 h-4 text-sage-600 dark:text-sage-400" />
            </div>
            <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 mb-2">
              Clinical Knowledge & CV Triage
            </h3>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400 leading-relaxed mb-4">
              Ask medical questions or upload skin lesions and thoracic radiographs. Verified agent triage provides rapid preliminary analysis.
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-charcoal-700 dark:text-charcoal-300">
                <ShieldCheck className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400" />
                <span>Evidence-based PubMed citations</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-charcoal-700 dark:text-charcoal-300">
                <ShieldCheck className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400" />
                <span>Human physician validation safeguards</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-charcoal-100 dark:border-charcoal-800 mt-4">
            <Link to="/app/chat">
              <Button variant="outline" size="sm" className="w-full">
                Open AI Consultation
              </Button>
            </Link>
          </div>
        </Card>

        {/* Find Doctor Card */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">Verified Providers</span>
              <Search className="w-4 h-4 text-sage-600 dark:text-sage-400" />
            </div>
            <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 mb-2">
              Automated Doctor Matching
            </h3>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400 leading-relaxed mb-4">
              Our specialty matching model analyzes clinical urgency and routes cases to board-verified specialists in your area.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300">Neurology</span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300">Pulmonology</span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300">Dermatology</span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300">Cardiology</span>
            </div>
          </div>

          <div className="pt-4 border-t border-charcoal-100 dark:border-charcoal-800 mt-4">
            <Link to="/app/doctors">
              <Button variant="outline" size="sm" className="w-full">
                Browse Directory & Match
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Consultation Threads */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">Recent Medical Consultations</h2>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400">Past AI consultations and diagnostic triage threads</p>
          </div>
          <Link to="/app/chat">
            <Button variant="ghost" size="sm">New Consultation</Button>
          </Link>
        </div>

        {conversations.length === 0 ? (
          <div className="text-center py-8 text-charcoal-500 text-sm">
            No consultations yet. Start one anytime using the AI Symptom Triage.
          </div>
        ) : (
          <div className="divide-y divide-charcoal-100 dark:divide-charcoal-800">
            {conversations.slice(0, 3).map(conv => (
              <div
                key={conv.id}
                onClick={() => navigate('/app/chat')}
                className="py-3.5 flex items-center justify-between hover:bg-charcoal-50 dark:hover:bg-charcoal-800/50 px-2 rounded-xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sage-50 dark:bg-sage-950/40 text-sage-700 dark:text-sage-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-charcoal-900 dark:text-ivory-100">{conv.title}</h4>
                    <p className="text-xs text-charcoal-500">
                      {conv.specialty_detected ? `${conv.specialty_detected} · ` : ''}
                      Updated {new Date(conv.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={conv.status === 'open' ? 'active' : 'awaiting_doctor'}>
                    {conv.status || 'Active'}
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-charcoal-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PatientHomePage;
