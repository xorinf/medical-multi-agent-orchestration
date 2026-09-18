import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { User } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Search, RefreshCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const AdminUsersPage: React.FC = () => {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers({
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        q: searchQuery || undefined,
      });
      setUsersList(data);
    } catch (err: any) {
      toast(err?.message || 'Failed to fetch users list', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (user: User) => {
    const isSuspended = user.status === 'suspended';
    const action = isSuspended ? 'reactivate' : 'suspend';
    const reason = window.prompt(`Reason to ${action} user ${user.name}?`);
    if (!reason) return;

    try {
      await adminService.suspendUser(user.id, reason);
      toast(`User ${user.name} has been ${isSuspended ? 'reactivated' : 'suspended'}`, 'success');
      await loadUsers();
    } catch (err: any) {
      toast(err?.message || 'Failed to update user status', 'danger');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 dark:text-ivory-100">
            User Accounts & Permissions
          </h1>
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
            Inspect role assignments, account statuses, and manage suspensions
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadUsers} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Refresh List
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, or license..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadUsers()}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-charcoal-50 dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 text-xs font-semibold text-charcoal-800 dark:text-ivory-200"
          >
            <option value="">All Roles</option>
            <option value="patient">Patients</option>
            <option value="doctor">Doctors</option>
            <option value="admin">Administrators</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-charcoal-50 dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 text-xs font-semibold text-charcoal-800 dark:text-ivory-200"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="suspended">Suspended</option>
          </select>

          <Button variant="primary" onClick={loadUsers}>
            Apply
          </Button>
        </div>
      </Card>

      {/* Users Table */}
      {loading ? (
        <div className="py-16 text-center text-charcoal-500 text-sm">
          <div className="w-6 h-6 border-2 border-sage-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading user records...
        </div>
      ) : usersList.length === 0 ? (
        <Card>
          <EmptyState
            title="No users match filter criteria"
            description="Adjust search parameters or clear filters."
          />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-charcoal-100 dark:divide-charcoal-800">
            {usersList.map(u => (
              <div key={u.id} className="p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-charcoal-50/50 dark:hover:bg-charcoal-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-800 dark:text-ivory-200 flex items-center justify-center font-bold text-xs shrink-0">
                    {u.name.split(' ')[0][0]}{u.name.split(' ')[1]?.[0] || ''}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">{u.name}</h4>
                      <Badge variant={u.role === 'admin' ? 'admin' : u.role === 'doctor' ? 'doctor' : 'patient'} size="sm">
                        {u.role}
                      </Badge>
                      <Badge variant={u.status === 'active' ? 'active' : u.status === 'pending_verification' ? 'pending' : 'suspended'} size="sm">
                        {u.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-charcoal-500">{u.email}{u.specialty ? ` · ${u.specialty}` : ''}</p>
                  </div>
                </div>

                <div className="sm:self-center">
                  {u.role !== 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuspend(u)}
                      className={u.status === 'suspended' ? 'text-sage-700' : 'text-red-600'}
                    >
                      {u.status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminUsersPage;
