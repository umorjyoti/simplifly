import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import { initRevealObserver } from '../utils/reveal';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    return initRevealObserver();
  }, [children]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white selection:bg-brand-accent selection:text-white">
      {/* Dynamic Nav Container */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-8 flex justify-between items-center pointer-events-none">
        <div className="reveal stagger-1 pointer-events-auto">
          <Link to="/dashboard" className="flex items-center group">
            <div className="w-10 h-10 bg-brand-dark flex items-center justify-center sharp-card group-hover:bg-brand-accent transition-colors">
              <Logo showText={false} size="sm" className="text-white" />
            </div>
            <span className="ml-4 font-black tracking-tighter text-2xl uppercase group-hover:text-brand-accent transition-colors">Simplifly</span>
          </Link>
        </div>

        <div className="reveal stagger-2 pointer-events-auto">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-12 h-12 flex flex-col items-center justify-center gap-1.5 focus:outline-none group"
            aria-label="Toggle menu"
          >
            <div className={`h-0.5 bg-brand-dark transition-all duration-300 ${mobileMenuOpen ? 'w-8 rotate-45 translate-y-1' : 'w-8'}`}></div>
            <div className={`h-0.5 bg-brand-dark transition-all duration-300 ${mobileMenuOpen ? 'w-0 opacity-0' : 'w-6'}`}></div>
            <div className={`h-0.5 bg-brand-dark transition-all duration-300 ${mobileMenuOpen ? 'w-8 -rotate-45 -translate-y-1' : 'w-8'}`}></div>
          </button>
        </div>
      </nav>

      {/* Full-screen Navigation Overlay */}
      <div className={`fixed inset-0 z-40 bg-brand-dark transition-all duration-500 cubic-bezier(0.19, 1, 0.22, 1) ${mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="h-full flex flex-col justify-center px-12 sm:px-24">
          <nav className="flex flex-col gap-8">
            {[
              { label: 'Workspaces', path: '/dashboard' },
              { label: 'My Team', path: '/my-team' },
              { label: 'Profile', path: '/profile' },
              ...(user?.role === 'super-admin' ? [{ label: 'Super Admin', path: '/superadmin' }] : []),
            ].map((link, idx) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-white text-5xl sm:text-7xl font-black uppercase tracking-tighter hover:text-brand-accent transition-colors stagger-${idx + 1}`}
              >
                {link.label}
              </Link>
            ))}

            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="text-white/40 text-2xl font-bold uppercase tracking-widest text-left hover:text-red-500 transition-colors mt-12"
            >
              Sign Out —&gt;
            </button>
          </nav>

          <div className="absolute bottom-12 left-12 sm:left-24">
            <div className="text-white/20 text-sm font-mono tracking-widest uppercase">
              Authenticated as: {user?.name || user?.username}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Asymmetric Staggered Reveal */}
      <main className="pt-32 pb-12 px-6 sm:px-12 max-w-[1600px] mx-auto bg-white min-h-screen">
        <div className="reveal visible stagger-3">
          {children}
        </div>
      </main>

      {/* Decorative Border Frame */}
      <div className="fixed inset-0 pointer-events-none border-[12px] border-white z-[60]"></div>
      <div className="fixed top-0 left-12 h-screen w-px bg-brand-dark/5 z-[60] hidden lg:block"></div>
    </div>
  );
};

export default Layout;
