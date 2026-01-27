import React from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user } = useAuth();

    return (
        <Layout>
            <div className="max-w-4xl mx-auto mb-32">
                {/* Massive Typographic Header */}
                <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-brand-dark/10 pb-16">
                    <div className="reveal">
                        <h1 className="text-7xl sm:text-[8vw] font-black uppercase tracking-tighter leading-[0.8]">
                            Operator <br />
                            <span className="text-brand-accent">Identity</span>.
                        </h1>
                        <p className="mt-8 text-xl font-bold tracking-tight text-brand-dark/40 max-w-md uppercase">
                            System Profile / Security Credentials / Node Configuration
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Avatar / Status Side */}
                    <div className="lg:col-span-4 reveal stagger-1">
                        <div className="sharp-card p-10 bg-brand-dark text-white border-none flex flex-col items-center text-center">
                            <div className="w-32 h-32 bg-brand-accent flex items-center justify-center font-black text-5xl mb-8">
                                {user?.name?.[0] || user?.username?.[0] || 'O'}
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black uppercase tracking-tighter">{user?.name || user?.username}</h3>
                                <span className="text-[10px] font-black tracking-[0.4em] text-brand-accent uppercase block">Verified Operator</span>
                            </div>

                            <div className="mt-12 w-full pt-12 border-t border-white/10 space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40">
                                    <span>System Status</span>
                                    <span className="text-green-500">Active</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40">
                                    <span>Node Level</span>
                                    <span>{user?.role === 'superadmin' ? 'ROOT_ADMIN' : 'STANDARD'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form / Data Side */}
                    <div className="lg:col-span-8 reveal stagger-2">
                        <div className="space-y-12">
                            {/* Profile Section */}
                            <section>
                                <div className="flex items-center gap-4 mb-10">
                                    <span className="text-[10px] font-black text-brand-accent px-2 py-0.5 border border-brand-accent">01</span>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-dark">Credential Manifest</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/40">Full Name</label>
                                        <div className="p-4 bg-gray-50 border-2 border-brand-dark text-lg font-bold uppercase">{user?.name || 'NOT_PROVISIONED'}</div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/40">Network Email</label>
                                        <div className="p-4 bg-gray-50 border-2 border-brand-dark text-lg font-bold truncate lowercase font-mono">{user?.email}</div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/40">Unique Identifier</label>
                                        <div className="p-4 bg-gray-50 border-2 border-brand-dark text-lg font-bold uppercase">{user?.username}</div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/40">System UID</label>
                                        <div className="p-4 bg-gray-50 border-2 border-brand-dark text-sm font-bold opacity-30 font-mono italic">{user?.id || user?._id}</div>
                                    </div>
                                </div>
                            </section>

                            {/* Security Status */}
                            <section className="p-8 bg-brand-accent/5 border-2 border-brand-accent reveal stagger-3">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-brand-accent text-white flex items-center justify-center shrink-0">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black uppercase tracking-tighter text-brand-accent">Identity Protection Active</h4>
                                        <p className="text-xs font-bold text-brand-dark/60 uppercase tracking-widest mt-1">Your session is secured via RSA encryption protocol.</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
