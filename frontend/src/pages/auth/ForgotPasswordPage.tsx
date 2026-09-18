import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { illustrations } from '../../assets/illustrations';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your account email');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen flex bg-ivory-100 dark:bg-charcoal-950">
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-sage-700 dark:bg-sage-600 flex items-center justify-center">
              <span className="text-white text-base font-bold">M+</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">MedAssist</h1>
              <p className="text-[10px] font-medium text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Multi-Agent Medical Assistant</p>
            </div>
          </div>

          {!submitted ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100 tracking-tight">Reset password</h2>
                <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">
                  Enter your verified email and we'll transmit a secure reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Account Email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={error}
                  autoFocus
                />

                <Button type="submit" variant="primary" className="w-full" size="lg" isLoading={loading}>
                  Send Password Reset Instructions
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-6 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-sage-100 dark:bg-sage-950/40 text-sage-600 dark:text-sage-400 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-charcoal-900 dark:text-ivory-100 mb-2">Check your inbox</h2>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 max-w-xs mx-auto mb-6">
                If an account exists for <strong className="text-charcoal-900 dark:text-ivory-100">{email}</strong>, a recovery link has been dispatched.
              </p>
              <Button variant="outline" onClick={() => setSubmitted(false)} className="w-full">
                Try another email
              </Button>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-sage-700 dark:text-sage-400 font-medium hover:underline">
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center bg-sage-50 dark:bg-charcoal-900 relative overflow-hidden">
        <img
          src={illustrations.authSecurity}
          alt="MedAssist Account Recovery"
          className="relative z-10 max-w-md w-full h-auto object-contain drop-shadow-xl"
        />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
