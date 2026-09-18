import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockUsers } from '../../services/mockData';
import type { User as UserType } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Mail, ArrowRight, Heart } from 'lucide-react';

export const DoctorPatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<UserType[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const list = mockUsers.filter(u => u.role === 'patient');
    setPatients(list);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 dark:text-ivory-100">
          Patient Directory & Case History
        </h1>
        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
          Active patients registered under your clinical caseload
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patients.map(p => (
          <Card key={p.id} className="p-5 space-y-4 hover:border-charcoal-300 dark:hover:border-charcoal-700 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-sage-100 dark:bg-sage-900/60 text-sage-800 dark:text-sage-200 flex items-center justify-center font-bold text-sm">
                  {p.name.split(' ')[0][0]}{p.name.split(' ')[1]?.[0] || ''}
                </div>
                <div>
                  <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">{p.name}</h3>
                  <p className="text-xs text-charcoal-500">{p.email}</p>
                </div>
              </div>
              <Badge variant="active">Active Patient</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-charcoal-100 dark:border-charcoal-800">
              <div>
                <span className="text-charcoal-400 block text-[10px] uppercase">DOB</span>
                <span className="font-medium text-charcoal-700 dark:text-charcoal-300">{p.dob || '1992-04-14'}</span>
              </div>
              <div>
                <span className="text-charcoal-400 block text-[10px] uppercase">Gender</span>
                <span className="font-medium text-charcoal-700 dark:text-charcoal-300">{p.gender || 'Female'}</span>
              </div>
            </div>

            {p.emergency_contact && (
              <div className="p-3 rounded-xl bg-charcoal-50 dark:bg-charcoal-800/60 border border-charcoal-100 dark:border-charcoal-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-charcoal-600 dark:text-charcoal-300 font-semibold">
                  <Heart className="w-3.5 h-3.5 text-red-500" />
                  Emergency: {p.emergency_contact.name} ({p.emergency_contact.relation})
                </div>
                <div className="text-charcoal-500 pl-5">
                  {p.emergency_contact.phone}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/doctor/messages')}
                leftIcon={<Mail className="w-3.5 h-3.5" />}
              >
                Message Patient
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/doctor/queue')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Case File
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DoctorPatientsPage;
