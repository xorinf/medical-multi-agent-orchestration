import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { illustrations } from '../../assets/illustrations';
import { Mail, Lock, User, Stethoscope, FileText, MapPin, ArrowRight, Eye, EyeOff } from 'lucide-react';
import type { UserRole } from '../../types';

export const RegisterPage: React.FC = () => {
  const [role, setRole] = useState<UserRole>('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [specialty, setSpecialty] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Full name is required'); return; }
    if (!email.trim()) { setError('Email is required'); return; }
    if (!password || password.length < 8) { setError('Password must be at least 8 characters'); return; }

    if (role === 'doctor') {
      if (!licenseNo.trim()) { setError('Medical license number is required for doctor verification'); return; }
      if (!specialty.trim()) { setError('Medical specialty is required'); return; }
    }

    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        role,
        specialty: role === 'doctor' ? specialty : undefined,
        license_no: role === 'doctor' ? licenseNo : undefined,
        city: role === 'doctor' ? city : undefined,
      });

      if (role === 'doctor') {
        toast('Doctor registration submitted! Status: Pending verification.', 'info', 6000);
        navigate('/onboarding');
      } else {
        toast('Account created successfully! Welcome to MedAssist.', 'success');
        navigate('/app');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-ivory-100 dark:bg-charcoal-950">
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-sage-700 dark:bg-sage-600 flex items-center justify-center">
              <span className="text-white text-base font-bold">M+</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">MedAssist</h1>
              <p className="text-[10px] font-medium text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Multi-Agent Medical Assistant</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100 tracking-tight">Create your account</h2>
            <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">Join the evidence-based clinical platform</p>
          </div>

          {/* Role selector tabs */}
          <div className="mb-6 p-1 bg-charcoal-100/80 dark:bg-charcoal-800 rounded-xl flex gap-1">
            <button
              type="button"
              onClick={() => setRole('patient')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                role === 'patient'
                  ? 'bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 shadow-soft'
                  : 'text-charcoal-500 dark:text-charcoal-400 hover:text-charcoal-800'
              }`}
            >
              Patient Account
            </button>
            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                role === 'doctor'
                  ? 'bg-white dark:bg-charcoal-900 text-sage-800 dark:text-sage-300 shadow-soft'
                  : 'text-charcoal-500 dark:text-charcoal-400 hover:text-charcoal-800'
              }`}
            >
              Doctor / Physician
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={role === 'doctor' ? 'Dr. Jane Doe, MD' : 'Jane Doe'}
              leftIcon={<User className="w-4 h-4" />}
              autoComplete="name"
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@domain.com"
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
            />

            <Input
              label="Password (min. 8 characters)"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="cursor-pointer" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              autoComplete="new-password"
            />

            {role === 'doctor' && (
              <div className="space-y-4 pt-2 border-t border-charcoal-200/60 dark:border-charcoal-800">
                <Input
                  label="Primary Medical Specialty"
                  value={specialty}
                  onChange={e => setSpecialty(e.target.value)}
                  placeholder="e.g. Neurology, Pulmonology, Dermatology"
                  leftIcon={<Stethoscope className="w-4 h-4" />}
                />

                <Input
                  label="Medical License / Board ID"
                  value={licenseNo}
                  onChange={e => setLicenseNo(e.target.value)}
                  placeholder="e.g. MED-89410-STATE"
                  leftIcon={<FileText className="w-4 h-4" />}
                  helperText="Required for physician queue credential verification"
                />

                <Input
                  label="Practice City & State"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="e.g. Boston, MA"
                  leftIcon={<MapPin className="w-4 h-4" />}
                />
              </div>
            )}

            {error && <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>}

            <Button
              type="submit"
              variant={role === 'doctor' ? 'sage' : 'primary'}
              className="w-full mt-2"
              size="lg"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {role === 'doctor' ? 'Submit Doctor Application' : 'Create Patient Account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-charcoal-500 dark:text-charcoal-400">
            Already have an account?{' '}
            <Link to="/login" className="text-sage-700 dark:text-sage-400 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right: Illustration */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-sage-50 dark:bg-charcoal-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sage-100/40 to-cream-100/30 dark:from-sage-900/20 dark:to-charcoal-900" />
        <img
          src={illustrations.authRegister}
          alt="MedAssist Platform Registration"
          className="relative z-10 max-w-md w-full h-auto object-contain drop-shadow-xl"
        />
        <div className="absolute bottom-8 left-8 right-8 z-20">
          <div className="bg-white/90 dark:bg-charcoal-800/90 backdrop-blur-sm rounded-2xl p-5 border border-charcoal-200/40 dark:border-charcoal-700">
            <p className="text-sm font-semibold text-charcoal-900 dark:text-ivory-100 mb-1">
              {role === 'doctor' ? 'Physician & Clinical Portal' : 'Patient-Centered Intelligence'}
            </p>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
              {role === 'doctor'
                ? 'Get automated case triage, PubMed-backed daily digests, and seamless multimodal consultations.'
                : 'Communicate symptoms, analyze diagnostic imaging, and schedule with board-certified physicians.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
