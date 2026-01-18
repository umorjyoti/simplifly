import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const MyTeam = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteLinks, setInviteLinks] = useState({});
  const [expandedWorkspace, setExpandedWorkspace] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchWorkspaces();
    fetchAllRequests();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const response = await api.get('/workspaces');
      const ownedWorkspaces = response.data.filter(
        ws => ws.owner._id === user?.id || ws.owner === user?.id
      );
      setWorkspaces(ownedWorkspaces);
      
      for (const workspace of ownedWorkspaces) {
        fetchInviteLink(workspace._id);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInviteLink = async (workspaceId) => {
    try {
      const response = await api.get(`/invites/workspace/${workspaceId}`);
      setInviteLinks(prev => ({
        ...prev,
        [workspaceId]: response.data.inviteLink
      }));
    } catch (error) {
      console.error('Error fetching invite link:', error);
    }
  };

  const generateInviteLink = async (workspaceId) => {
    try {
      const response = await api.post(`/invites/workspace/${workspaceId}/generate`);
      setInviteLinks(prev => ({
        ...prev,
        [workspaceId]: response.data.inviteLink
      }));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to generate invite link');
    }
  };

  const fetchAllRequests = async () => {
    try {
      const response = await api.get('/invites/requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleApprove = async (requestId, workspaceId) => {
    try {
      await api.post(`/invites/requests/${requestId}/approve`);
      await fetchAllRequests();
      await fetchWorkspaces();
      alert('Join request approved!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await api.post(`/invites/requests/${requestId}/reject`);
      await fetchAllRequests();
      alert('Join request rejected');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleRemoveMember = async (workspaceId, userId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) {
      return;
    }

    try {
      // Ensure userId is a string
      const memberId = userId?._id || userId;
      await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
      await fetchWorkspaces(); // Refresh to update member list
      alert('Member removed successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const copyToClipboard = (text, workspaceId) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedLink(workspaceId);
      setTimeout(() => setCopiedLink(null), 2000);
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  const handleToggleWorkspace = (workspaceId) => {
    if (expandedWorkspace === workspaceId) {
      setExpandedWorkspace(null);
    } else {
      setExpandedWorkspace(workspaceId);
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

  const requestsByWorkspace = requests.reduce((acc, request) => {
    const wsId = request.workspace._id || request.workspace;
    if (!acc[wsId]) {
      acc[wsId] = [];
    }
    acc[wsId].push(request);
    return acc;
  }, {});

  const totalPendingRequests = requests.length;

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Workspace Management</h1>
          <p className="text-gray-600">Manage invites and team access to your workspaces</p>
        </div>

        {/* Pending Requests Banner */}
        {totalPendingRequests > 0 && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">
                    {totalPendingRequests} Pending Join Request{totalPendingRequests !== 1 ? 's' : ''}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Review and approve requests to join your workspaces
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {workspaces.length === 0 ? (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-purple-50/50 rounded-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 p-16 sm:p-20 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-100 mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">No workspaces yet</h2>
              <p className="text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
                Create a workspace to start managing team access and invites.
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Workspace
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {workspaces.map((workspace) => {
              const workspaceId = workspace._id;
              const workspaceRequests = requestsByWorkspace[workspaceId] || [];
              const isExpanded = expandedWorkspace === workspaceId;
              const inviteLink = inviteLinks[workspaceId];
              const hasPendingRequests = workspaceRequests.length > 0;

              const workspaceInitials = workspace.name
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);

              const colorSchemes = [
                { icon: 'bg-blue-100 text-blue-600', badge: 'bg-blue-50 text-blue-700', border: 'border-blue-200' },
                { icon: 'bg-purple-100 text-purple-600', badge: 'bg-purple-50 text-purple-700', border: 'border-purple-200' },
                { icon: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' },
                { icon: 'bg-amber-100 text-amber-600', badge: 'bg-amber-50 text-amber-700', border: 'border-amber-200' },
                { icon: 'bg-rose-100 text-rose-600', badge: 'bg-rose-50 text-rose-700', border: 'border-rose-200' },
                { icon: 'bg-indigo-100 text-indigo-600', badge: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-200' },
              ];
              const colorIndex = workspaceId.charCodeAt(workspaceId.length - 1) % colorSchemes.length;
              const scheme = colorSchemes[colorIndex];

              return (
                <div key={workspaceId} className="bg-white rounded-xl border-2 border-gray-100 hover:border-gray-200 transition-all duration-300 overflow-hidden">
                  {/* Workspace Header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={`w-14 h-14 rounded-xl ${scheme.icon} flex items-center justify-center font-bold text-lg flex-shrink-0`}>
                          {workspaceInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h2 className="text-xl font-bold text-gray-900 truncate">{workspace.name}</h2>
                            <span className={`${scheme.badge} text-xs font-semibold px-3 py-1 rounded-lg flex-shrink-0`}>
                              Owner
                            </span>
                            {hasPendingRequests && (
                              <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-lg flex items-center gap-1.5 flex-shrink-0">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                </svg>
                                {workspaceRequests.length} request{workspaceRequests.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          {workspace.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{workspace.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <span className="font-medium">{workspace.members?.length || 0}</span>
                              <span className="text-gray-500">member{workspace.members?.length !== 1 ? 's' : ''}</span>
                            </div>
                            <Link
                              to={`/workspace/${workspaceId}`}
                              className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                            >
                              View workspace
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleWorkspace(workspaceId)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-2 flex-shrink-0"
                      >
                        {isExpanded ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            Hide
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            Manage
                          </>
                        )}
                      </button>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
                        {/* Invite Link Section */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <h3 className="font-semibold text-gray-900">Invite Link</h3>
                          </div>
                          <div className="flex items-center gap-3">
                            {inviteLink ? (
                              <>
                                <div className="flex-1 relative">
                                  <input
                                    type="text"
                                    value={inviteLink}
                                    readOnly
                                    className="w-full px-4 py-3 pr-24 border-2 border-gray-200 rounded-lg bg-gray-50 text-sm font-mono focus:outline-none focus:border-primary-500"
                                  />
                                  <button
                                    onClick={() => copyToClipboard(inviteLink, workspaceId)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition"
                                  >
                                    {copiedLink === workspaceId ? (
                                      <span className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Copied!
                                      </span>
                                    ) : (
                                      'Copy'
                                    )}
                                  </button>
                                </div>
                              </>
                            ) : (
                              <button
                                onClick={() => generateInviteLink(workspaceId)}
                                className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition flex items-center gap-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Generate Invite Link
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Share this link to allow others to request access to your workspace
                          </p>
                        </div>

                        {/* Members Section */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <h3 className="font-semibold text-gray-900">
                              Team Members
                              <span className="ml-2 text-sm font-normal text-gray-500">
                                ({workspace.members?.length || 0})
                              </span>
                            </h3>
                          </div>
                          {workspace.members && workspace.members.length > 0 ? (
                            <div className="space-y-2">
                              {/* Owner */}
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-semibold text-white">
                                      {workspace.owner?.name?.[0] || workspace.owner?.username?.[0] || 'O'}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">
                                      {workspace.owner?.name || workspace.owner?.username || 'Owner'}
                                    </div>
                                    {workspace.owner?.email && (
                                      <div className="text-sm text-gray-500 truncate">{workspace.owner.email}</div>
                                    )}
                                  </div>
                                  <span className={`${scheme.badge} text-xs font-semibold px-2.5 py-1 rounded-md flex-shrink-0`}>
                                    Owner
                                  </span>
                                </div>
                              </div>
                              {/* Members */}
                              {workspace.members
                                .filter(member => {
                                  const memberId = member?._id || member;
                                  const ownerId = workspace.owner?._id || workspace.owner;
                                  if (!memberId || !ownerId) return true;
                                  return memberId.toString() !== ownerId.toString();
                                })
                                .map((member) => {
                                  const memberId = member?._id || member;
                                  const memberName = member?.name || member?.username || 'Unknown User';
                                  const memberEmail = member?.email;
                                  const memberInitial = (memberName && memberName[0]) ? memberName[0].toUpperCase() : 'U';
                                  
                                  return (
                                    <div
                                      key={memberId?.toString() || Math.random()}
                                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition"
                                    >
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                                          <span className="text-sm font-semibold text-gray-600">
                                            {memberInitial}
                                          </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium text-gray-900 truncate">{memberName}</div>
                                          {memberEmail && (
                                            <div className="text-sm text-gray-500 truncate">{memberEmail}</div>
                                          )}
                                          {!memberEmail && member?.username && (
                                            <div className="text-sm text-gray-500 truncate">@{member.username}</div>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleRemoveMember(workspaceId, memberId, memberName)}
                                        className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition font-medium flex items-center gap-1.5 flex-shrink-0"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Remove
                                      </button>
                                    </div>
                                  );
                                })}
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-sm text-gray-500">No members yet</p>
                            </div>
                          )}
                        </div>

                        {/* Join Requests Section */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                              </svg>
                              <h3 className="font-semibold text-gray-900">
                                Join Requests
                                {workspaceRequests.length > 0 && (
                                  <span className="ml-2 text-sm font-normal text-gray-500">({workspaceRequests.length})</span>
                                )}
                              </h3>
                            </div>
                          </div>
                          {workspaceRequests.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                              </svg>
                              <p className="text-sm text-gray-500">No pending requests</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {workspaceRequests.map((request) => (
                                <div
                                  key={request._id}
                                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition"
                                >
                                  <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                                      <span className="text-sm font-semibold text-gray-600">
                                        {(request.requestedBy?.name || request.requestedBy?.username || 'U')[0].toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-gray-900 truncate">
                                        {request.requestedBy?.name || request.requestedBy?.username || 'Unknown User'}
                                      </div>
                                      {request.requestedBy?.email && (
                                        <div className="text-sm text-gray-500 truncate">{request.requestedBy.email}</div>
                                      )}
                                      <div className="text-xs text-gray-400 mt-0.5">
                                        {new Date(request.createdAt).toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                      onClick={() => handleApprove(request._id, workspaceId)}
                                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium text-sm flex items-center gap-1.5"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleReject(request._id)}
                                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium text-sm flex items-center gap-1.5"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyTeam;
