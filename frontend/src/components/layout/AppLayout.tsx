import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

interface AppLayoutProps {
  title?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ title }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ivory-100 dark:bg-charcoal-950">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      <div className="lg:ml-60 flex flex-col min-h-screen transition-all duration-200">
        <Navbar onMenuClick={() => setMobileMenuOpen(true)} title={title} />

        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
