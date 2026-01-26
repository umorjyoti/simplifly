import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import TicketBoard from '../components/TicketBoard';
import TicketDetailModal from '../components/TicketDetailModal';
import Backlog from '../components/Backlog';
import PeriodNavigation from '../components/PeriodNavigation';
import WorkspaceSettings from '../components/WorkspaceSettings';
import UserAvatar from '../components/UserAvatar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getPeriodRange, formatPeriodLabel, getPreviousPeriod, getNextPeriod } from '../utils/periodUtils';
import { hoursMinutesToDecimal, decimalToHoursMinutes } from '../utils/timeUtils';

const WorkspaceDetail = () => {
  const { id } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [allTickets, setAllTickets] = useState([]); // All tickets (for navigation)
  const [tickets, setTickets] = useState([]); // Filtered tickets for current view
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showHoursModal, setShowHoursModal] = useState(null);
  const [hoursInput, setHoursInput] = useState('');
  const [minutesInput, setMinutesInput] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [viewMode, setViewMode] = useState('board'); // 'board' or 'backlog'
  const [currentPeriod, setCurrentPeriod] = useState(new Date()); // Current period date
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    goLiveDate: '',
    assignee: ''
  });
  const { user } = useAuth();
  const isOwner = workspace?.owner._id === user?.id;

  const periodType = workspace?.settings?.periodType || 'monthly';

  useEffect(() => {
    fetchWorkspace();
    fetchTickets();
  }, [id]);

  useEffect(() => {
    if (workspace && allTickets.length > 0) {
      filterTicketsByPeriod();
    }
  }, [currentPeriod, periodType, viewMode, allTickets, workspace]);

  const fetchWorkspace = async () => {
    try {
      const response = await api.get(`/workspaces/${id}`);
      setWorkspace(response.data);
    } catch (error) {
      console.error('Error fetching workspace:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      // Fetch all tickets (no period filter)
      const response = await api.get(`/tickets/workspace/${id}`);
      setAllTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTicketsByPeriod = () => {
    if (viewMode === 'backlog') {
      // Show only backlog tickets (no goLiveDate)
      setTickets(allTickets.filter(ticket => !ticket.goLiveDate));
    } else {
      // Filter by period
      const period = getPeriodRange(currentPeriod, periodType);
      setTickets(allTickets.filter(ticket => {
        if (!ticket.goLiveDate) return false; // Exclude backlog items from period view
        const ticketDate = new Date(ticket.goLiveDate);
        return ticketDate >= period.start && ticketDate <= period.end;
      }));
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newTicket,
        workspace: id,
        type: 'story'
      };

      // Only include goLiveDate if provided (for backlog items)
      if (newTicket.goLiveDate) {
        payload.goLiveDate = new Date(newTicket.goLiveDate);
      }

      const response = await api.post('/tickets', payload);
      setAllTickets([response.data, ...allTickets]);
      setNewTicket({ title: '', description: '', goLiveDate: '', assignee: '' });
      setShowCreateModal(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create ticket');
    }
  };

  const handleStatusChange = async (ticketId, newStatus, showHoursPrompt) => {
    if (showHoursPrompt) {
      setShowHoursModal({ ticketId, newStatus });
      return;
    }

    try {
      await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      await fetchTickets();
      if (selectedTicket && selectedTicket._id === ticketId) {
        const updatedTicket = tickets.find(t => t._id === ticketId);
        if (updatedTicket) {
          setSelectedTicket({ ...updatedTicket, status: newStatus });
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleHoursSubmit = async () => {
    const hours = parseInt(hoursInput) || 0;
    const minutes = parseInt(minutesInput) || 0;

    if (hours === 0 && minutes === 0) {
      alert('Please enter valid hours and/or minutes worked');
      return;
    }

    const decimalHours = hoursMinutesToDecimal(hours, minutes);

    try {
      const { ticketId, newStatus } = showHoursModal;

      await api.patch(`/tickets/${ticketId}/hours`, {
        hoursWorked: decimalHours
      });

      await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });

      await fetchTickets();
      setShowHoursModal(null);
      setHoursInput('');
      setMinutesInput('');

      if (selectedTicket && selectedTicket._id === ticketId) {
        const updatedTicket = tickets.find(t => t._id === ticketId);
        if (updatedTicket) {
          setSelectedTicket({ ...updatedTicket, status: newStatus, hoursWorked: decimalHours });
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update ticket');
    }
  };

  const handleTicketUpdate = async (updates) => {
    try {
      if (updates.hoursWorked !== undefined) {
        const response = await api.patch(`/tickets/${selectedTicket._id}/hours`, {
          hoursWorked: updates.hoursWorked
        });
        setSelectedTicket(response.data);
        await fetchTickets();
      } else {
        const response = await api.put(`/tickets/${selectedTicket._id}`, updates);
        setSelectedTicket(response.data);
        await fetchTickets();
      }

      const refreshed = await api.get(`/tickets/${selectedTicket._id}`);
      setSelectedTicket(refreshed.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update ticket');
    }
  };

  const handleSaveSettings = async (settings) => {
    try {
      const response = await api.put(`/workspaces/${id}`, { settings });
      setWorkspace(response.data);
      // Reset to current period view
      setCurrentPeriod(new Date());
    } catch (error) {
      alert('Failed to update settings');
      throw error;
    }
  };

  const handleMoveToPeriod = (ticket) => {
    // Open ticket detail modal to allow setting goLiveDate
    setSelectedTicket(ticket);
  };

  const handlePeriodSelect = (date) => {
    setCurrentPeriod(date);
    setViewMode('board');
  };

  const handleBacklogClick = () => {
    setViewMode('backlog');
  };

  // Extract unique users from all tickets
  const uniqueUsers = useMemo(() => {
    const userMap = new Map();
    allTickets.forEach(ticket => {
      if (ticket.assignee && ticket.assignee._id) {
        const userId = ticket.assignee._id;
        if (!userMap.has(userId)) {
          userMap.set(userId, ticket.assignee);
        }
      }
    });
    return Array.from(userMap.values());
  }, [allTickets]);

  // Filter tickets based on selected user
  const filteredTickets = useMemo(() => {
    if (!selectedUserId) return tickets;

    return tickets.filter(ticket => {
      if (ticket.assignee?._id === selectedUserId) return true;

      if (ticket.type === 'story') {
        const hasMatchingSubtask = allTickets.some(subtask => {
          if (subtask.type !== 'subtask' || subtask.assignee?._id !== selectedUserId) {
            return false;
          }
          const subtaskParentId = typeof subtask.parentTicket === 'object'
            ? subtask.parentTicket?._id
            : subtask.parentTicket;
          return subtaskParentId === ticket._id;
        });
        return hasMatchingSubtask;
      }

      return false;
    });
  }, [tickets, selectedUserId, allTickets]);

  const handleUserFilter = (userId) => {
    setSelectedUserId(prev => prev === userId ? null : userId);
  };

  const navigatePeriod = (direction) => {
    if (direction === 'prev') {
      setCurrentPeriod(getPreviousPeriod(currentPeriod, periodType));
    } else {
      setCurrentPeriod(getNextPeriod(currentPeriod, periodType));
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-none h-12 w-12 border-b-2 border-brand-accent"></div>
        </div>
      </Layout>
    );
  }

  if (!workspace) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Workspace not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col">
        {/* Industrial Header */}
        <div className="mb-12 flex-shrink-0">
          <div className="bg-white border-b-4 border-brand-dark p-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-6 min-w-0 flex-1">
                  <Link to="/dashboard" className="text-brand-dark hover:text-brand-accent transition-colors flex-shrink-0">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                    </svg>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-brand-dark leading-none">{workspace.name}</h1>
                    {workspace.description && (
                      <p className="text-xs font-bold uppercase tracking-widest text-brand-dark/40 mt-3">{workspace.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {isOwner && (
                    <>
                      <button
                        onClick={() => setShowSettingsModal(true)}
                        className="p-3 text-brand-dark hover:bg-brand-dark hover:text-white transition-all border-2 border-brand-dark"
                        title="Settings"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <Link
                        to={`/workspace/${id}/billing`}
                        className="p-3 text-brand-dark hover:bg-brand-dark hover:text-white transition-all border-2 border-brand-dark"
                        title="Billing"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-brand-accent text-white px-6 py-3 text-xs font-black uppercase tracking-[0.3em] hover:bg-brand-dark transition-all flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline">Deploy Task</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex gap-2">
          {/* Period Navigation Sidebar */}
          {viewMode === 'board' && (
            <div className="hidden md:flex flex-shrink-0">
              <PeriodNavigation
                tickets={allTickets}
                currentPeriod={currentPeriod}
                periodType={periodType}
                onPeriodSelect={handlePeriodSelect}
                onBacklogClick={handleBacklogClick}
              />
            </div>
          )}

          {/* Board or Backlog View */}
          <div className="flex-1 bg-transparent rounded-none shadow-none border border-brand-dark/10 flex flex-col">
            {viewMode === 'backlog' ? (
              <Backlog
                tickets={allTickets}
                onTicketClick={setSelectedTicket}
                onMoveToPeriod={handleMoveToPeriod}
                workspaceId={id}
              />
            ) : (
              <div className="flex flex-col">
                {/* Period Header */}
                <div className="bg-brand-dark text-white border-b border-brand-dark/10 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-shrink-0">
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-white truncate">
                      {formatPeriodLabel(currentPeriod, periodType)}
                    </h2>
                    <p className="text-xs sm:text-sm text-white/60 mt-1">
                      {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Filters */}
                    {uniqueUsers.length > 0 && viewMode === 'board' && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white/60 uppercase tracking-wide hidden sm:inline">Filter:</span>
                        <button
                          onClick={() => handleUserFilter(null)}
                          className={`
                          px-3 py-1.5 text-xs rounded-none transition-all font-medium
                          ${selectedUserId === null
                              ? 'bg-brand-accent text-white shadow-none'
                              : 'bg-transparent text-white hover:bg-gray-200'
                            }
                        `}
                        >
                          All
                        </button>
                        <div className="flex items-center gap-2 flex-wrap">
                          {uniqueUsers.map((user) => (
                            <UserAvatar
                              key={user._id}
                              user={user}
                              isActive={selectedUserId === user._id}
                              onClick={() => handleUserFilter(user._id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => navigatePeriod('prev')}
                        className="p-2 text-white/60 hover:text-white hover:bg-transparent rounded-none transition-all border border-brand-dark/10"
                        title="Previous period"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setCurrentPeriod(new Date())}
                        className="px-3 py-2 text-xs sm:text-sm text-white hover:text-white hover:bg-transparent rounded-none transition-all border border-brand-dark/10 font-medium"
                      >
                        Today
                      </button>
                      <button
                        onClick={() => navigatePeriod('next')}
                        className="p-2 text-white/60 hover:text-white hover:bg-transparent rounded-none transition-all border border-brand-dark/10"
                        title="Next period"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={handleBacklogClick}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all border-2 ${viewMode === 'backlog'
                          ? 'bg-brand-accent text-white border-brand-accent'
                          : 'text-white border-white/20 hover:bg-white hover:text-brand-dark'
                          }`}
                      >
                        <span className="hidden sm:inline">Backlog Queue</span>
                        <span className="sm:hidden">Queue</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ticket Board */}
                <div className="p-4 sm:p-6 bg-transparent">
                  <TicketBoard
                    tickets={filteredTickets}
                    onStatusChange={handleStatusChange}
                    onTicketClick={setSelectedTicket}
                    workspaceId={id}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-brand-dark p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-brand-dark mb-8">Deploy New Task</h2>
            <form onSubmit={handleCreateTicket}>
              <div className="mb-6">
                <label className="block text-[10px] font-black uppercase tracking-widest text-brand-dark/60 mb-3">
                  Task Identifier *
                </label>
                <input
                  type="text"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-brand-dark bg-white text-brand-dark font-bold focus:outline-none focus:border-brand-accent"
                  placeholder="Enter task title"
                />
              </div>
              <div className="mb-6">
                <label className="block text-[10px] font-black uppercase tracking-widest text-brand-dark/60 mb-3">
                  Task Description
                </label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-brand-dark bg-white text-brand-dark font-bold focus:outline-none focus:border-brand-accent"
                  rows="4"
                  placeholder="Enter task description"
                />
              </div>
              <div className="mb-6">
                <label className="block text-[10px] font-black uppercase tracking-widest text-brand-dark/60 mb-3">
                  Deployment Date
                </label>
                <input
                  type="date"
                  value={newTicket.goLiveDate}
                  onChange={(e) => setNewTicket({ ...newTicket, goLiveDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-brand-dark bg-white text-brand-dark font-bold focus:outline-none focus:border-brand-accent"
                />
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-dark/40 mt-2 italic">
                  Leave empty to add to backlog queue
                </p>
              </div>
              <div className="mb-8">
                <label className="block text-[10px] font-black uppercase tracking-widest text-brand-dark/60 mb-3">
                  Assigned Operator *
                </label>
                <select
                  value={newTicket.assignee}
                  onChange={(e) => setNewTicket({ ...newTicket, assignee: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-brand-dark bg-white text-brand-dark font-bold focus:outline-none focus:border-brand-accent"
                >
                  <option value="">Select operator</option>
                  {workspace.members.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name || member.username}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTicket({ title: '', description: '', goLiveDate: '', assignee: '' });
                  }}
                  className="flex-1 px-6 py-3 border-2 border-brand-dark text-brand-dark font-black uppercase text-xs tracking-widest hover:bg-brand-dark hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-brand-accent text-white font-black uppercase text-xs tracking-widest hover:bg-brand-dark transition"
                >
                  Deploy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <WorkspaceSettings
          workspace={workspace}
          onClose={() => setShowSettingsModal(false)}
          onSave={handleSaveSettings}
        />
      )}

      {/* Hours Modal */}
      {showHoursModal && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-transparent rounded-none shadow-none p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Task Completion Report</h2>
            <p className="text-white/60 mb-4">
              Register operational time for deployment completion.
            </p>
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Hours *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={hoursInput}
                    onChange={(e) => setHoursInput(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-none focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                    placeholder="0"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Minutes *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="1"
                    value={minutesInput}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setMinutesInput(val > 59 ? 59 : val);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-none focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowHoursModal(null);
                  setHoursInput('');
                  setMinutesInput('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-white rounded-none hover:bg-transparent transition"
              >
                Cancel
              </button>
              <button
                onClick={handleHoursSubmit}
                className="flex-1 px-4 py-2 bg-brand-accent text-white rounded-none hover:bg-primary-700 transition"
              >
                Deploy Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          workspace={workspace}
          onClose={() => setSelectedTicket(null)}
          onUpdate={handleTicketUpdate}
          workspaceId={id}
        />
      )}
    </Layout>
  );
};

export default WorkspaceDetail;
