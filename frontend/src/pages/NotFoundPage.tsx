import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ivory-100 dark:bg-charcoal-950">
      <Card className="max-w-md w-full text-center py-12 px-6 space-y-4">
        <span className="text-4xl font-bold font-mono text-sage-600 dark:text-sage-400">404</span>
        <h1 className="text-xl font-bold text-charcoal-900 dark:text-ivory-100">
          Screen Not Found
        </h1>
        <p className="text-xs text-charcoal-500 max-w-xs mx-auto">
          The requested clinical destination could not be located or has been archived.
        </p>
        <div className="pt-2">
          <Link to="/">
            <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
              Return Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ivory-100 dark:bg-charcoal-950">
      <Card className="max-w-md w-full text-center py-12 px-6 space-y-4">
        <span className="text-4xl font-bold text-red-500">403</span>
        <h1 className="text-xl font-bold text-charcoal-900 dark:text-ivory-100">
          Access Restricted
        </h1>
        <p className="text-xs text-charcoal-500 max-w-xs mx-auto">
          Your active account role lacks clearance for this specialized portal area.
        </p>
        <div className="pt-2">
          <Link to="/">
            <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Authorized Portal
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default NotFoundPage;
