import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { illustrations } from '../../assets/illustrations';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Email is required'); return; }
    if (!password) { setError('Password is required'); return; }

    setLoading(true);
    try {
      await login(email, password);
      toast('Signed in successfully', 'success');
      // Navigate based on role
      const user = JSON.parse(localStorage.getItem('medassist_user') || '{}');
      const dest = from || (user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor' : '/app');
      navigate(dest, { replace: true });
    } catch (err: any) {
      const msg = err?.data?.error === 'account_pending_verification'
        ? 'Your account is pending verification by an administrator.'
        : err?.data?.error === 'account_suspended'
        ? 'This account has been suspended.'
        : err?.message || 'Invalid email or password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (role: 'patient' | 'doctor' | 'admin') => {
    const emails: Record<string, string> = {
      patient: 'patient@medassist.local',
      doctor: 'doctor@medassist.local',
      admin: 'admin@medassist.local',
    };
    setEmail(emails[role]);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex bg-ivory-100 dark:bg-charcoal-950">
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-sage-700 dark:bg-sage-600 flex items-center justify-center">
              <span className="text-white text-base font-bold">M+</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">MedAssist</h1>
              <p className="text-[10px] font-medium text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Multi-Agent Medical Assistant</p>
            </div>
          </div>

          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100 tracking-tight">Welcome back</h2>
            <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">Sign in to access your healthcare portal</p>
          </div>

          {location.search.includes('expired') && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
              Your session has expired. Please sign in again.
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              error={error && !password ? error : undefined}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="cursor-pointer" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              autoComplete="current-password"
            />

            {error && <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-charcoal-600 dark:text-charcoal-400">
                <input type="checkbox" className="rounded border-charcoal-300 dark:border-charcoal-600 text-sage-600 focus:ring-sage-500" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sage-700 dark:text-sage-400 font-medium hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" className="w-full" size="lg" isLoading={loading} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Sign In
            </Button>
          </form>

          {/* Quick login */}
          <div className="mt-6 pt-5 border-t border-charcoal-200/60 dark:border-charcoal-800">
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-3 font-medium">Quick access for testing:</p>
            <div className="flex gap-2">
              <button onClick={() => quickLogin('patient')} className="flex-1 py-2 px-3 text-xs font-medium rounded-lg border border-charcoal-200 dark:border-charcoal-700 text-charcoal-700 dark:text-charcoal-300 hover:bg-cream-50 dark:hover:bg-charcoal-800 transition-colors">Patient</button>
              <button onClick={() => quickLogin('doctor')} className="flex-1 py-2 px-3 text-xs font-medium rounded-lg border border-charcoal-200 dark:border-charcoal-700 text-charcoal-700 dark:text-charcoal-300 hover:bg-sage-50 dark:hover:bg-charcoal-800 transition-colors">Doctor</button>
              <button onClick={() => quickLogin('admin')} className="flex-1 py-2 px-3 text-xs font-medium rounded-lg border border-charcoal-200 dark:border-charcoal-700 text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-50 dark:hover:bg-charcoal-800 transition-colors">Admin</button>
            </div>
          </div>

          {/* Register link */}
          <p className="mt-8 text-center text-sm text-charcoal-500 dark:text-charcoal-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-sage-700 dark:text-sage-400 font-semibold hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>

      {/* Right: Illustration */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-sage-50 dark:bg-charcoal-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sage-100/40 to-cream-100/30 dark:from-sage-900/20 dark:to-charcoal-900" />
        <img
          src={illustrations.authAssistant}
          alt="AI Medical Assistant"
          className="relative z-10 max-w-md w-full h-auto object-contain drop-shadow-xl"
        />
        <div className="absolute bottom-8 left-8 right-8 z-20">
          <div className="bg-white/90 dark:bg-charcoal-800/90 backdrop-blur-sm rounded-2xl p-5 border border-charcoal-200/40 dark:border-charcoal-700">
            <p className="text-sm font-semibold text-charcoal-900 dark:text-ivory-100 mb-1">AI-Powered Clinical Triage</p>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400">Multi-agent orchestration combining RAG retrieval, computer vision diagnostics, and evidence-based medical reasoning.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
