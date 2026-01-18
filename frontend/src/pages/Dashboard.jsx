import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' });
  const { user } = useAuth();

  useEffect(() => {
    fetchWorkspaces();
  }, []);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        {/* Create Button */}
        <div className="mt-6 mb-4 flex justify-start px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="group relative inline-flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Workspace</span>
          </button>
        </div>

        {workspaces.length === 0 ? (
          <div className="relative px-4 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-purple-50/50 rounded-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 p-16 sm:p-20 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-100 mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">No workspaces yet</h2>
              <p className="text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
                Workspaces help you organize projects, manage tasks, and collaborate with your team.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2.5 bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Create Workspace
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 px-4 sm:px-6 lg:px-8">
            {workspaces.map((workspace) => {
              const isOwner = workspace.owner._id === user?.id;
              const workspaceInitials = workspace.name
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
              
              // More sophisticated color palette
              const colorSchemes = [
                { 
                  bg: 'bg-blue-50', 
                  border: 'border-blue-200', 
                  icon: 'bg-blue-100 text-blue-600',
                  badge: 'bg-blue-100 text-blue-700',
                  accent: 'text-blue-600'
                },
                { 
                  bg: 'bg-purple-50', 
                  border: 'border-purple-200', 
                  icon: 'bg-purple-100 text-purple-600',
                  badge: 'bg-purple-100 text-purple-700',
                  accent: 'text-purple-600'
                },
                { 
                  bg: 'bg-emerald-50', 
                  border: 'border-emerald-200', 
                  icon: 'bg-emerald-100 text-emerald-600',
                  badge: 'bg-emerald-100 text-emerald-700',
                  accent: 'text-emerald-600'
                },
                { 
                  bg: 'bg-amber-50', 
                  border: 'border-amber-200', 
                  icon: 'bg-amber-100 text-amber-600',
                  badge: 'bg-amber-100 text-amber-700',
                  accent: 'text-amber-600'
                },
                { 
                  bg: 'bg-rose-50', 
                  border: 'border-rose-200', 
                  icon: 'bg-rose-100 text-rose-600',
                  badge: 'bg-rose-100 text-rose-700',
                  accent: 'text-rose-600'
                },
                { 
                  bg: 'bg-indigo-50', 
                  border: 'border-indigo-200', 
                  icon: 'bg-indigo-100 text-indigo-600',
                  badge: 'bg-indigo-100 text-indigo-700',
                  accent: 'text-indigo-600'
                },
              ];
              const colorIndex = workspace._id.charCodeAt(workspace._id.length - 1) % colorSchemes.length;
              const scheme = colorSchemes[colorIndex];
              
              return (
                <Link
                  key={workspace._id}
                  to={`/workspace/${workspace._id}`}
                  className="group relative bg-white rounded-xl border-2 border-gray-100 hover:border-gray-300 transition-all duration-300 overflow-hidden"
                >
                  {/* Subtle background tint on hover */}
                  <div className={`absolute inset-0 ${scheme.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  
                  <div className="relative p-4">
                    {/* Compact header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-lg ${scheme.icon} flex items-center justify-center font-bold text-xs flex-shrink-0 group-hover:scale-105 transition-transform`}>
                          {workspaceInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-base font-bold text-gray-900 mb-0.5 truncate group-hover:text-gray-700">
                            {workspace.name}
                          </h2>
                          {workspace.description && (
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {workspace.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {isOwner && (
                        <span className={`ml-2 flex-shrink-0 ${scheme.badge} text-xs font-semibold px-2 py-0.5 rounded-md`}>
                          Owner
                        </span>
                      )}
                    </div>
                    
                    {/* Description if exists */}
                    {workspace.description && (
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                        {workspace.description}
                      </p>
                    )}
                    
                    {/* Bottom info bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="font-medium">{workspace.members.length}</span>
                        <span className="text-gray-500">{workspace.members.length === 1 ? 'member' : 'members'}</span>
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-medium ${scheme.accent} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <span>View</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
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
