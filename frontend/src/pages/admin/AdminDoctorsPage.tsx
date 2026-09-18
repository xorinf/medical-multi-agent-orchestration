import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { User } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const AdminDoctorsPage: React.FC = () => {
  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getUsers({ role: 'doctor' }).then(res => {
      setDoctors(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 dark:text-ivory-100">
          Physician Provider Registry
        </h1>
        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
          Directory of verified and pending doctors practicing on the network
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-charcoal-400">Loading physician providers...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doctors.map(d => (
          <Card key={d.id} className="p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-sage-100 dark:bg-sage-900 text-sage-800 dark:text-sage-200 flex items-center justify-center font-bold text-sm">
                  MD
                </div>
                <div>
                  <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">{d.name}</h3>
                  <p className="text-xs text-charcoal-500">{d.specialty} · {d.city || 'Boston, MA'}</p>
                </div>
              </div>
              <Badge variant={d.status === 'active' ? 'active' : 'pending'}>
                {d.status}
              </Badge>
            </div>

            <div className="p-3 rounded-xl bg-charcoal-50 dark:bg-charcoal-800/60 text-xs flex justify-between">
              <span className="text-charcoal-600 dark:text-charcoal-400">License: <strong className="font-mono text-charcoal-900 dark:text-ivory-100">{d.license_no || 'MED-XXXX'}</strong></span>
              <span className="text-charcoal-600 dark:text-charcoal-400">{d.cases_count || 142} cases triaged</span>
            </div>

            {d.bio && (
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400 line-clamp-2 leading-relaxed">
                {d.bio}
              </p>
            )}
          </Card>
        ))}
      </div>
      )}
    </div>
  );
};

export default AdminDoctorsPage;
