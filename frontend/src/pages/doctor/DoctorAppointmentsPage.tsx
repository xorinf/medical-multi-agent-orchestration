import React, { useEffect, useState } from 'react';
import { doctorService } from '../../services/doctorService';
import type { Appointment } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Calendar, Clock, CheckCircle2, XCircle, Edit3 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const DoctorAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await doctorService.listAppointments({ role: 'doctor' });
      setAppointments(data);
    } catch (err: any) {
      toast(err?.message || 'Failed to load appointments', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const openManageModal = (apt: Appointment) => {
    setSelectedApt(apt);
    setDoctorNotes(apt.notes_from_doctor || '');
  };

  const handleUpdateStatus = async (status: 'confirmed' | 'cancelled') => {
    if (!selectedApt) return;
    setIsUpdating(true);
    try {
      await doctorService.updateAppointment(selectedApt.id, {
        status,
        notes_from_doctor: doctorNotes,
      });
      toast(`Appointment marked as ${status}`, 'success');
      setSelectedApt(null);
      await loadAppointments();
    } catch (err: any) {
      toast(err?.message || 'Failed to update appointment', 'danger');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 dark:text-ivory-100">
          Physician Consultation Schedule
        </h1>
        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
          Manage upcoming patient visits, confirm bookings, and record clinical guidance
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-charcoal-500 text-sm">
          <div className="w-6 h-6 border-2 border-sage-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading appointment calendar...
        </div>
      ) : appointments.length === 0 ? (
        <Card>
          <EmptyState
            title="No appointments scheduled"
            description="Patient requests and confirmed visits will appear here."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map(apt => (
            <Card key={apt.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                    {apt.patient_name || 'Elena Rostova'}
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
                    {apt.duration_min} minutes
                  </span>
                </div>

                {apt.notes_from_patient && (
                  <div className="text-xs text-charcoal-600 dark:text-charcoal-400 bg-charcoal-50 dark:bg-charcoal-800/60 p-2.5 rounded-xl border border-charcoal-100 dark:border-charcoal-800">
                    <strong className="text-charcoal-900 dark:text-ivory-100">Patient stated reason: </strong>
                    {apt.notes_from_patient}
                  </div>
                )}

                {apt.notes_from_doctor && (
                  <div className="text-xs text-sage-900 dark:text-sage-200 bg-sage-50 dark:bg-sage-950/40 p-2.5 rounded-xl border border-sage-200 dark:border-sage-800">
                    <strong className="text-sage-800 dark:text-sage-300">Your clinical note: </strong>
                    {apt.notes_from_doctor}
                  </div>
                )}
              </div>

              <div className="sm:self-center shrink-0">
                <Button variant="outline" size="sm" onClick={() => openManageModal(apt)} leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                  Manage Visit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Manage Appointment Modal */}
      {selectedApt && (
        <Modal
          isOpen={Boolean(selectedApt)}
          onClose={() => setSelectedApt(null)}
          title={`Manage Consultation with ${selectedApt.patient_name || 'Patient'}`}
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-800/60 border border-charcoal-200/60 dark:border-charcoal-700/60 space-y-1">
              <div className="text-xs text-charcoal-500">Scheduled Time</div>
              <div className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                {new Date(selectedApt.scheduled_at).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-600 dark:text-charcoal-300 block mb-1.5">
                Physician Preparation & Clinical Guidance
              </label>
              <textarea
                value={doctorNotes}
                onChange={e => setDoctorNotes(e.target.value)}
                placeholder="Add directives, pre-visit requests, or clinical summary..."
                rows={3}
                className="w-full p-3 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-sm text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-sage-500/20 focus:border-sage-600"
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-end pt-3 border-t border-charcoal-100 dark:border-charcoal-800">
              <Button variant="ghost" onClick={() => setSelectedApt(null)}>
                Close
              </Button>
              <Button
                variant="danger"
                onClick={() => handleUpdateStatus('cancelled')}
                isLoading={isUpdating}
                leftIcon={<XCircle className="w-3.5 h-3.5" />}
              >
                Cancel Visit
              </Button>
              <Button
                variant="primary"
                onClick={() => handleUpdateStatus('confirmed')}
                isLoading={isUpdating}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Confirm & Save
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DoctorAppointmentsPage;
