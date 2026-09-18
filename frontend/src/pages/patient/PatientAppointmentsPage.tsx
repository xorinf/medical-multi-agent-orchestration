import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doctorService } from '../../services/doctorService';
import type { Appointment } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Calendar, Clock, Plus } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const PatientAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await doctorService.listAppointments('patient');
      setAppointments(data);
    } catch (err: any) {
      toast(err?.message || 'Failed to load appointments', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const filtered = appointments.filter(a => {
    const aptDate = new Date(a.scheduled_at);
    if (filter === 'upcoming') return aptDate >= now || a.status === 'confirmed' || a.status === 'pending';
    if (filter === 'past') return aptDate < now && a.status !== 'confirmed' && a.status !== 'pending';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 dark:text-ivory-100">
            My Appointments
          </h1>
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
            Track and review physician consultations and visit history
          </p>
        </div>

        <Link to="/app/doctors">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Book Appointment
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-charcoal-200 dark:border-charcoal-800 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'all'
              ? 'bg-charcoal-900 text-white dark:bg-ivory-100 dark:text-charcoal-950'
              : 'text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          All ({appointments.length})
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'upcoming'
              ? 'bg-charcoal-900 text-white dark:bg-ivory-100 dark:text-charcoal-950'
              : 'text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'past'
              ? 'bg-charcoal-900 text-white dark:bg-ivory-100 dark:text-charcoal-950'
              : 'text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          Past / Completed
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-charcoal-500 text-sm">
          <div className="w-6 h-6 border-2 border-sage-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading consultation schedule...
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="No appointments found"
            description="You have no scheduled clinical visits under this category."
            actionLabel="Find a Doctor"
            onAction={() => window.location.assign('/app/doctors')}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(apt => (
            <Card key={apt.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                    {apt.doctor_name || 'Dr. Clara Vance, MD'}
                  </span>
                  <span className="text-xs text-sage-700 dark:text-sage-400 font-medium">
                    · {apt.specialty || 'Neurology'}
                  </span>
                  <Badge variant={
                    apt.status === 'confirmed' ? 'active' :
                    apt.status === 'completed' ? 'completed' :
                    apt.status === 'pending' ? 'pending' : 'cancelled'
                  }>
                    {apt.status}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal-600 dark:text-charcoal-400">
                  <span className="flex items-center gap-1.5 font-medium text-charcoal-800 dark:text-ivory-200">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(apt.scheduled_at).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {apt.duration_min || 30} minutes duration
                  </span>
                </div>

                {apt.notes_from_patient && (
                  <div className="text-xs text-charcoal-600 dark:text-charcoal-400 bg-charcoal-50 dark:bg-charcoal-800/60 p-2.5 rounded-xl border border-charcoal-100 dark:border-charcoal-800">
                    <strong className="text-charcoal-900 dark:text-ivory-100">Your note: </strong>
                    {apt.notes_from_patient}
                  </div>
                )}

                {apt.notes_from_doctor && (
                  <div className="text-xs text-sage-900 dark:text-sage-200 bg-sage-50 dark:bg-sage-950/40 p-2.5 rounded-xl border border-sage-200 dark:border-sage-800">
                    <strong className="text-sage-800 dark:text-sage-300">Physician guidance: </strong>
                    {apt.notes_from_doctor}
                  </div>
                )}
              </div>

              <div className="sm:self-center shrink-0">
                {apt.status === 'pending' && (
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 block">
                    Awaiting confirmation
                  </span>
                )}
                {apt.status === 'confirmed' && (
                  <span className="text-xs text-sage-700 dark:text-sage-300 font-medium bg-sage-50 dark:bg-sage-950/40 px-3 py-1.5 rounded-lg border border-sage-200 dark:border-sage-800 block">
                    Confirmed Visit
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientAppointmentsPage;
