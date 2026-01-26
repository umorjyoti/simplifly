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
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await api.post(`/invites/requests/${requestId}/reject`);
      await fetchAllRequests();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleRemoveMember = async (workspaceId, userId, memberName) => {
    if (!window.confirm(`INITIALIZE DE-PROVISIONING: Confirm removal of ${memberName}?`)) {
      return;
    }

    try {
      const memberId = userId?._id || userId;
      await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
      await fetchWorkspaces();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const copyToClipboard = (text, workspaceId) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedLink(workspaceId);
      setTimeout(() => setCopiedLink(null), 2000);
    });
  };

  const handleToggleWorkspace = (workspaceId) => {
    setExpandedWorkspace(expandedWorkspace === workspaceId ? null : workspaceId);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-12 w-12 border-b-2 border-brand-accent"></div>
        </div>
      </Layout>
    );
  }

  const requestsByWorkspace = requests.reduce((acc, request) => {
    const wsId = request.workspace._id || request.workspace;
    if (!acc[wsId]) acc[wsId] = [];
    acc[wsId].push(request);
    return acc;
  }, {});

  const totalPendingRequests = requests.length;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        {/* Massive Typographic Header */}
        <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-brand-dark/10 pb-16">
          <div className="reveal">
            <h1 className="text-7xl sm:text-[8vw] font-black uppercase tracking-tighter leading-[0.8]">
              Node <br />
              <span className="text-brand-accent">Capability</span>.
            </h1>
            <p className="mt-8 text-xl font-bold tracking-tight text-brand-dark/40 max-w-md uppercase">
              Operational Management / Team Architecture Control System
            </p>
          </div>
          <div className="reveal stagger-1">
            <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.4em] text-brand-dark/30">
              <span className="w-12 h-px bg-brand-dark/20"></span>
              V1.0.0 Stable Deployment
            </div>
          </div>
        </div>

        {/* Pending Requests Banner - Industrial Style */}
        {totalPendingRequests > 0 && (
          <div className="mb-16 bg-brand-accent text-white p-8 sharp-card border-none reveal">
            <div className="flex items-start justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white flex items-center justify-center flex-shrink-0 animate-pulse">
                  <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter mb-1">
                    {totalPendingRequests} UNAUTHORIZED REQUESTS
                  </h2>
                  <p className="text-white/70 font-bold tracking-wide text-sm uppercase"> Action Required: Interface Authentication Queue Pending</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {workspaces.length === 0 ? (
          <div className="py-40 text-center border-8 border-brand-dark/5 reveal">
            <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-brand-dark/10 mb-8">
              Core Registry Empty
            </h2>
            <p className="max-w-md mx-auto text-xl font-bold text-brand-dark/40 mb-12">
              No managed containers detected. Initialize a workspace to begin capability provisioning.
            </p>
            <Link
              to="/dashboard"
              className="btn-primary inline-flex scale-125"
            >
              INITIALIZE WORKSPACE —&gt;
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {workspaces.map((workspace, workspaceIdx) => {
              const workspaceId = workspace._id;
              const workspaceRequests = requestsByWorkspace[workspaceId] || [];
              const isExpanded = expandedWorkspace === workspaceId;
              const inviteLink = inviteLinks[workspaceId];

              const workspaceInitials = workspace.name
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);

              return (
                <div key={workspaceId} className={`reveal stagger-${(workspaceIdx % 3) + 1}`}>
                  <div className={`sharp-card overflow-hidden transition-all duration-500 bg-white ${isExpanded ? 'border-brand-accent' : 'border-brand-dark hover:border-brand-accent'}`}>
                    {/* Header Strip */}
                    <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-brand-dark/10">

                      {/* Industrial Initial Box */}
                      <div className={`w-32 h-32 lg:w-48 lg:h-auto flex items-center justify-center font-black text-5xl lg:text-7xl transition-colors ${isExpanded ? 'bg-brand-accent text-white' : 'bg-brand-dark text-white'}`}>
                        {workspaceInitials}
                      </div>

                      {/* Info Metadata */}
                      <div className="flex-1 p-8 lg:p-10 flex flex-col justify-center">
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                          <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter">{workspace.name}</h2>
                          <span className="text-[10px] font-black tracking-[0.2em] border-2 border-brand-accent px-3 py-1 text-brand-accent uppercase">
                            Root Owner
                          </span>
                          {workspaceRequests.length > 0 && (
                            <span className="bg-brand-accent text-white text-[10px] font-black tracking-[0.2em] px-3 py-1 uppercase">
                              {workspaceRequests.length} QUEUEING
                            </span>
                          )}
                        </div>
                        {workspace.description && (
                          <p className="text-brand-dark/60 font-bold uppercase text-xs tracking-widest leading-loose mb-6">{workspace.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-8">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl font-black">{workspace.members?.length || 0}</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-dark/30">Node Members</span>
                          </div>
                          <Link
                            to={`/workspace/${workspaceId}`}
                            className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent hover:text-brand-dark transition-colors"
                          >
                            Access Module
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </Link>
                        </div>
                      </div>

                      {/* Control Panel */}
                      <div className="p-8 flex items-center justify-center lg:w-48 bg-gray-50/50">
                        <button
                          onClick={() => handleToggleWorkspace(workspaceId)}
                          className={`w-full h-full min-h-[60px] lg:min-h-0 text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${isExpanded ? 'bg-brand-accent text-white' : 'bg-brand-dark text-white hover:bg-brand-accent'}`}
                        >
                          {isExpanded ? 'CLOSE' : 'MANAGE'}
                        </button>
                      </div>
                    </div>

                    {/* Detailed Management Panel */}
                    <div className={`transition-all duration-700 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="p-10 border-t-4 border-brand-dark bg-gray-50">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                          {/* Left: Invites and Access */}
                          <div className="space-y-12">
                            <section>
                              <div className="flex items-center gap-4 mb-8">
                                <span className="text-[10px] font-black text-brand-accent px-2 py-0.5 border border-brand-accent">01</span>
                                <h3 className="text-2xl font-black uppercase tracking-tighter">Identity Uplink</h3>
                              </div>

                              <div className="space-y-4">
                                {inviteLink ? (
                                  <div className="space-y-4">
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={inviteLink}
                                        readOnly
                                        className="w-full p-5 pr-32 bg-white border-2 border-brand-dark font-mono text-sm focus:outline-none"
                                      />
                                      <button
                                        onClick={() => copyToClipboard(inviteLink, workspaceId)}
                                        className={`absolute right-2 top-2 bottom-2 px-6 font-black uppercase text-[10px] tracking-widest transition-all ${copiedLink === workspaceId ? 'bg-green-600 text-white' : 'bg-brand-dark text-white hover:bg-brand-accent'}`}
                                      >
                                        {copiedLink === workspaceId ? 'COPIED' : 'COPY'}
                                      </button>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark/40 italic">
                                      Share this temporary endpoint for capability requests.
                                    </p>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => generateInviteLink(workspaceId)}
                                    className="w-full p-6 bg-white border-4 border-dashed border-brand-dark/20 text-brand-dark/40 font-black uppercase tracking-widest hover:border-brand-accent hover:text-brand-accent transition-all"
                                  >
                                    GENERATE ACCESS UPLINK —&gt;
                                  </button>
                                )}
                              </div>
                            </section>

                            {/* Join Requests */}
                            <section>
                              <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                  <span className="text-[10px] font-black text-brand-accent px-2 py-0.5 border border-brand-accent">02</span>
                                  <h3 className="text-2xl font-black uppercase tracking-tighter">Registry Queue</h3>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark/30">
                                  {workspaceRequests.length} Pending Approval
                                </span>
                              </div>

                              {workspaceRequests.length === 0 ? (
                                <div className="p-10 bg-white border-2 border-brand-dark/5 text-center">
                                  <p className="text-xs font-black uppercase tracking-widest text-brand-dark/20 italic">No external identities in queue</p>
                                </div>
                              ) : (
                                <div className="divide-y divide-brand-dark/10 bg-white border-2 border-brand-dark">
                                  {workspaceRequests.map((request) => (
                                    <div key={request._id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                      <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-gray-100 flex items-center justify-center font-black text-brand-dark/40">
                                          {(request.requestedBy?.name || request.requestedBy?.username || 'U')[0].toUpperCase()}
                                        </div>
                                        <div>
                                          <div className="font-black uppercase tracking-tighter text-lg">{request.requestedBy?.name || request.requestedBy?.username}</div>
                                          <div className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-widest">{request.requestedBy?.email || 'System ID'}</div>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleApprove(request._id, workspaceId)}
                                          className="px-6 py-3 bg-brand-dark text-white font-black uppercase text-[10px] tracking-widest hover:bg-green-600 transition-colors"
                                        >
                                          APPROVE
                                        </button>
                                        <button
                                          onClick={() => handleReject(request._id)}
                                          className="px-6 py-3 bg-white border-2 border-brand-dark/10 font-black uppercase text-[10px] tracking-widest hover:bg-brand-accent lg:hover:text-white transition-all shadow-none"
                                        >
                                          REJECT
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </section>
                          </div>

                          {/* Right: Member Management */}
                          <div className="space-y-12">
                            <section>
                              <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                  <span className="text-[10px] font-black text-brand-accent px-2 py-0.5 border border-brand-accent">03</span>
                                  <h3 className="text-2xl font-black uppercase tracking-tighter">Active Manifest</h3>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark/30">
                                  {workspace.members?.length || 0} Registered Nodes
                                </span>
                              </div>

                              <div className="space-y-3">
                                {/* Owner Display */}
                                <div className="p-6 bg-brand-dark text-white flex items-center justify-between">
                                  <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-white flex items-center justify-center font-black text-brand-dark">
                                      {workspace.owner?.name?.[0] || workspace.owner?.username?.[0] || 'O'}
                                    </div>
                                    <div>
                                      <div className="font-black uppercase tracking-tighter text-lg">{workspace.owner?.name || workspace.owner?.username}</div>
                                      <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Main Orchestrator (Owner)</div>
                                    </div>
                                  </div>
                                  <div className="text-[10px] font-black uppercase opacity-20 hidden sm:block">ROOT_ADMIN</div>
                                </div>

                                {/* List Members */}
                                {workspace.members
                                  .filter(member => (member?._id || member).toString() !== (workspace.owner?._id || workspace.owner).toString())
                                  .map((member) => {
                                    const memberId = member?._id || member;
                                    const memberName = member?.name || member?.username || 'Unknown Operator';

                                    return (
                                      <div key={memberId?.toString()} className="p-6 bg-white border-2 border-brand-dark/10 flex items-center justify-between group hover:border-brand-accent transition-colors">
                                        <div className="flex items-center gap-5">
                                          <div className="w-12 h-12 bg-gray-100 flex items-center justify-center font-black text-brand-dark/40 group-hover:bg-brand-accent/10 group-hover:text-brand-accent transition-colors">
                                            {memberName[0].toUpperCase()}
                                          </div>
                                          <div>
                                            <div className="font-black uppercase tracking-tighter text-lg">{memberName}</div>
                                            <div className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-widest">{member.email || '@' + member.username}</div>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => handleRemoveMember(workspaceId, memberId, memberName)}
                                          className="p-3 text-brand-dark/20 hover:text-brand-accent transition-colors"
                                          title="De-provision Access"
                                        >
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </div>
                                    );
                                  })}

                                {workspace.members?.length === 1 && (
                                  <div className="py-8 text-center border-2 border-dashed border-brand-dark/10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark/20">Operational Solo State</p>
                                  </div>
                                )}
                              </div>
                            </section>
                          </div>
                        </div>
                      </div>
                    </div>
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
