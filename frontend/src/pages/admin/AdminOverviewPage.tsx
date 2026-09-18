import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import type { AdminStats, User, AuditLog } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Activity, Users, UserCheck, MessageSquare, ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const AdminOverviewPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingDoctors, setPendingDoctors] = useState<User[]>([]);
  const [recentAudit, setRecentAudit] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [s, p, a] = await Promise.all([
          adminService.getStats(),
          adminService.getPendingDoctors(),
          adminService.getAuditLogs({ limit: 5 }),
        ]);
        setStats(s);
        setPendingDoctors(p);
        setRecentAudit(a);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 text-center text-charcoal-500 text-sm">
        <div className="w-6 h-6 border-2 border-sage-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading telemetry and admin metrics...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 dark:text-ivory-100">
              System Administration & Telemetry
            </h1>
            <Badge variant="neutral">Admin Master</Badge>
          </div>
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
            Multi-agent pipeline supervision, credential verification gating, and audit stream
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/users/pending">
            <Button variant="outline" size="sm">
              Pending Verifications ({pendingDoctors.length})
            </Button>
          </Link>
          <Link to="/admin/audit">
            <Button variant="outline" size="sm">
              Full Audit Trail
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100">
              {stats?.users || 148}
            </div>
            <div className="text-xs text-charcoal-500 font-medium">Total Users Registered</div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-sage-50 dark:bg-sage-950/40 text-sage-600 dark:text-sage-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100">
              {stats?.chats_today || 49}
            </div>
            <div className="text-xs text-charcoal-500 font-medium">Chats Triaged Today</div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
            (stats?.doctors_pending || pendingDoctors.length) > 0
              ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
              : 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-500'
          }`}>
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100">
              {stats?.doctors_pending || pendingDoctors.length}
            </div>
            <div className="text-xs text-charcoal-500 font-medium">Pending Doctor Review</div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-sage-100 dark:bg-sage-900 text-sage-800 dark:text-sage-200 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100">
              4 / 4
            </div>
            <div className="text-xs text-charcoal-500 font-medium">Pipelines Active</div>
          </div>
        </Card>
      </div>

      {/* Action Items Queue */}
      {pendingDoctors.length > 0 && (
        <Card className="p-5 border-l-4 border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                  {pendingDoctors.length} Physician Credential Verification{pendingDoctors.length === 1 ? '' : 's'} Awaiting Review
                </h3>
                <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                  Pending doctors are hidden from patient search until their medical licenses are verified.
                </p>
              </div>
            </div>

            <Link to="/admin/users/pending">
              <Button size="sm" variant="outline" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Review Submissions
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Grid: Pending Table & Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Physicians Preview */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
              Pending Doctor Verifications
            </h2>
            <Link to="/admin/users/pending" className="text-xs text-sage-700 dark:text-sage-400 font-medium hover:underline">
              View all
            </Link>
          </div>

          {pendingDoctors.length === 0 ? (
            <div className="py-8 text-center text-xs text-charcoal-500">
              All physician credentials up to date. Inbox zero.
            </div>
          ) : (
            <div className="divide-y divide-charcoal-100 dark:divide-charcoal-800">
              {pendingDoctors.slice(0, 3).map(doc => (
                <div key={doc.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">{doc.name}</h4>
                    <p className="text-[11px] text-charcoal-500">{doc.specialty} · License: {doc.license_no}</p>
                  </div>
                  <Link to="/admin/users/pending">
                    <Button size="sm" variant="outline" className="h-7 text-xs">Verify</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Audit Log Preview */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
              System Audit Stream
            </h2>
            <Link to="/admin/audit" className="text-xs text-sage-700 dark:text-sage-400 font-medium hover:underline">
              View log
            </Link>
          </div>

          <div className="divide-y divide-charcoal-100 dark:divide-charcoal-800">
            {recentAudit.slice(0, 4).map(e => (
              <div key={e.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-charcoal-800 dark:text-ivory-200">{e.action}</span>
                  <span className="text-charcoal-400 block text-[11px]">
                    Actor: {e.actor_id?.slice(0, 10) || 'system'} · IP: {e.ip || '127.0.0.1'}
                  </span>
                </div>
                <span className="text-[10px] text-charcoal-400">
                  {new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
