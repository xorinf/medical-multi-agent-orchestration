import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { User } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { CheckCircle2, XCircle, FileText } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const AdminPendingPage: React.FC = () => {
  const [pendingList, setPendingList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    setLoading(true);
    try {
      const docs = await adminService.getPendingDoctors();
      setPendingList(docs);
    } catch (err: any) {
      toast(err?.message || 'Failed to load pending verifications', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string, decision: 'approve' | 'reject') => {
    let reason = '';
    if (decision === 'reject') {
      const promptReason = window.prompt('Specify reason for license rejection:');
      if (promptReason === null) return;
      reason = promptReason;
    }

    setActingId(id);
    try {
      await adminService.verifyDoctor(id, decision, reason);
      toast(`Physician credentials marked as ${decision === 'approve' ? 'Approved' : 'Rejected'}`, 'success');
      await loadPending();
    } catch (err: any) {
      toast(err?.message || 'Verification update failed', 'danger');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 dark:text-ivory-100">
          Physician Verification Queue
        </h1>
        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
          Review medical board license credentials before granting patient directory visibility
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-charcoal-500 text-sm">
          <div className="w-6 h-6 border-2 border-sage-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading pending physician credentials...
        </div>
      ) : pendingList.length === 0 ? (
        <Card>
          <EmptyState
            title="No pending verifications"
            description="All registered doctors have been evaluated and verified."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingList.map(doc => (
            <Card key={doc.id} className="p-6 space-y-4 border-l-4 border-l-amber-500">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-sm shrink-0">
                    MD
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                      {doc.name}
                    </h3>
                    <p className="text-xs text-charcoal-500">{doc.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-sage-800 dark:text-sage-300">
                        {doc.specialty || 'General Medicine'}
                      </span>
                      {doc.city && <span className="text-xs text-charcoal-400">· {doc.city}</span>}
                    </div>
                  </div>
                </div>

                <Badge variant="pending">Pending Board Review</Badge>
              </div>

              {/* License Card */}
              <div className="p-3.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-800/60 border border-charcoal-200/60 dark:border-charcoal-700/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-charcoal-500" />
                  <span className="text-charcoal-600 dark:text-charcoal-300 font-medium">
                    Medical License #: <strong className="font-mono text-charcoal-900 dark:text-ivory-100">{doc.license_no || 'MED-55092-DERM'}</strong>
                  </span>
                </div>
                <span className="text-charcoal-400 text-[11px]">Submitted {new Date().toLocaleDateString()}</span>
              </div>

              {doc.bio && (
                <p className="text-xs text-charcoal-600 dark:text-charcoal-400 leading-relaxed italic">
                  "{doc.bio}"
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-charcoal-100 dark:border-charcoal-800">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleVerify(doc.id, 'reject')}
                  isLoading={actingId === doc.id}
                  leftIcon={<XCircle className="w-3.5 h-3.5" />}
                >
                  Reject Application
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleVerify(doc.id, 'approve')}
                  isLoading={actingId === doc.id}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Approve Credentials
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPendingPage;
