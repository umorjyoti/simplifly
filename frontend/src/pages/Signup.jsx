import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, handleGoogleSignIn } = useAuth();
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
      text: 'signup_with',
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const result = await signup(
      formData.username,
      formData.password,
      formData.email,
      formData.name
    );

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

      {/* Left Side - Form Area */}
      <div className="lg:w-7/12 flex flex-col justify-center px-6 sm:px-24 py-20">
        <div className="max-w-xl w-full mx-auto animate-in">
          <div className="mb-16">
            <Link to="/" className="flex items-center group mb-12">
              <div className="w-10 h-10 bg-brand-dark flex items-center justify-center sharp-card group-hover:bg-brand-accent transition-colors">
                <Logo showText={false} size="sm" className="text-white" />
              </div>
              <span className="ml-4 font-black tracking-tighter text-2xl uppercase">Simplifly</span>
            </Link>
            <h2 className="text-6xl font-black uppercase tracking-tighter leading-none">Register <br />Environment</h2>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {error && (
              <div className="md:col-span-2 bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 sharp-card shadow-none mb-4">
                <span className="text-xs font-black uppercase tracking-widest block mb-1">Initialization Failure</span>
                <p className="font-bold">{error}</p>
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="name" className="block text-[10px] font-black uppercase tracking-[0.3em] text-brand-dark/40">
                Operator Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-0 py-4 bg-transparent border-b-2 border-brand-dark focus:border-brand-accent outline-none transition-colors text-xl font-bold"
                placeholder="FULL_NAME"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="block text-[10px] font-black uppercase tracking-[0.3em] text-brand-dark/40">
                Identity Handle *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-0 py-4 bg-transparent border-b-2 border-brand-dark focus:border-brand-accent outline-none transition-colors text-xl font-bold"
                placeholder="@handle"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-[0.3em] text-brand-dark/40">
                Contact Endpoint
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-0 py-4 bg-transparent border-b-2 border-brand-dark focus:border-brand-accent outline-none transition-colors text-xl font-bold"
                placeholder="email@domain.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-[0.3em] text-brand-dark/40">
                Security Key *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-0 py-4 bg-transparent border-b-2 border-brand-dark focus:border-brand-accent outline-none transition-colors text-xl font-bold"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-[10px] font-black uppercase tracking-[0.3em] text-brand-dark/40">
                Verify Key *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-0 py-4 bg-transparent border-b-2 border-brand-dark focus:border-brand-accent outline-none transition-colors text-xl font-bold"
                placeholder="••••••••"
              />
            </div>

            <div className="md:col-span-2 pt-8 space-y-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-dark text-white py-8 rounded-none text-2xl font-black uppercase tracking-[0.2em] hover:bg-brand-accent transition-all sharp-card border-none disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Provision Account —>'}
              </button>

              <div className="relative flex items-center justify-center py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-brand-dark/10"></div>
                </div>
                <div className="relative bg-white px-4 text-[10px] font-black uppercase tracking-[0.4em] text-brand-dark/30">
                  Federated Provider Checkpoint
                </div>
              </div>

              <div className="w-full flex justify-center min-h-[50px]" ref={googleButtonRef} aria-label="Sign up with Google" />
            </div>
          </form>

          <div className="mt-12 pt-12 border-t border-brand-dark/10">
            <p className="text-brand-dark/60 font-bold">
              Existing Operator?{' '}
              <Link to="/login" className="text-brand-accent hover:underline underline-offset-4 font-black uppercase tracking-widest text-sm">
                Authenticate Session
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Branding Sidepanel */}
      <div className="lg:w-5/12 bg-brand-accent flex flex-col justify-end p-12 sm:p-24 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="text-[15vw] font-black uppercase tracking-tighter leading-none opacity-20 mb-8 select-none">
            GENISYS
          </div>
          <h3 className="text-4xl font-black uppercase tracking-tighter mb-4">Phase 1.0 Deployment</h3>
          <p className="text-xl font-bold opacity-80 max-w-xs">
            Join the new standard of technical freelance infrastructure.
          </p>
        </div>

        {/* Decorative Lines */}
        <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
          <div className="absolute top-1/4 left-0 w-full h-px bg-white/20"></div>
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/20"></div>
          <div className="absolute top-3/4 left-0 w-full h-px bg-white/20"></div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
