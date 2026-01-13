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
  const { user } = useAuth();

  useEffect(() => {
    fetchWorkspaces();
    fetchAllRequests();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const response = await api.get('/workspaces');
      // Filter to only show workspaces owned by user
      const ownedWorkspaces = response.data.filter(
        ws => ws.owner._id === user?.id || ws.owner === user?.id
      );
      setWorkspaces(ownedWorkspaces);
      
      // Fetch invite links for each workspace
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

  const fetchWorkspaceRequests = async (workspaceId) => {
    try {
      const response = await api.get(`/invites/workspace/${workspaceId}/requests`);
      return response.data;
    } catch (error) {
      console.error('Error fetching workspace requests:', error);
      return [];
    }
  };

  const handleApprove = async (requestId, workspaceId) => {
    try {
      await api.post(`/invites/requests/${requestId}/approve`);
      await fetchAllRequests();
      await fetchWorkspaces(); // Refresh to update member count
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Invite link copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  const handleToggleWorkspace = async (workspaceId) => {
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

  // Group requests by workspace
  const requestsByWorkspace = requests.reduce((acc, request) => {
    const wsId = request.workspace._id || request.workspace;
    if (!acc[wsId]) {
      acc[wsId] = [];
    }
    acc[wsId].push(request);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Team</h1>
        <p className="text-gray-600 mt-2">Manage invite links and join requests for your workspaces</p>
      </div>

      {workspaces.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg mb-4">You don't own any workspaces yet</p>
          <Link
            to="/dashboard"
            className="text-primary-600 hover:text-primary-700 font-semibold"
          >
            Create a workspace
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {workspaces.map((workspace) => {
            const workspaceId = workspace._id;
            const workspaceRequests = requestsByWorkspace[workspaceId] || [];
            const isExpanded = expandedWorkspace === workspaceId;
            const inviteLink = inviteLinks[workspaceId];

            return (
              <div key={workspaceId} className="bg-white rounded-lg shadow border border-gray-200">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-semibold text-gray-900">{workspace.name}</h2>
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                          Owner
                        </span>
                      </div>
                      {workspace.description && (
                        <p className="text-gray-600 text-sm mb-2">{workspace.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{workspace.members?.length || 0} member{workspace.members?.length !== 1 ? 's' : ''}</span>
                        <Link
                          to={`/workspace/${workspaceId}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          View Workspace →
                        </Link>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleWorkspace(workspaceId)}
                      className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      {isExpanded ? 'Hide' : 'Manage'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-6 space-y-6 border-t border-gray-200 pt-6">
                      {/* Invite Link Section */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Invite Link</h3>
                        <div className="flex items-center gap-2">
                          {inviteLink ? (
                            <>
                              <input
                                type="text"
                                value={inviteLink}
                                readOnly
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                              />
                              <button
                                onClick={() => copyToClipboard(inviteLink)}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
                              >
                                Copy Link
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => generateInviteLink(workspaceId)}
                              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
                            >
                              Generate Invite Link
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Share this link with users to allow them to request to join your workspace
                        </p>
                      </div>

                      {/* Join Requests Section */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">
                          Join Requests ({workspaceRequests.length})
                        </h3>
                        {workspaceRequests.length === 0 ? (
                          <p className="text-gray-500 text-sm">No pending requests</p>
                        ) : (
                          <div className="space-y-3">
                            {workspaceRequests.map((request) => (
                              <div
                                key={request._id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {request.requestedBy?.name || request.requestedBy?.username}
                                  </div>
                                  {request.requestedBy?.email && (
                                    <div className="text-sm text-gray-500">
                                      {request.requestedBy.email}
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-400 mt-1">
                                    Requested {new Date(request.createdAt).toLocaleString()}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleApprove(request._id, workspaceId)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReject(request._id)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                                  >
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
    </Layout>
  );
};

export default MyTeam;
