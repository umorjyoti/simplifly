import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { initRevealObserver } from '../utils/reveal';

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' });
  const { user } = useAuth();

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
      setNewWorkspace({ name: '', description: '' });
      setShowCreateModal(false);
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

        {showCreateModal && (
          <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-none shadow-none w-full max-w-md max-h-[90vh] overflow-y-auto sharp-card">
              {/* Clean Header */}
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Create Workspace</h2>
                <p className="text-sm text-gray-500">Set up a new workspace for your team</p>
              </div>

              <form onSubmit={handleCreateWorkspace} className="p-6">
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={newWorkspace.name}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-gray-900 placeholder-gray-400"
                    placeholder="Enter workspace name"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Description <span className="text-gray-400 font-normal text-xs">(optional)</span>
                  </label>
                  <textarea
                    value={newWorkspace.description}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-gray-900 placeholder-gray-400 resize-none"
                    rows="3"
                    placeholder="Add a description..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewWorkspace({ name: '', description: '' });
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all font-semibold shadow-sm hover:shadow"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
