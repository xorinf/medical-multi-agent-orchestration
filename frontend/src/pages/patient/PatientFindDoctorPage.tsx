import React, { useEffect, useState } from 'react';
import { doctorService } from '../../services/doctorService';
import type { Doctor } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Search, Sparkles, MapPin, Star,
  Calendar, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const PatientFindDoctorPage: React.FC = () => {
  const [tab, setTab] = useState<'match' | 'browse'>('match');
  const [symptomsText, setSymptomsText] = useState('');
  const [matchingResult, setMatchingResult] = useState<{
    specialty: string;
    urgency: string;
    red_flags: string[];
    doctors: Doctor[];
  } | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);

  // Booking Modal State
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  const { toast } = useToast();

  const specialties = [
    'All Specialties',
    'Neurology',
    'Pulmonology & Critical Care',
    'Dermatology',
    'Cardiology',
    'General Internal Medicine',
  ];

  useEffect(() => {
    if (tab === 'browse') {
      fetchDoctors();
    }
  }, [tab, selectedSpecialty]);

  const fetchDoctors = async () => {
    setIsLoadingDoctors(true);
    try {
      const spec = selectedSpecialty === 'All Specialties' ? undefined : selectedSpecialty;
      const res = await doctorService.listDoctors({
        specialty: spec,
        q: searchQuery || undefined,
      });
      setDoctorsList(res);
    } catch (err) {
      console.error('Failed to load doctors', err);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const handleRunMatch = async () => {
    if (!symptomsText.trim()) return;
    setIsMatching(true);
    try {
      const res = await doctorService.matchDoctors(symptomsText);
      setMatchingResult(res);
    } catch (err: any) {
      toast(err?.message || 'Failed to analyze symptoms', 'danger');
    } finally {
      setIsMatching(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !bookingDate) {
      toast('Please pick a date and time for the consultation', 'warning');
      return;
    }
    setIsBooking(true);
    try {
      await doctorService.createAppointment({
        doctor_id: selectedDoctor.id,
        scheduled_at: bookingDate,
        notes: bookingNotes,
      });
      toast(`Appointment request sent to ${selectedDoctor.name}`, 'success');
      setSelectedDoctor(null);
      setBookingDate('');
      setBookingNotes('');
    } catch (err: any) {
      toast(err?.message || 'Failed to book appointment', 'danger');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 dark:text-ivory-100">
            Find a Verified Physician
          </h1>
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
            Match symptoms to specialties or browse board-verified clinicians
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="p-1 bg-charcoal-100 dark:bg-charcoal-800 rounded-xl flex gap-1 self-start">
          <button
            onClick={() => setTab('match')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === 'match'
                ? 'bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 shadow-soft'
                : 'text-charcoal-500 hover:text-charcoal-800 dark:text-charcoal-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Symptom Match
          </button>
          <button
            onClick={() => setTab('browse')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === 'browse'
                ? 'bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 shadow-soft'
                : 'text-charcoal-500 hover:text-charcoal-800 dark:text-charcoal-400'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Browse Directory
          </button>
        </div>
      </div>

      {/* Tab 1: Match from Symptoms */}
      {tab === 'match' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-charcoal-600 dark:text-charcoal-300 mb-2">
              Clinical Symptom Analysis
            </h2>
            <p className="text-xs text-charcoal-500 mb-4">
              Enter your symptoms in plain language. Our extractor model detects medical urgency, flags red flags, and ranks verified specialists by relevance.
            </p>

            <div className="space-y-4">
              <textarea
                value={symptomsText}
                onChange={e => setSymptomsText(e.target.value)}
                placeholder="e.g., I have had unilateral pulsating headaches behind my temple accompanied by shimmering visual spots for two weeks..."
                rows={3}
                className="w-full p-3.5 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-charcoal-50 dark:bg-charcoal-800/60 text-sm text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-sage-500/20 focus:border-sage-600"
              />

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleRunMatch}
                  disabled={!symptomsText.trim() || isMatching}
                  isLoading={isMatching}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  Analyze & Match Specialists
                </Button>
              </div>
            </div>
          </Card>

          {/* Match Results */}
          {matchingResult && (
            <div className="space-y-4 animate-fade-in">
              <Card className="p-5 border-l-4 border-l-sage-600 bg-sage-50/40 dark:bg-sage-950/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-sage-800 dark:text-sage-300">
                      Recommended Specialty
                    </span>
                    <h3 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">
                      {matchingResult.specialty}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-charcoal-500 font-medium">Urgency:</span>
                    <Badge variant={matchingResult.urgency === 'Routine' ? 'active' : 'pending'}>
                      {matchingResult.urgency}
                    </Badge>
                  </div>
                </div>

                {matchingResult.red_flags.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-sage-200 dark:border-sage-800 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Red Flag Screening: {matchingResult.red_flags.join(', ')}</span>
                  </div>
                )}
              </Card>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-500 px-1">
                  Top Ranked Physicians ({matchingResult.doctors.length})
                </h3>

                {matchingResult.doctors.map(doc => (
                  <DoctorCard
                    key={doc.id}
                    doctor={doc}
                    onBook={() => setSelectedDoctor(doc)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Browse Directory */}
      {tab === 'browse' && (
        <div className="space-y-5">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="Search physician name, specialty, or clinical focus..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchDoctors()}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Button variant="outline" onClick={fetchDoctors}>
              Search
            </Button>
          </div>

          {/* Specialty Pills */}
          <div className="flex flex-wrap gap-2">
            {specialties.map(spec => {
              const isSelected = selectedSpecialty === spec || (!selectedSpecialty && spec === 'All Specialties');
              return (
                <button
                  key={spec}
                  onClick={() => setSelectedSpecialty(spec === 'All Specialties' ? '' : spec)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-charcoal-900 text-white dark:bg-ivory-100 dark:text-charcoal-950 shadow-soft'
                      : 'bg-white dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 border border-charcoal-200 dark:border-charcoal-700 hover:border-charcoal-400'
                  }`}
                >
                  {spec}
                </button>
              );
            })}
          </div>

          {/* Doctors List */}
          {isLoadingDoctors ? (
            <div className="py-16 text-center text-charcoal-500 text-sm">
              <div className="w-6 h-6 border-2 border-sage-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading verified clinicians...
            </div>
          ) : doctorsList.length === 0 ? (
            <Card>
              <EmptyState
                title="No physicians found"
                description="Try clearing your search query or selecting a different specialty."
                actionLabel="Clear Filters"
                onAction={() => {
                  setSearchQuery('');
                  setSelectedSpecialty('');
                  fetchDoctors();
                }}
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {doctorsList.map(doc => (
                <DoctorCard
                  key={doc.id}
                  doctor={doc}
                  onBook={() => setSelectedDoctor(doc)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      {selectedDoctor && (
        <Modal
          isOpen={Boolean(selectedDoctor)}
          onClose={() => setSelectedDoctor(null)}
          title={`Request Appointment with ${selectedDoctor.name}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-sage-50 dark:bg-sage-950/40 border border-sage-200 dark:border-sage-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sage-700 text-white flex items-center justify-center font-bold">
                MD
              </div>
              <div>
                <h4 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">{selectedDoctor.name}</h4>
                <p className="text-xs text-charcoal-600 dark:text-charcoal-400">{selectedDoctor.specialty} · {selectedDoctor.city}</p>
              </div>
            </div>

            <Input
              type="datetime-local"
              label="Select Desired Date & Time"
              value={bookingDate}
              onChange={e => setBookingDate(e.target.value)}
              required
            />

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-600 dark:text-charcoal-300 block mb-1.5">
                Notes for the Physician (Optional)
              </label>
              <textarea
                value={bookingNotes}
                onChange={e => setBookingNotes(e.target.value)}
                placeholder="Briefly state reason for visit or clinical concerns..."
                rows={3}
                className="w-full p-3 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-sm text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-sage-500/20 focus:border-sage-600"
              />
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-charcoal-100 dark:border-charcoal-800">
              <Button variant="ghost" onClick={() => setSelectedDoctor(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmBooking}
                isLoading={isBooking}
                disabled={!bookingDate}
              >
                Confirm Request
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

interface DoctorCardProps {
  doctor: Doctor;
  onBook: () => void;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onBook }) => {
  return (
    <Card className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-charcoal-300 dark:hover:border-charcoal-700 transition-all">
      <div className="flex items-start gap-3.5 flex-1">
        <div className="w-11 h-11 rounded-xl bg-sage-100 dark:bg-sage-900/60 text-sage-800 dark:text-sage-200 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
          {doctor.name.replace('Dr. ', '').split(' ')[0][0]}
          {doctor.name.split(' ')[1]?.[0] || ''}
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">{doctor.name}</h4>
            {doctor.verified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sage-700 dark:text-sage-300 px-2 py-0.5 rounded-full bg-sage-50 dark:bg-sage-950/40 border border-sage-300/60 dark:border-sage-800">
                <ShieldCheck className="w-3 h-3" /> Verified MD
              </span>
            )}
            <span className="text-xs text-charcoal-400">·</span>
            <span className="text-xs text-sage-700 dark:text-sage-400 font-medium">{doctor.specialty}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {doctor.city}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 font-medium text-charcoal-700 dark:text-charcoal-300">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              {doctor.rating ? doctor.rating.toFixed(2) : '4.90'}
            </span>
            <span>·</span>
            <span>{doctor.cases_count} cases managed</span>
          </div>

          <p className="text-xs text-charcoal-600 dark:text-charcoal-400 line-clamp-2 leading-relaxed pt-0.5">
            {doctor.bio}
          </p>

          {doctor.reasons && doctor.reasons.length > 0 && (
            <div className="pt-1 text-[11px] text-sage-700 dark:text-sage-400 font-medium">
              Match rationale: {doctor.reasons[0]}
            </div>
          )}
        </div>
      </div>

      <div className="sm:self-center shrink-0 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onBook}
          className="w-full sm:w-auto"
          rightIcon={<Calendar className="w-3.5 h-3.5" />}
        >
          Request Visit
        </Button>
      </div>
    </Card>
  );
};

export default PatientFindDoctorPage;
