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
  const [hoursWorked, setHoursWorked] = useState('');
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
    if (!hoursWorked || parseFloat(hoursWorked) <= 0) {
      alert('Please enter valid hours worked');
      return;
    }

    try {
      const { ticketId, newStatus } = showHoursModal;
      
      await api.patch(`/tickets/${ticketId}/hours`, {
        hoursWorked: parseFloat(hoursWorked)
      });
      
      await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      
      await fetchTickets();
      setShowHoursModal(null);
      setHoursWorked('');
      
      if (selectedTicket && selectedTicket._id === ticketId) {
        const updatedTicket = tickets.find(t => t._id === ticketId);
        if (updatedTicket) {
          setSelectedTicket({ ...updatedTicket, status: newStatus, hoursWorked: parseFloat(hoursWorked) });
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
      <div className="flex flex-col h-full">
        <div className="mb-2 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-primary-600 hover:text-primary-700 text-sm">
                ← Back
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {uniqueUsers.length > 0 && viewMode === 'board' && (
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-xs font-medium text-gray-600">Filter:</span>
                  <button
                    onClick={() => handleUserFilter(null)}
                    className={`
                      px-2 py-1 text-xs rounded transition-all
                      ${selectedUserId === null
                        ? 'bg-primary-600 text-white font-semibold'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    All
                  </button>
                  <div className="flex items-center gap-1">
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
              {isOwner && (
                <>
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="bg-gray-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-700 transition"
                  >
                    ⚙️ Settings
                  </button>
                  <Link
                    to={`/workspace/${id}/billing`}
                    className="bg-purple-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-purple-700 transition"
                  >
                    Billing
                  </Link>
                </>
              )}
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-primary-700 transition"
              >
                + Create Ticket
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex gap-2 flex-1 min-h-0">
        {/* Period Navigation Sidebar */}
        {viewMode === 'board' && (
          <div className="flex-shrink-0">
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
        <div className="flex-1 bg-white rounded-lg shadow overflow-hidden flex flex-col">
          {viewMode === 'backlog' ? (
            <Backlog
              tickets={allTickets}
              onTicketClick={setSelectedTicket}
              onMoveToPeriod={handleMoveToPeriod}
              workspaceId={id}
            />
          ) : (
            <div className="h-full flex flex-col">
              {/* Period Header */}
              <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-lg font-bold">
                    {formatPeriodLabel(currentPeriod, periodType)}
                  </h2>
                  <p className="text-xs text-gray-300">
                    {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigatePeriod('prev')}
                    className="px-2 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600 transition"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setCurrentPeriod(new Date())}
                    className="px-2 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600 transition"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => navigatePeriod('next')}
                    className="px-2 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600 transition"
                  >
                    Next →
                  </button>
                  <button
                    onClick={handleBacklogClick}
                    className={`px-2 py-1 rounded text-xs transition ml-1 ${
                      viewMode === 'backlog'
                        ? 'bg-primary-600 hover:bg-primary-700'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    📋 Backlog
                  </button>
                </div>
              </div>

              {/* Ticket Board */}
              <div className="flex-1 p-3 overflow-auto min-h-0">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Ticket</h2>
            <form onSubmit={handleCreateTicket}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Enter ticket title"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  rows="3"
                  placeholder="Enter ticket description"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Go Live Date
                </label>
                <input
                  type="date"
                  value={newTicket.goLiveDate}
                  onChange={(e) => setNewTicket({ ...newTicket, goLiveDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to add to backlog
                </p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignee *
                </label>
                <select
                  value={newTicket.assignee}
                  onChange={(e) => setNewTicket({ ...newTicket, assignee: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="">Select assignee</option>
                  {workspace.members.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name || member.username}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTicket({ title: '', description: '', goLiveDate: '', assignee: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Create
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Hours Worked</h2>
            <p className="text-gray-600 mb-4">
              To mark this ticket as completed, please enter the hours worked.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours Worked *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="Enter hours worked"
                autoFocus
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowHoursModal(null);
                  setHoursWorked('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleHoursSubmit}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Save & Complete
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
