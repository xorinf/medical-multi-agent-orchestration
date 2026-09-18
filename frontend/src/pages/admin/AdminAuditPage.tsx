import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { AuditLog } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { Search, RefreshCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const AdminAuditPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filterAction, setFilterAction] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAuditLogs({ limit: 100 });
      setAuditLogs(data);
    } catch (err: any) {
      toast(err?.message || 'Failed to retrieve audit log', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const filtered = filterAction
    ? auditLogs.filter(e => e.action.toLowerCase().includes(filterAction.toLowerCase()))
    : auditLogs;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 dark:text-ivory-100">
              Platform Audit Trail
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300">
              {filtered.length} Events Recorded
            </span>
          </div>
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
            Immutable log of all clinician verifications, triage actions, case claims, and auth tokens
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadLogs} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Refresh Stream
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex gap-3">
          <Input
            placeholder="Filter by action (e.g. login, doctor.approved, case.claimed)..."
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </Card>

      {/* Audit Stream Table */}
      {loading ? (
        <div className="py-16 text-center text-charcoal-500 text-sm">
          <div className="w-6 h-6 border-2 border-sage-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Querying audit log store...
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="No audit events found"
            description="No system records match your filter criteria."
          />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-charcoal-100 dark:divide-charcoal-800">
            {filtered.map(entry => (
              <div key={entry.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-charcoal-50/50 dark:hover:bg-charcoal-800/40 font-mono text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sage-800 dark:text-sage-300">
                      {entry.action}
                    </span>
                    {entry.target && (
                      <span className="text-[11px] text-charcoal-400">
                        → {entry.target.type} ({entry.target.id})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-charcoal-500 font-sans">
                    Actor ID: <span className="font-mono text-charcoal-800 dark:text-charcoal-200">{entry.actor_id || 'system-daemon'}</span> · IP: {entry.ip}
                  </div>
                  {entry.detail && (
                    <div className="text-[10px] text-charcoal-400 bg-charcoal-100/60 dark:bg-charcoal-800/60 p-1.5 rounded-lg">
                      {JSON.stringify(entry.detail)}
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-charcoal-400 shrink-0 font-sans sm:text-right">
                  {new Date(entry.ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminAuditPage;
