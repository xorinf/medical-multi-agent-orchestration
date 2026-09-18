import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { apiClient } from '../../services/api';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'verifying' | 'success' | 'pending' | 'error'>(token ? 'verifying' : 'pending');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (token) {
      apiClient('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      })
        .then(() => setStatus('success'))
        .catch(err => {
          setStatus('error');
          setErrorMsg(err?.message || 'Verification link is invalid or expired.');
        });
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ivory-100 dark:bg-charcoal-950">
      <Card className="w-full max-w-md text-center py-10 px-8">
        <div className="w-10 h-10 rounded-xl bg-sage-700 dark:bg-sage-600 flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-base font-bold">M+</span>
        </div>

        {status === 'pending' && (
          <div>
            <h1 className="text-xl font-bold text-charcoal-900 dark:text-ivory-100 mb-2">Check your email</h1>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-6">
              A verification dispatch was transmitted to your address. Click the contained link to activate full clinical capabilities.
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full">Return to Sign In</Button>
            </Link>
          </div>
        )}

        {status === 'verifying' && (
          <div>
            <div className="w-10 h-10 border-2 border-sage-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-charcoal-900 dark:text-ivory-100 mb-2">Verifying Token</h1>
            <p className="text-sm text-charcoal-500">Validating cryptographic email signature...</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="w-14 h-14 rounded-full bg-sage-100 dark:bg-sage-950/40 text-sage-600 dark:text-sage-400 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-charcoal-900 dark:text-ivory-100 mb-2">Email Verified</h1>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-6">
              Your email credentials have been securely verified. You can now access your account.
            </p>
            <Link to="/login">
              <Button variant="primary" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Proceed to Login
              </Button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-charcoal-900 dark:text-ivory-100 mb-2">Verification Failed</h1>
            <p className="text-sm text-red-600 dark:text-red-400 mb-6">{errorMsg}</p>
            <Link to="/login">
              <Button variant="outline" className="w-full">Back to Login</Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
