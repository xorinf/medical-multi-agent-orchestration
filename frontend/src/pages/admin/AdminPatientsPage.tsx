import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { User } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const AdminPatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getUsers({ role: 'patient' }).then(res => {
      setPatients(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 dark:text-ivory-100">
          Patient Caseload Registry
        </h1>
        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
          Enrolled patients with active multi-agent triage history
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-charcoal-400">Loading patient caseload registry...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patients.map(p => (
          <Card key={p.id} className="p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-800 dark:text-ivory-200 flex items-center justify-center font-bold text-sm">
                  {p.name.split(' ')[0][0]}{p.name.split(' ')[1]?.[0] || ''}
                </div>
                <div>
                  <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">{p.name}</h3>
                  <p className="text-xs text-charcoal-500">{p.email}</p>
                </div>
              </div>
              <Badge variant="active">Patient</Badge>
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
              <div className="p-3 rounded-xl bg-charcoal-50 dark:bg-charcoal-800/60 border border-charcoal-100 dark:border-charcoal-800 text-xs flex items-center justify-between">
                <span className="text-charcoal-600 dark:text-charcoal-300 font-medium">
                  Emergency: {p.emergency_contact.name} ({p.emergency_contact.relation})
                </span>
                <span className="text-charcoal-500">{p.emergency_contact.phone}</span>
              </div>
            )}
          </Card>
        ))}
      </div>
      )}
    </div>
  );
};

export default AdminPatientsPage;
