import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import { initRevealObserver } from '../utils/reveal';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchWorkspaces();
  }, [period]);

  useEffect(() => {
    if (!loading) {
      return initRevealObserver();
    }
  }, [loading]);

  const fetchStats = async () => {
    try {
      const response = await api.get(`/superadmin/stats?period=${period}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      if (error.response?.status === 403) {
        alert('You do not have superadmin access');
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const response = await api.get('/superadmin/workspaces');
      setWorkspaces(response.data);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    }
  };

  const handleOpenWorkspace = (workspaceId) => {
    navigate(`/workspace/${workspaceId}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-12 w-12 border-2 border-brand-dark/20 border-t-brand-accent" aria-label="Loading"></div>
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout>
        <div className="py-32 border-8 border-brand-dark/5 flex flex-col items-center justify-center text-center px-6">
          <p className="text-brand-dark/80 font-bold uppercase tracking-widest">Failed to load statistics</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-20">
      <div className="mb-12 reveal stagger-1">
        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-brand-dark leading-none mb-2">
          Super Admin Dashboard
        </h1>
        <p className="text-brand-dark/60 font-medium uppercase tracking-wide text-sm">
          Monitor platform statistics and manage workspaces
        </p>
      </div>

      {/* Period Selector — sharp, brand-dark active */}
      <div className="mb-8 flex flex-wrap gap-2 reveal stagger-2">
        {['all', 'today', 'week', 'month', 'year'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-3 font-black uppercase tracking-tight text-sm transition-all border-2 ${
              period === p
                ? 'bg-brand-dark text-white border-brand-dark'
                : 'bg-white text-brand-dark/60 border-brand-dark/20 hover:border-brand-dark hover:text-brand-dark hover:bg-brand-dark/5'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Statistics Cards — sharp-card, brand typography */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <div className="sharp-card bg-white p-6 reveal stagger-1">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-dark/60">Total Users</h3>
            <div className="w-10 h-10 bg-brand-dark/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-brand-dark tracking-tighter">{stats.totalUsers}</p>
          {period !== 'all' && (
            <p className="text-xs font-bold uppercase tracking-widest text-brand-dark/50 mt-2">+{stats.usersInPeriod} in this {period}</p>
          )}
        </div>

        <div className="sharp-card bg-white p-6 reveal stagger-2">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-dark/60">Total Workspaces</h3>
            <div className="w-10 h-10 bg-brand-dark/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-brand-dark tracking-tighter">{stats.totalWorkspaces}</p>
          {period !== 'all' && (
            <p className="text-xs font-bold uppercase tracking-widest text-brand-dark/50 mt-2">+{stats.workspacesInPeriod} in this {period}</p>
          )}
        </div>

        <div className="sharp-card bg-white p-6 reveal stagger-3">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-dark/60">Total Visits</h3>
            <div className="w-10 h-10 bg-brand-dark/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-brand-dark tracking-tighter">{stats.totalVisits}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-dark/50 mt-2">{stats.uniqueVisitorsCount} unique logged-in visitors</p>
        </div>

        <div className="sharp-card bg-white p-6 reveal stagger-1">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-dark/60">Unique Visitors</h3>
            <div className="w-10 h-10 bg-brand-dark/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-brand-dark tracking-tighter">{stats.uniqueVisitorsCount}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-dark/50 mt-2">In selected period</p>
        </div>
      </div>

      {/* All Workspaces — sharp card, brand table */}
      <div className="sharp-card bg-white overflow-hidden reveal stagger-2">
        <div className="p-6 border-b-2 border-brand-dark/10">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-brand-dark">All Workspaces</h2>
          <p className="text-brand-dark/60 text-xs font-bold uppercase tracking-widest mt-2">Click on any workspace to open it</p>
        </div>
        <div className="p-4 sm:p-6">
          {workspaces.length === 0 ? (
            <div className="py-16 border-2 border-dashed border-brand-dark/10 text-center">
              <p className="text-brand-dark/50 font-bold uppercase tracking-widest text-sm">No workspaces found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b-2 border-brand-dark/10">
                    <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-brand-dark/60">Name</th>
                    <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-brand-dark/60">Owner</th>
                    <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-brand-dark/60">Members</th>
                    <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-brand-dark/60">Created</th>
                    <th className="text-right py-4 px-4 text-[10px] font-black uppercase tracking-widest text-brand-dark/60">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workspaces.map((workspace) => (
                    <tr key={workspace._id} className="border-b border-brand-dark/10 hover:bg-brand-dark/[0.02] transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-brand-dark uppercase tracking-tight text-sm">{workspace.name}</div>
                        {workspace.description && (
                          <div className="text-xs text-brand-dark/60 mt-1 font-medium line-clamp-2">{workspace.description}</div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-brand-dark text-sm">{workspace.owner?.name || workspace.owner?.username || 'N/A'}</div>
                        <div className="text-xs text-brand-dark/50 font-medium">{workspace.owner?.email}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-bold uppercase tracking-wide text-brand-dark/70">
                          {workspace.members?.length || 0} member{(workspace.members?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-medium text-brand-dark/60 uppercase tracking-wide">
                          {new Date(workspace.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleOpenWorkspace(workspace._id)}
                          className="text-brand-accent hover:text-brand-dark font-black uppercase tracking-widest text-xs transition-colors inline-flex items-center gap-1"
                        >
                          Open
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      </div>
    </Layout>
  );
};

export default SuperAdminDashboard;
