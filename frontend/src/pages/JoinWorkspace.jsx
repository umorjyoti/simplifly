import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';

const JoinWorkspace = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInviteInfo();
  }, [token]);

  const fetchInviteInfo = async () => {
    try {
      const response = await api.get(`/invites/token/${token}`);
      setWorkspace(response.data.workspace);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid or expired invite link');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async () => {
    setRequesting(true);
    setError(null);
    try {
      const response = await api.post(`/invites/join/${token}`);
      setRequestStatus('success');
      setRequestStatus(response.data);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already requested')) {
        setRequestStatus('already_requested');
      } else if (error.response?.status === 400 && error.response?.data?.message?.includes('already a member')) {
        setRequestStatus('already_member');
      } else {
        setError(error.response?.data?.message || 'Failed to send join request');
      }
    } finally {
      setRequesting(false);
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

  if (error && !workspace) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-4 sm:p-8 text-center">
            <div className="text-red-600 text-4xl sm:text-6xl mb-4">⚠️</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Invalid Invite Link</h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">{error}</p>
            <Link
              to="/dashboard"
              className="inline-block px-4 sm:px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-primary-700 transition text-sm sm:text-base"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-8">
          {requestStatus === 'success' || requestStatus?.message ? (
            <div className="text-center">
              <div className="text-green-600 text-4xl sm:text-6xl mb-4">✓</div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Join Request Sent!</h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                Your request to join <strong>{workspace?.name}</strong> has been sent to the workspace owner.
                You will be notified once your request is approved.
              </p>
              <Link
                to="/dashboard"
                className="inline-block px-4 sm:px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-primary-700 transition text-sm sm:text-base"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : requestStatus === 'already_requested' ? (
            <div className="text-center">
              <div className="text-yellow-600 text-4xl sm:text-6xl mb-4">⏳</div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Request Already Sent</h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                You have already requested to join <strong>{workspace?.name}</strong>.
                Please wait for the workspace owner to approve your request.
              </p>
              <Link
                to="/dashboard"
                className="inline-block px-4 sm:px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-primary-700 transition text-sm sm:text-base"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : requestStatus === 'already_member' ? (
            <div className="text-center">
              <div className="text-blue-600 text-4xl sm:text-6xl mb-4">✓</div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Already a Member</h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                You are already a member of <strong>{workspace?.name}</strong>.
              </p>
              <Link
                to="/dashboard"
                className="inline-block px-4 sm:px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-primary-700 transition text-sm sm:text-base"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6 sm:mb-8">
                <div className="text-brand-accent text-4xl sm:text-6xl mb-4">👥</div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Join Workspace</h2>
                <p className="text-gray-600 text-sm sm:text-base">You've been invited to join a workspace</p>
              </div>

              {workspace && (
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{workspace.name}</h3>
                  {workspace.description && (
                    <p className="text-gray-600 mb-4 text-sm sm:text-base">{workspace.description}</p>
                  )}
                  <div className="text-xs sm:text-sm text-gray-500">
                    <p>Owner: {workspace.owner?.name || workspace.owner?.username}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 sm:mb-6 text-sm sm:text-base">
                  {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={handleJoinRequest}
                  disabled={requesting}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-brand-accent text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base"
                >
                  {requesting ? 'Sending Request...' : 'Request to Join'}
                </button>
                <Link
                  to="/dashboard"
                  className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-center text-sm sm:text-base"
                >
                  Cancel
                </Link>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                By requesting to join, you're asking the workspace owner for permission to access this workspace.
              </p>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default JoinWorkspace;
