import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const Landing = () => {
  const navigate = useNavigate();
  const { handleGoogleSignIn } = useAuth();
  const googleButtonRef = useRef(null);

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
        
        // Render the actual Google button in the hidden div
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

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleSuccess = async (credentialResponse) => {
    console.log('Google sign in successful, credential received');
    if (!credentialResponse.credential) {
      console.error('No credential in response');
      alert('Sign in failed: No credential received from Google');
      return;
    }
    
    try {
      const result = await handleGoogleSignIn(credentialResponse.credential);
      if (result.success) {
        navigate('/dashboard');
      } else {
        console.error('Sign in failed:', result.message);
        alert('Sign in failed: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error during sign in:', error);
      alert('Sign in failed: ' + error.message);
    }
  };

  const triggerGoogleSignIn = () => {
    // Simply click the rendered Google button
    const googleButton = googleButtonRef.current?.querySelector('div[role="button"]');
    if (googleButton) {
      googleButton.click();
    } else {
      console.error('Google Sign In button not found. Please wait for it to load.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 via-pink-50 to-primary-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          {/* Limited Time Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white px-6 py-2 rounded-full shadow-lg animate-pulse">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="font-bold text-sm">LIMITED TIME: Free Access - Join Now!</span>
            </div>
          </div>

          <div className="text-center relative z-10">
            <div className="flex justify-center mb-8">
              <Logo showText={true} size="xl" />
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Track Time. Bill Clients.
              <span className="block mt-2 animate-pulse">Get Paid Faster.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-700 mb-4 max-w-3xl mx-auto font-medium">
              The simplest way for freelancers to track tasks, log hours, and generate professional invoices
            </p>
            
            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
              Stop losing billable hours. Start getting paid for every minute you work.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              {/* Google Sign In Button - will be rendered here */}
              <div ref={googleButtonRef} className="flex justify-center"></div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-semibold text-gray-700 mb-1">
                <span className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Limited Time Free Access
                </span>
              </p>
              <p className="text-sm text-gray-500">No credit card required • Start tracking in seconds</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              Everything You Need to Bill Your Clients
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
              Built specifically for freelancers who bill by the hour
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-primary-50 to-purple-50 hover:from-primary-100 hover:to-purple-100 transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-primary-200">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Track Every Hour</h3>
              <p className="text-gray-600">
                Never lose billable time again. Log hours as you work on tasks and projects. Simple, accurate time tracking that takes seconds.
              </p>
            </div>

            <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-purple-200">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform -rotate-3 hover:-rotate-6 transition-transform">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Generate Bills Instantly</h3>
              <p className="text-gray-600">
                Select completed tasks, set your hourly rate, and generate professional invoices in seconds. No more manual calculations or spreadsheets.
              </p>
            </div>

            <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-pink-50 to-primary-50 hover:from-pink-100 hover:to-primary-100 transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-pink-200">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M8 14v6m0 0v-6m0 6H3m5 0h5m-5 0a3 3 0 01-3-3V9a3 3 0 013-3h5a3 3 0 013 3v2" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Team Collaboration</h3>
              <p className="text-gray-600">
                Work with clients and team members. Share workspaces, assign tasks, and track everyone's time in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-primary-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-primary-600 bg-clip-text text-transparent">
              Why Freelancers Love Simplifly
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                <div className="flex gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-sm hover:bg-white transition-all hover:shadow-lg">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Stop Losing Money</h3>
                    <p className="text-gray-600">
                      Studies show freelancers lose 20-30% of billable hours. With Simplifly, every minute is tracked and billable.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-sm hover:bg-white transition-all hover:shadow-lg">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Get Paid Faster</h3>
                    <p className="text-gray-600">
                      Generate professional invoices instantly. No more waiting days to compile hours and create bills.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-sm hover:bg-white transition-all hover:shadow-lg">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Limited Time Free</h3>
                    <p className="text-gray-600">
                      No hidden fees, no subscriptions, no credit card required. Start tracking and billing today - free for a limited time!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-primary-50 p-8 rounded-3xl shadow-2xl border-2 border-primary-200 hover:border-primary-300 transition-all">
              <div className="text-center mb-6">
                <div className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full text-sm font-bold mb-4">
                  ⚡ Limited Time Offer
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Get Started?</h3>
                <p className="text-gray-600">Join freelancers who are already getting paid for every hour</p>
              </div>
              <button
                onClick={triggerGoogleSignIn}
                className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-primary-700 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 transform hover:scale-105"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
              <p className="text-center text-sm text-gray-600 mt-4 font-medium">Limited time free access • No credit card</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-block bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-bold mb-6 border-2 border-white/30">
            ⏰ Limited Time: Free Access Available Now
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Start Tracking Your Time Today
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of freelancers who are already getting paid for every hour they work
          </p>
          <button
            onClick={triggerGoogleSignIn}
            className="bg-white text-primary-600 px-10 py-5 rounded-xl font-bold text-lg hover:bg-primary-50 transition-all shadow-2xl hover:shadow-white/50 inline-flex items-center gap-3 transform hover:scale-105"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#0284c7" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#0284c7" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#0284c7" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#0284c7" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Get Started Free Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Logo showText={true} size="md" />
            </div>
            <p className="text-sm mb-2">© {new Date().getFullYear()} Simplifly. All rights reserved.</p>
            <p className="text-sm mb-4">Free time tracking and billing for freelancers</p>
            <div className="flex justify-center items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href="mailto:umorjyotichetia@gmail.com" className="text-primary-400 hover:text-primary-300 transition-colors">
                umorjyotichetia@gmail.com
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
