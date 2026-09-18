import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { caseService } from '../../services/caseService';
import { doctorService } from '../../services/doctorService';
import { curatorService } from '../../services/curatorService';
import type { CaseItem, Appointment, CuratorDigest } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  ClipboardList, Calendar, BookOpen, Users, ArrowRight,
  Stethoscope, ShieldAlert
} from 'lucide-react';

export const DoctorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cases, setCases] = useState<CaseItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [curator, setCurator] = useState<CuratorDigest | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [c, a, cur] = await Promise.all([
          caseService.getQueue(),
          doctorService.listAppointments({ role: 'doctor' }),
          curatorService.getToday(),
        ]);
        setCases(c);
        setAppointments(a);
        setCurator(cur);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDashboard();
  }, []);

  const pendingCases = cases.filter(c => c.status === 'awaiting_doctor' || c.status === 'open');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-charcoal-900 via-sage-950 to-charcoal-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-elevated">
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sage-300">
              Physician Clinical Portal
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-sage-800/80 text-sage-200 border border-sage-700">
              {user?.specialty || 'Neurology'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            {user?.name || 'Dr. Clara Vance, MD'}
          </h1>
          <p className="text-sm text-sage-100/80 leading-relaxed mb-6">
            You have {pendingCases.length} case{pendingCases.length === 1 ? '' : 's'} awaiting clinical review and validation in your triage queue today.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link to="/doctor/queue">
              <Button variant="primary" className="bg-white text-charcoal-950 hover:bg-ivory-100" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Open Triage Queue
              </Button>
            </Link>
            <Link to="/doctor/curator">
              <Button variant="outline" className="border-white/40 text-white hover:bg-white/10" leftIcon={<BookOpen className="w-4 h-4" />}>
                Today's Curator ({curator?.topics.length || 3} topics)
              </Button>
            </Link>
          </div>
        </div>

        <div className="absolute -right-6 -bottom-6 text-white/5 pointer-events-none">
          <Stethoscope className="w-64 h-64" />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100">
              {pendingCases.length}
            </div>
            <div className="text-xs text-charcoal-500 font-medium">Pending Cases</div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-sage-50 dark:bg-sage-950/40 text-sage-600 dark:text-sage-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100">
              {appointments.length}
            </div>
            <div className="text-xs text-charcoal-500 font-medium">Consultations</div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100">
              {user?.cases_count || 142}
            </div>
            <div className="text-xs text-charcoal-500 font-medium">Total Cases</div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-sage-100 dark:bg-sage-900 text-sage-800 dark:text-sage-200 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100">
              {curator?.topics.length || 3}
            </div>
            <div className="text-xs text-charcoal-500 font-medium">Daily Topics</div>
          </div>
        </Card>
      </div>

      {/* Main Grid: Priority Cases & Curator Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Triage Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Priority Cases Awaiting Physician Review
            </h2>
            <Link to="/doctor/queue" className="text-xs font-semibold text-sage-700 dark:text-sage-400 hover:underline">
              View full queue →
            </Link>
          </div>

          <div className="space-y-3">
            {cases.slice(0, 3).map(c => (
              <Card
                key={c.id}
                hoverable
                onClick={() => navigate('/doctor/queue')}
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                      {c.title}
                    </span>
                    <Badge variant={c.status === 'awaiting_doctor' ? 'awaiting_doctor' : 'active'}>
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-charcoal-500">
                    Patient: {c.patient?.name || 'Patient'} · Updated {new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <Button size="sm" variant="outline" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Review Case
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Today's Curator Snapshot */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
              Daily Clinical Curator
            </h2>
            <Link to="/doctor/curator" className="text-xs font-semibold text-sage-700 dark:text-sage-400 hover:underline">
              Explore →
            </Link>
          </div>

          <Card className="p-5 space-y-3">
            <span className="text-[11px] font-semibold text-sage-700 dark:text-sage-400 uppercase tracking-wider block">
              PubMed Guideline Highlights · {new Date().toISOString().split('T')[0]}
            </span>

            {curator?.topics.slice(0, 2).map((t, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-charcoal-50 dark:bg-charcoal-800/60 border border-charcoal-100 dark:border-charcoal-800 space-y-1">
                <h4 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 line-clamp-2">
                  {t.topic}
                </h4>
                <p className="text-[11px] text-charcoal-600 dark:text-charcoal-400 line-clamp-2">
                  {t.sources[0]?.snippet || 'Evidence digest synthesized.'}
                </p>
              </div>
            ))}

            <Link to="/doctor/curator" className="block pt-2">
              <Button variant="outline" size="sm" className="w-full">
                View All Research Topics
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboardPage;
