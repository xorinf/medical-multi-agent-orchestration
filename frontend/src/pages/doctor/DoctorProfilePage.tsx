import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Stethoscope, Clock, Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const DoctorProfilePage: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || 'Dr. Clara Vance, MD');
  const [specialty, setSpecialty] = useState(user?.specialty || 'Neurology');
  const [licenseNo, setLicenseNo] = useState(user?.license_no || 'MED-99482-NEURO');
  const [city, setCity] = useState(user?.city || 'Boston, MA');
  const [bio, setBio] = useState(
    user?.bio ||
    'Board-certified clinical neurologist specializing in cognitive assessment, headache syndromes, and multi-agent neural triage.'
  );
  const [isSaving, setIsSaving] = useState(false);

  const availabilitySlots = [
    'Mon: 09:00 - 15:00',
    'Wed: 10:00 - 17:00',
    'Thu: 12:00 - 18:00',
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      updateUserProfile({
        name,
        specialty,
        license_no: licenseNo,
        city,
        bio,
      });
      setIsSaving(false);
      toast('Doctor professional profile updated', 'success');
    }, 400);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 dark:text-ivory-100">
            Physician Credentials & Profile
          </h1>
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
            Manage your board verification, specialty details, and public clinical bio
          </p>
        </div>

        <Badge variant={user?.status === 'pending_verification' ? 'pending' : 'active'}>
          {user?.status === 'pending_verification' ? 'Pending Admin Review' : 'Board Verified'}
        </Badge>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Professional Details */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-charcoal-100 dark:border-charcoal-800">
            <Stethoscope className="w-4 h-4 text-sage-600 dark:text-sage-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 dark:text-ivory-100">
              Clinical Credentials
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name & Title"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <Input
              label="Primary Specialty"
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              required
            />
            <Input
              label="Medical Board License #"
              value={licenseNo}
              onChange={e => setLicenseNo(e.target.value)}
              required
            />
            <Input
              label="Practice Location"
              value={city}
              onChange={e => setCity(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-600 dark:text-charcoal-300 block mb-1.5">
              Professional Biography
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-sm text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-sage-500/20 focus:border-sage-600 leading-relaxed"
            />
          </div>
        </Card>

        {/* Availability Schedule */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-charcoal-100 dark:border-charcoal-800">
            <Clock className="w-4 h-4 text-sage-600 dark:text-sage-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 dark:text-ivory-100">
              Weekly Consultation Availability
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {availabilitySlots.map((slot, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-charcoal-50 dark:bg-charcoal-800/60 border border-charcoal-200/60 dark:border-charcoal-700/60 text-xs font-medium text-charcoal-800 dark:text-ivory-200"
              >
                {slot}
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Professional Profile
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DoctorProfilePage;
