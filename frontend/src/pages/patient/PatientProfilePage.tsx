import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { User, Heart, Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const PatientProfilePage: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || 'Elena Rostova');
  const [email] = useState(user?.email || 'patient@medassist.local');
  const [dob, setDob] = useState(user?.dob || '1992-04-14');
  const [gender, setGender] = useState(user?.gender || 'Female');

  const [emergencyName, setEmergencyName] = useState(user?.emergency_contact?.name || 'Alexander Rostova');
  const [emergencyPhone, setEmergencyPhone] = useState(user?.emergency_contact?.phone || '+1 (555) 234-8901');
  const [emergencyRelation, setEmergencyRelation] = useState(user?.emergency_contact?.relation || 'Spouse');

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      updateUserProfile({
        name,
        dob,
        gender,
        emergency_contact: {
          name: emergencyName,
          phone: emergencyPhone,
          relation: emergencyRelation,
        },
      });
      setIsSaving(false);
      toast('Patient health profile updated successfully', 'success');
    }, 400);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 dark:text-ivory-100">
          Patient Profile & Medical Record
        </h1>
        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
          Manage your personal demographic information and emergency contacts
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Details */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-charcoal-100 dark:border-charcoal-800">
            <User className="w-4 h-4 text-sage-600 dark:text-sage-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 dark:text-ivory-100">
              Personal Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Legal Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <Input
              label="Email Address"
              value={email}
              disabled
              helperText="Contact system admin to change email"
            />
            <Input
              label="Date of Birth"
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
            />
            <Input
              label="Biological Sex / Gender"
              value={gender}
              onChange={e => setGender(e.target.value)}
            />
          </div>
        </Card>

        {/* Emergency Contact */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-charcoal-100 dark:border-charcoal-800">
            <Heart className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 dark:text-ivory-100">
              Emergency Contact
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Contact Name"
              value={emergencyName}
              onChange={e => setEmergencyName(e.target.value)}
              required
            />
            <Input
              label="Contact Phone"
              value={emergencyPhone}
              onChange={e => setEmergencyPhone(e.target.value)}
              required
            />
            <Input
              label="Relationship"
              value={emergencyRelation}
              onChange={e => setEmergencyRelation(e.target.value)}
              required
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PatientProfilePage;
