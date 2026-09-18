import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../ui/Avatar';
import { Menu, Sun, Moon, Bell, ChevronDown, User as UserIcon, LogOut, Shield, Stethoscope, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { UserRole } from '../../types';

interface NavbarProps {
  onMenuClick: () => void;
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick, title }) => {
  const { user, logout, switchPersona } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const personaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (personaRef.current && !personaRef.current.contains(e.target as Node)) setPersonaOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const personas: { role: UserRole; label: string; icon: React.ReactNode }[] = [
    { role: 'patient', label: 'Patient', icon: <Heart className="w-4 h-4" /> },
    { role: 'doctor', label: 'Doctor', icon: <Stethoscope className="w-4 h-4" /> },
    { role: 'admin', label: 'Admin', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-charcoal-950/80 backdrop-blur-md border-b border-charcoal-200/60 dark:border-charcoal-800 px-4 lg:px-6 h-14 flex items-center gap-4">
      {/* Mobile menu */}
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg text-charcoal-600 dark:text-charcoal-300 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors" aria-label="Open menu">
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      {title && <h2 className="text-sm font-semibold text-charcoal-900 dark:text-ivory-100 hidden sm:block">{title}</h2>}

      <div className="flex-1" />

      {/* Persona switcher (dev convenience) */}
      <div className="relative" ref={personaRef}>
        <button
          onClick={() => setPersonaOpen(!personaOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-dashed border-sage-400 dark:border-sage-700 text-sage-700 dark:text-sage-400 hover:bg-sage-50 dark:hover:bg-sage-900/30 transition-colors"
          title="Switch role persona for testing"
        >
          {user?.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : user?.role === 'doctor' ? <Stethoscope className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline capitalize">{user?.role}</span>
          <ChevronDown className="w-3 h-3" />
        </button>
        {personaOpen && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-700 rounded-xl shadow-elevated py-1 animate-fade-in">
            {personas.map(p => (
              <button
                key={p.role}
                onClick={() => { switchPersona(p.role); setPersonaOpen(false); navigate(p.role === 'admin' ? '/admin' : p.role === 'doctor' ? '/doctor' : '/app'); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm ${user?.role === p.role ? 'bg-sage-50 dark:bg-sage-900/30 text-sage-800 dark:text-sage-300 font-medium' : 'text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-50 dark:hover:bg-charcoal-800'} transition-colors`}
              >
                {p.icon}
                <span>{p.label}</span>
                {user?.role === p.role && <span className="ml-auto text-sage-500">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Theme toggle */}
      <button onClick={toggleTheme} className="p-2 rounded-lg text-charcoal-500 dark:text-charcoal-400 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors" aria-label="Toggle theme">
        {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
      </button>

      {/* Notifications */}
      <button className="relative p-2 rounded-lg text-charcoal-500 dark:text-charcoal-400 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors" aria-label="Notifications">
        <Bell className="w-[18px] h-[18px]" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sage-600 dark:bg-sage-500" />
      </button>

      {/* Profile menu */}
      <div className="relative" ref={profileRef}>
        <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-charcoal-100/60 dark:hover:bg-charcoal-800/60 transition-colors">
          <Avatar name={user?.name || 'User'} size="sm" />
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-charcoal-800 dark:text-ivory-100 truncate max-w-[120px]">{user?.name}</p>
            <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 capitalize">{user?.role}</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-charcoal-400 hidden md:block" />
        </button>

        {profileOpen && (
          <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-700 rounded-xl shadow-elevated py-1 animate-fade-in">
            <div className="px-3 py-2.5 border-b border-charcoal-100 dark:border-charcoal-800">
              <p className="text-sm font-semibold text-charcoal-900 dark:text-ivory-100 truncate">{user?.name}</p>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => { setProfileOpen(false); navigate(user?.role === 'admin' ? '/admin' : user?.role === 'doctor' ? '/doctor/profile' : '/app/profile'); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-50 dark:hover:bg-charcoal-800 transition-colors"
            >
              <UserIcon className="w-4 h-4" /> Profile
            </button>
            <button onClick={() => { setProfileOpen(false); handleLogout(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
