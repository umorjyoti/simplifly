import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load statistics</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Super Admin Dashboard</h1>
        <p className="text-gray-600 text-sm sm:text-base">Monitor platform statistics and manage workspaces</p>
      </div>

      {/* Period Selector */}
      <div className="mb-4 sm:mb-6 flex flex-wrap gap-2">
        {['all', 'today', 'week', 'month', 'year'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition text-xs sm:text-sm ${
              period === p
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Users</h3>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          {period !== 'all' && (
            <p className="text-sm text-gray-500 mt-1">
              +{stats.usersInPeriod} in this {period}
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Workspaces</h3>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalWorkspaces}</p>
          {period !== 'all' && (
            <p className="text-sm text-gray-500 mt-1">
              +{stats.workspacesInPeriod} in this {period}
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Visits</h3>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalVisits}</p>
          <p className="text-sm text-gray-500 mt-1">
            {stats.uniqueVisitorsCount} unique logged-in visitors
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Unique Visitors</h3>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.uniqueVisitorsCount}</p>
          <p className="text-sm text-gray-500 mt-1">
            In selected period
          </p>
        </div>
      </div>

      {/* Workspaces List */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">All Workspaces</h2>
          <p className="text-gray-600 text-xs sm:text-sm mt-1">Click on any workspace to open it</p>
        </div>
        <div className="p-3 sm:p-6">
          {workspaces.length === 0 ? (
            <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">No workspaces found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm">Name</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm">Owner</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm">Members</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm">Created</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workspaces.map((workspace) => (
                    <tr key={workspace._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <div className="font-medium text-gray-900 text-xs sm:text-sm">{workspace.name}</div>
                        {workspace.description && (
                          <div className="text-xs sm:text-sm text-gray-500 mt-1">{workspace.description}</div>
                        )}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <div className="text-xs sm:text-sm text-gray-700">
                          {workspace.owner?.name || workspace.owner?.username || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">{workspace.owner?.email}</div>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <span className="text-xs sm:text-sm text-gray-700">
                          {workspace.members?.length || 0} member{workspace.members?.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <span className="text-xs sm:text-sm text-gray-500">
                          {new Date(workspace.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <button
                          onClick={() => handleOpenWorkspace(workspace._id)}
                          className="text-primary-600 hover:text-primary-700 font-semibold text-xs sm:text-sm"
                        >
                          Open →
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
    </Layout>
  );
};

export default SuperAdminDashboard;
