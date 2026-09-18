import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home, MessageSquare, Search, Calendar, Mail, User as UserIcon,
  LayoutDashboard, Users, ClipboardList, Stethoscope, Settings,
  Bell, FileText, ChevronLeft, ChevronRight, Activity,
  BookOpen, UserCheck, LogOut, X
} from 'lucide-react';

const patientNav = [
  { to: '/app', icon: Home, label: 'Home' },
  { to: '/app/chat', icon: MessageSquare, label: 'AI Chat' },
  { to: '/app/doctors', icon: Search, label: 'Find Doctor' },
  { to: '/app/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/app/messages', icon: Mail, label: 'Messages' },
  { to: '/app/profile', icon: UserIcon, label: 'Profile' },
];

const doctorNav = [
  { to: '/doctor', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/doctor/queue', icon: ClipboardList, label: 'Patient Queue' },
  { to: '/doctor/curator', icon: BookOpen, label: 'Daily Curator' },
  { to: '/doctor/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/doctor/patients', icon: Users, label: 'Patients' },
  { to: '/doctor/messages', icon: Mail, label: 'Messages' },
  { to: '/doctor/profile', icon: Stethoscope, label: 'Profile' },
];

const adminNav = [
  { to: '/admin', icon: Activity, label: 'Overview' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/users/pending', icon: UserCheck, label: 'Pending Users' },
  { to: '/admin/doctors', icon: Stethoscope, label: 'Doctors' },
  { to: '/admin/patients', icon: UserIcon, label: 'Patients' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/admin/audit', icon: FileText, label: 'Audit Logs' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = user?.role === 'admin' ? adminNav : user?.role === 'doctor' ? doctorNav : patientNav;

  const roleLabel = user?.role === 'admin' ? 'Administration' : user?.role === 'doctor' ? 'Clinical Portal' : 'Patient Portal';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={`flex items-center gap-3 px-5 py-5 border-b border-charcoal-200/50 dark:border-charcoal-800 ${collapsed ? 'justify-center px-3' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-sage-700 dark:bg-sage-600 flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-bold">M+</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 truncate leading-tight">MedAssist</h1>
            <p className="text-[10px] font-medium text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider truncate">{roleLabel}</p>
          </div>
        )}
        {/* Mobile close */}
        <button onClick={onMobileClose} className="lg:hidden ml-auto p-1.5 rounded-lg text-charcoal-400 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors" aria-label="Close menu">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/app' || item.to === '/doctor' || item.to === '/admin'}
            onClick={onMobileClose}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
              ${collapsed ? 'justify-center px-2' : ''}
              ${isActive
                ? 'bg-sage-100 dark:bg-sage-900/40 text-sage-800 dark:text-sage-300'
                : 'text-charcoal-600 dark:text-charcoal-400 hover:bg-charcoal-100/60 dark:hover:bg-charcoal-800/60 hover:text-charcoal-900 dark:hover:text-ivory-100'
              }
            `}
          >
            <item.icon className="w-[18px] h-[18px] shrink-0 stroke-[1.7]" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={`px-3 py-3 border-t border-charcoal-200/50 dark:border-charcoal-800 space-y-1 ${collapsed ? 'items-center' : ''}`}>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-charcoal-500 dark:text-charcoal-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-400 transition-all duration-150 ${collapsed ? 'justify-center px-2' : ''}`}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0 stroke-[1.7]" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center py-2.5 border-t border-charcoal-200/50 dark:border-charcoal-800 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-charcoal-200 transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50 backdrop-blur-sm lg:hidden" onClick={onMobileClose} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full bg-white dark:bg-charcoal-950 border-r border-charcoal-200/70 dark:border-charcoal-800
        transition-all duration-200 ease-in-out flex flex-col
        ${collapsed ? 'lg:w-[68px]' : 'lg:w-60'}
        ${mobileOpen ? 'w-72 translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {sidebarContent}
      </aside>
    </>
  );
};
