import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { initRevealObserver } from '../utils/reveal';

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isPanelClosing, setIsPanelClosing] = useState(false);
  const [isPanelReady, setIsPanelReady] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' });
  const { user } = useAuth();

  // Match hamburger menu: transition duration 500ms, slide in from right when "ready"
  useEffect(() => {
    if (showCreateModal && !isPanelClosing) {
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsPanelReady(true));
      });
      return () => cancelAnimationFrame(id);
    }
    if (!showCreateModal) {
      setIsPanelReady(false);
    }
  }, [showCreateModal, isPanelClosing]);

  const closeCreatePanel = () => {
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const closeDurationMs = prefersReducedMotion ? 0 : 500;

    // Double rAF: ensure "open" state is committed and painted before starting close (smoother transition)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsPanelClosing(true);
        setTimeout(() => {
          setShowCreateModal(false);
          setIsPanelClosing(false);
          setIsPanelReady(false);
          setNewWorkspace({ name: '', description: '' });
        }, closeDurationMs);
      });
    });
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (!loading) {
      return initRevealObserver();
    }
  }, [loading, workspaces]);

  const fetchWorkspaces = async () => {
    try {
      const response = await api.get('/workspaces');
      setWorkspaces(response.data);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/workspaces', newWorkspace);
      setWorkspaces([...workspaces, response.data]);
      closeCreatePanel();
    } catch (error) {
      console.error('Error creating workspace:', error);
      alert(error.response?.data?.message || 'Failed to create workspace');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-20">
        {/* Header Section - Asymmetric */}
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="reveal stagger-1">
            <h1 className="text-8xl font-black uppercase tracking-tighter leading-[0.8]">
              Your <br />
              <span className="text-brand-accent underline decoration-8 underline-offset-8">Workspaces</span>
            </h1>
          </div>
          <div className="reveal stagger-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-brand-accent flex items-center gap-4 group"
            >
              <span className="text-sm font-bold tracking-widest uppercase">New Workspace</span>
              <div className="w-8 h-8 bg-white/20 flex items-center justify-center sharp-card group-hover:bg-white group-hover:text-brand-accent transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {workspaces.length === 0 ? (
          <div className="reveal stagger-3 mt-12 py-32 border-8 border-brand-dark/5 flex flex-col items-center justify-center text-center px-6">
            <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-brand-dark/10 mb-8">
              No Workspaces Founded
            </h2>
            <p className="max-w-md text-xl font-bold text-brand-dark/40 mb-12">
              Start by creating a digital environment for your projects and team collaboration.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create First Environment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {workspaces.map((workspace, idx) => {
              const isOwner = workspace.owner._id === user?.id;
              const workspaceInitials = workspace.name
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);

              return (
                <Link
                  key={workspace._id}
                  to={`/workspace/${workspace._id}`}
                  className={`group reveal stagger-${(idx % 3) + 1}`}
                >
                  <div className="sharp-card p-10 h-full flex flex-col bg-white hover:border-brand-accent transition-colors relative overflow-hidden">
                    {/* Background Index Number */}
                    <div className="absolute -bottom-4 -right-2 text-9xl font-black text-brand-dark/5 group-hover:text-brand-accent/5 transition-colors">
                      {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </div>

                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-12">
                        <div className="w-16 h-16 bg-brand-dark text-white font-black text-2xl flex items-center justify-center group-hover:bg-brand-accent transition-colors">
                          {workspaceInitials}
                        </div>
                        {isOwner && (
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] border border-brand-dark/20 px-3 py-1 bg-gray-50">
                            Root Owner
                          </div>
                        )}
                      </div>

                      <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 group-hover:text-brand-accent transition-colors leading-none">
                        {workspace.name}
                      </h2>

                      {workspace.description && (
                        <p className="text-brand-dark/60 font-medium leading-tight mb-12 line-clamp-2">
                          {workspace.description}
                        </p>
                      )}

                      <div className="mt-auto pt-8 border-t border-brand-dark/10 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-brand-dark/40">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>{workspace.members.length} {workspace.members.length === 1 ? 'member' : 'members'}</span>
                        </div>
                        <div className="w-10 h-10 border border-brand-dark/20 flex items-center justify-center group-hover:bg-brand-dark group-hover:text-white transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {(showCreateModal || isPanelClosing) &&
          createPortal(
            <div
              className="fixed inset-0 z-[70]"
              onClick={closeCreatePanel}
            >
              {/* Backdrop: fades out in sync with panel slide (GPU-friendly opacity), respects reduced-motion */}
              <div
                className={`absolute inset-0 bg-brand-dark/40 backdrop-blur-sm transition-opacity duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:duration-0 ${
                  isPanelClosing ? 'opacity-0' : 'opacity-100'
                }`}
                aria-hidden="true"
              />
              {/* Right-hand panel: full viewport height, half width, slides out right (left→right close); will-change only during transition */}
              <div
                className={`fixed top-0 right-0 h-screen w-[50vw] bg-white overflow-y-auto sharp-card border-l border-brand-dark/10 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:duration-0 ${
                  showCreateModal && !isPanelClosing && isPanelReady ? 'translate-x-0' : 'translate-x-full'
                }`}
                style={{
                  boxShadow: '-8px 0 32px rgba(26, 26, 26, 0.12)',
                  willChange: (showCreateModal || isPanelClosing) ? 'transform' : undefined,
                }}
                role="dialog"
                aria-labelledby="create-workspace-title"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-8 md:p-10 flex flex-col min-h-full">
                  {/* Header */}
                  <div className="pb-6 border-b border-brand-dark/10 mb-8">
                    <h2 id="create-workspace-title" className="text-2xl font-bold text-brand-dark mb-1">
                      Create Workspace
                    </h2>
                    <p className="text-sm text-brand-dark/60">Set up a new workspace for your team</p>
                  </div>

                  <form onSubmit={handleCreateWorkspace} className="flex flex-col flex-1">
                    <div className="mb-5">
                      <label htmlFor="workspace-name" className="block text-sm font-semibold text-brand-dark mb-2">
                        Workspace Name
                      </label>
                      <input
                        id="workspace-name"
                        type="text"
                        value={newWorkspace.name}
                        onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-brand-dark/20 rounded-sm focus:ring-2 focus:ring-brand-dark focus:border-brand-dark outline-none transition-all text-brand-dark placeholder-brand-dark/40"
                        placeholder="Enter workspace name"
                      />
                    </div>
                    <div className="mb-8">
                      <label htmlFor="workspace-desc" className="block text-sm font-semibold text-brand-dark mb-2">
                        Description <span className="text-brand-dark/40 font-normal">(optional)</span>
                      </label>
                      <textarea
                        id="workspace-desc"
                        value={newWorkspace.description}
                        onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                        className="w-full px-4 py-3 border border-brand-dark/20 rounded-sm focus:ring-2 focus:ring-brand-dark focus:border-brand-dark outline-none transition-all text-brand-dark placeholder-brand-dark/40 resize-none"
                        rows="4"
                        placeholder="Add a description..."
                      />
                    </div>

                    <div className="mt-auto flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={closeCreatePanel}
                        className="flex-1 px-4 py-3 border border-brand-dark/20 text-brand-dark rounded-sm hover:bg-brand-dark/5 transition-all font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 bg-brand-dark hover:bg-brand-dark/90 text-white rounded-sm transition-all font-semibold"
                      >
                        Create
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    </Layout>
  );
};

export default Dashboard;
