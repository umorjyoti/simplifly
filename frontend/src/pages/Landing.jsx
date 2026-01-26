import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import AntigravityBackground from '../components/AntigravityBackground';

const Landing = () => {
  const navigate = useNavigate();
  const { handleGoogleSignIn } = useAuth();
  const googleButtonRef = useRef(null);
  const [revealed, setRevealed] = useState({});

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

        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'sign_in_with',
            width: 280,
            type: 'standard',
          });
        }
      }
    };
    document.body.appendChild(script);

    // Intersection Observer for Reveal Animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setRevealed((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) return;
    try {
      const result = await handleGoogleSignIn(credentialResponse.credential);
      if (result.success) navigate('/dashboard');
    } catch (error) {
      console.error('Error during sign in:', error);
    }
  };

  const triggerGoogleSignIn = () => {
    const googleButton = googleButtonRef.current?.querySelector('div[role="button"]');
    if (googleButton) googleButton.click();
  };

  return (
    <div className="min-h-screen bg-white selection:bg-brand-accent selection:text-white overflow-x-hidden">
      {/* Texture Overlay */}
      <div className="texture-overlay"></div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full p-8 flex justify-between items-center z-50 mix-blend-difference text-white">
        <Link to="/" className="flex items-center group">
          <div className="w-8 h-8 bg-white flex items-center justify-center sharp-card group-hover:bg-brand-accent transition-colors">
            <Logo showText={false} size="sm" className="text-brand-dark" />
          </div>
          <span className="ml-4 font-black tracking-tighter text-xl uppercase">Simplifly</span>
        </Link>
        <div className="flex gap-8 font-black uppercase text-xs tracking-[0.3em]">
          <button onClick={() => navigate('/login')} className="hover:text-brand-accent transition-colors">Authorize Access —&gt;</button>
        </div>
      </nav>

      {/* Hero Section - Massive Typographic Reveal */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 py-32 overflow-hidden border-b-[20px] border-brand-dark">
        <AntigravityBackground />

        <div className="relative z-10 max-w-[1200px]">
          <div id="hero-title" className={`reveal ${revealed['hero-title'] ? 'visible' : ''}`}>
            <h1 className="text-[12vw] sm:text-[15vw] font-black uppercase tracking-tighter leading-[0.75] text-brand-dark">
              Track<br />
              <span className="text-brand-accent">Bill</span><br />
              Scale<span className="text-brand-accent underline decoration-[20px] underline-offset-[20px]">.</span>
            </h1>
          </div>

          <div id="hero-sub" className={`mt-20 max-w-xl reveal stagger-2 ${revealed['hero-sub'] ? 'visible' : ''}`}>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-dark leading-tight mb-12">
              High-performance engine for independent professionals.
              Zero fluff. Zero latency. Pure surgical billing.
            </p>
            <div className="flex flex-wrap gap-6">
              <button onClick={() => navigate('/signup')} className="btn-brand-accent px-10 py-5 text-xl uppercase tracking-widest font-black">
                Initialize Beta — Free
              </button>
              <div ref={googleButtonRef} className="opacity-0 absolute pointer-events-none"></div>
            </div>
          </div>
        </div>

        {/* Decorative Background Text */}
        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 rotate-90 hidden lg:block">
          <span className="text-[20vh] font-black uppercase tracking-tighter text-brand-dark/[0.02] whitespace-nowrap">
            PREMIUM FREELANCE FRAMEWORK — V1.0.0
          </span>
        </div>
      </section>

      {/* Feature Section - Asymmetric Grid Breaking */}
      <section className="py-32 px-6 sm:px-12 max-w-[1600px] mx-auto border-x border-brand-dark/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            <div id="f1" className={`sharp-card p-12 bg-brand-dark text-white reveal ${revealed['f1'] ? 'visible' : ''}`}>
              <span className="text-xs font-black tracking-[0.4em] uppercase text-brand-accent mb-8 block">01 / LOGGING ENGINE</span>
              <h3 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter mb-8 leading-none">
                Capture the <br />Unseen Hours.
              </h3>
              <p className="text-xl font-medium text-white/60 max-w-lg leading-relaxed">
                Most freelancers leak 30% of revenue to "small tasks". Our high-speed logging environment captures every billable second with zero overhead.
              </p>
            </div>
          </div>

          <div className="lg:col-span-4 self-center">
            <div id="f2" className={`reveal stagger-1 ${revealed['f2'] ? 'visible' : ''}`}>
              <div className="text-8xl font-black text-brand-dark/10 mb-4 leading-none">0.0S</div>
              <h4 className="text-2xl font-black uppercase tracking-tighter mb-4">Latency Bill Gen</h4>
              <p className="font-medium text-brand-dark/60">
                Instantly audit work cycles and generate print-ready technical billing documentation.
              </p>
            </div>
          </div>

          <div className="lg:col-span-12 mt-12">
            <div id="f3" className={`sharp-card p-12 bg-brand-accent text-white reveal ${revealed['f3'] ? 'visible' : ''}`}>
              <div className="flex flex-col md:flex-row justify-between items-end gap-12">
                <div className="max-w-2xl">
                  <span className="text-xs font-black tracking-[0.4em] uppercase text-white/50 mb-8 block">02 / CORE SCALABILITY</span>
                  <h3 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter leading-[0.8] mb-8">
                    Team Integration <br />By Default.
                  </h3>
                  <p className="text-xl font-medium text-white/80 leading-relaxed">
                    Built for individuals, optimized for agencies. Scale from 1 to 100 collaborators with the same technical precision.
                  </p>
                </div>
                <button onClick={() => navigate('/signup')} className="bg-white text-brand-accent px-12 py-6 text-xl font-black uppercase tracking-widest hover:bg-brand-dark hover:text-white transition-all sharp-card border-none">
                  Scale Now —&gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The System Section */}
      <section className="bg-brand-dark py-40 px-6 sm:px-12 text-white overflow-hidden relative">
        <div className="max-w-[1200px] mx-auto">
          <div id="system" className={`reveal ${revealed['system'] ? 'visible' : ''}`}>
            <h2 className="text-[10vw] font-black uppercase tracking-tighter leading-none mb-24 opacity-20">
              The System<span className="text-brand-accent">.</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
              {[
                { n: '01', t: 'Initialize', d: 'Spin up dedicated workspace environments for each operational cycle.' },
                { n: '02', t: 'Execute', d: 'Track deployment logic with surgical precision. Real-time logging.' },
                { n: '03', t: 'Finalize', d: 'One-click audit. Instant billing. Professional-grade output.' }
              ].map((step, idx) => (
                <div key={step.n} className={`reveal stagger-${idx + 1} border-l border-white/10 pl-8`}>
                  <span className="text-brand-accent font-black text-xl mb-4 block underline decoration-4 underline-offset-8 decoration-brand-accent/30">{step.n}.</span>
                  <h4 className="text-3xl font-black uppercase tracking-tighter mb-6 leading-none">{step.t}</h4>
                  <p className="text-lg font-medium text-white/40 leading-snug">{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Matrix - Swiss Brutalism */}
      <section className="py-40 px-6 sm:px-12 max-w-[1200px] mx-auto">
        <div id="comp" className={`reveal ${revealed['comp'] ? 'visible' : ''}`}>
          <h2 className="text-6xl sm:text-8xl font-black uppercase tracking-tighter mb-20 leading-[0.8]">
            Framework <br />Comparison<span className="text-brand-accent">.</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border-b border-brand-dark">
              <thead>
                <tr className="border-y-2 border-brand-dark">
                  <th className="py-6 font-black uppercase tracking-widest text-brand-dark/40 text-xs">Metric</th>
                  <th className="py-6 font-black uppercase tracking-widest text-brand-dark/40 text-xs">Typical Apps</th>
                  <th className="py-6 font-black uppercase tracking-widest text-brand-accent text-xs">Simplifly Technical</th>
                </tr>
              </thead>
              <tbody className="font-bold text-2xl uppercase tracking-tighter">
                <tr className="border-b border-brand-dark/5">
                  <td className="py-8">Setup Cycle</td>
                  <td className="py-8 opacity-20">Hours / Days</td>
                  <td className="py-8 text-brand-accent">&lt; 10 Seconds</td>
                </tr>
                <tr className="border-b border-brand-dark/5">
                  <td className="py-8">Precision Level</td>
                  <td className="py-8 opacity-20">Fuzzy / Manual</td>
                  <td className="py-8 text-brand-accent">0.1s Precision</td>
                </tr>
                <tr className="border-b border-brand-dark/5">
                  <td className="py-8">Cost Factor</td>
                  <td className="py-8 opacity-20">Subscription Leak</td>
                  <td className="py-8 text-brand-accent">Open Access</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Giant CTA - Extreme Tension Layout */}
      <section className="py-40 px-6 sm:px-12 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-12 border-t-[40px] border-brand-accent bg-brand-dark text-white">
        <div id="cta" className={`max-w-4xl reveal ${revealed['cta'] ? 'visible' : ''}`}>
          <h2 className="text-[12vw] font-black uppercase tracking-tighter leading-[0.75] mb-12">
            Stop <br />Leaking <br />Revenue.
          </h2>
          <p className="text-2xl font-bold tracking-tight text-white/40 max-w-2xl leading-tight">
            Join the elite circle of technical freelancers who value their operational precision as much as their code.
          </p>
        </div>
        <div className="reveal stagger-2">
          <button onClick={() => navigate('/login')} className="bg-white text-brand-dark px-16 py-8 text-3xl font-black uppercase tracking-tighter hover:bg-brand-accent hover:text-white transition-all sharp-card border-none">
            Authorize Engine —&gt;
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="p-12 sm:p-24 bg-white text-brand-dark">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 border-t border-brand-dark/10 pt-24">
          <div>
            <Logo showText={false} size="lg" className="mb-8" />
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Simplifly Framework</h2>
            <p className="text-brand-dark/40 max-w-xs uppercase font-black text-[10px] tracking-[0.4em] leading-relaxed">
              Technical Infrastructure for the Modern Independent Professional.
            </p>
          </div>
          <div className="flex flex-wrap gap-24">
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark/20">Operations</span>
              <button onClick={() => navigate('/login')} className="text-sm font-bold uppercase tracking-widest hover:text-brand-accent transition-colors text-left">Sign In</button>
              <button onClick={() => navigate('/signup')} className="text-sm font-bold uppercase tracking-widest hover:text-brand-accent transition-colors text-left">Deploy</button>
              <button onClick={() => navigate('/signup')} className="text-sm font-bold uppercase tracking-widest hover:text-brand-accent transition-colors text-left">Documentation</button>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark/20">Source</span>
              <span className="text-sm font-bold uppercase tracking-widest">© {new Date().getFullYear()} Simplifly</span>
              <span className="text-sm font-bold tracking-tight opacity-40">umorjyotichetia@gmail.com</span>
            </div>
          </div>
        </div>

        <div className="mt-32 opacity-[0.02] text-[15vw] font-black uppercase tracking-tighter leading-none select-none pointer-events-none text-center">
          Simplifly
        </div>
      </footer>
    </div>
  );
};

export default Landing;
