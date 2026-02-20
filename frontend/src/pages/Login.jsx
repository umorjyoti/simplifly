import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, handleGoogleSignIn } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleSuccess,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        setGoogleReady(true);
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Render Google button after script is ready and ref is attached
  useEffect(() => {
    if (!googleReady || !googleButtonRef.current || !window.google?.accounts?.id) return;
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'outline',
      size: 'large',
      text: 'sign_in_with',
      width: 280,
      type: 'standard',
    });
  }, [googleReady]);

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) return;
    try {
      const result = await handleGoogleSignIn(credentialResponse.credential);
      if (result.success) navigate('/dashboard');
    } catch (error) {
      console.error('Error during sign in:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row selection:bg-brand-accent selection:text-white">
      {/* Texture Overlay */}
      <div className="texture-overlay"></div>

      {/* Left Side - Visual Narrative */}
      <div className="lg:w-1/2 bg-brand-dark flex flex-col justify-center px-12 sm:px-24 py-20 text-white relative overflow-hidden order-2 lg:order-1">
        <div className="relative z-10">
          <h1 className="text-7xl sm:text-[10vw] font-black uppercase tracking-tighter leading-[0.8] mb-12">
            Access <br />
            The <span className="text-brand-accent">Engine</span>.
          </h1>
          <p className="text-xl font-bold tracking-tight text-white/40 max-w-sm mb-12">
            Professional-grade infrastructure for independent technical operations.
          </p>
          <div className="w-24 h-2 bg-brand-accent"></div>
        </div>

        {/* Decorative Background Block */}
        <div className="absolute -bottom-20 -left-20 w-96 h-96 border-[40px] border-white/[0.03] rotate-45"></div>
      </div>

      {/* Right Side - Form */}
      <div className="lg:w-1/2 flex flex-col justify-center px-6 sm:px-24 py-20 order-1 lg:order-2">
        <div className="max-w-md w-full mx-auto animate-in">
          <div className="mb-16">
            <Link to="/" className="flex items-center group mb-12">
              <div className="w-10 h-10 bg-brand-dark flex items-center justify-center sharp-card group-hover:bg-brand-accent transition-colors">
                <Logo showText={false} size="sm" className="text-white" />
              </div>
              <span className="ml-4 font-black tracking-tighter text-2xl uppercase">Simplifly</span>
            </Link>
            <h2 className="text-4xl font-black uppercase tracking-tighter">Initialize Session</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 sharp-card shadow-none">
                <span className="text-xs font-black uppercase tracking-widest block mb-1">Fatal Error</span>
                <p className="font-bold">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="username" className="block text-xs font-black uppercase tracking-widest text-brand-dark/40">
                Identifier (Username)
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-0 py-4 bg-transparent border-b-2 border-brand-dark focus:border-brand-accent outline-none transition-colors text-xl font-bold placeholder:text-brand-dark/10"
                placeholder="USER_ID"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-xs font-black uppercase tracking-widest text-brand-dark/40">
                Access Token (Password)
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-0 py-4 bg-transparent border-b-2 border-brand-dark focus:border-brand-accent outline-none transition-colors text-xl font-bold placeholder:text-brand-dark/10"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-8 space-y-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-dark text-white py-6 rounded-none text-xl font-black uppercase tracking-widest hover:bg-brand-accent transition-all sharp-card border-none disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Authorize Login —>'}
              </button>

              <div className="relative flex items-center justify-center py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-brand-dark/10"></div>
                </div>
                <div className="relative bg-white px-4 text-[10px] font-black uppercase tracking-[0.4em] text-brand-dark/30">
                  Secure SSO Checkpoint
                </div>
              </div>

              <div className="w-full flex justify-center min-h-[50px]" ref={googleButtonRef} aria-label="Sign in with Google" />
            </div>
          </form>

          <div className="mt-12 pt-12 border-t border-brand-dark/10">
            <p className="text-brand-dark/60 font-bold">
              New Operator?{' '}
              <Link to="/signup" className="text-brand-accent hover:underline underline-offset-4 font-black uppercase tracking-widest text-sm">
                Request Access
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
