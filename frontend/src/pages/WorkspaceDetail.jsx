import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import TicketBoard from '../components/TicketBoard';
import TicketDetailModal from '../components/TicketDetailModal';
import UserAvatar from '../components/UserAvatar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const WorkspaceDetail = () => {
  const { id } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showHoursModal, setShowHoursModal] = useState(null);
  const [hoursWorked, setHoursWorked] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    goLiveDate: '',
    assignee: ''
  });
  const { user } = useAuth();
  const isOwner = workspace?.owner._id === user?.id;

  useEffect(() => {
    fetchWorkspace();
    fetchTickets();
  }, [id]);

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
      const response = await api.get(`/tickets/workspace/${id}`);
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/tickets', {
        ...newTicket,
        workspace: id,
        goLiveDate: new Date(newTicket.goLiveDate),
        type: 'story' // Default to story for main ticket creation
      });
      setTickets([response.data, ...tickets]);
      setNewTicket({ title: '', description: '', goLiveDate: '', assignee: '' });
      setShowCreateModal(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create ticket');
    }
  };

  const handleStatusChange = async (ticketId, newStatus, showHoursPrompt) => {
    if (showHoursPrompt) {
      // Show hours modal first
      setShowHoursModal({ ticketId, newStatus });
      return;
    }

    try {
      await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      await fetchTickets();
      // Update selected ticket if it's the one being changed
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
      
      // First update hours
      await api.patch(`/tickets/${ticketId}/hours`, {
        hoursWorked: parseFloat(hoursWorked)
      });
      
      // Then update status
      await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      
      await fetchTickets();
      setShowHoursModal(null);
      setHoursWorked('');
      
      // Update selected ticket if it's the one being changed
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
      // If updating hours, use the hours endpoint
      if (updates.hoursWorked !== undefined) {
        const response = await api.patch(`/tickets/${selectedTicket._id}/hours`, {
          hoursWorked: updates.hoursWorked
        });
        setSelectedTicket(response.data);
        await fetchTickets();
      } else {
        // For other updates, use PUT
        const response = await api.put(`/tickets/${selectedTicket._id}`, updates);
        setSelectedTicket(response.data);
        await fetchTickets();
      }
      
      // Refresh selected ticket to get latest data
      const refreshed = await api.get(`/tickets/${selectedTicket._id}`);
      setSelectedTicket(refreshed.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update ticket');
    }
  };

  // Extract unique users from tickets
  const uniqueUsers = useMemo(() => {
    const userMap = new Map();
    tickets.forEach(ticket => {
      if (ticket.assignee && ticket.assignee._id) {
        const userId = ticket.assignee._id;
        if (!userMap.has(userId)) {
          userMap.set(userId, ticket.assignee);
        }
      }
    });
    return Array.from(userMap.values());
  }, [tickets]);

  // Filter tickets based on selected user
  const filteredTickets = useMemo(() => {
    if (!selectedUserId) return tickets;
    
    return tickets.filter(ticket => {
      // Include tickets (both stories and subtasks) assigned to the selected user
      if (ticket.assignee?._id === selectedUserId) return true;
      
      // Also include parent tickets (stories) if any of their subtasks are assigned to the user
      if (ticket.type === 'story') {
        const hasMatchingSubtask = tickets.some(subtask => {
          if (subtask.type !== 'subtask' || subtask.assignee?._id !== selectedUserId) {
            return false;
          }
          // Handle both populated and unpopulated parentTicket
          const subtaskParentId = typeof subtask.parentTicket === 'object' 
            ? subtask.parentTicket?._id 
            : subtask.parentTicket;
          return subtaskParentId === ticket._id;
        });
        return hasMatchingSubtask;
      }
      
      return false;
    });
  }, [tickets, selectedUserId]);

  const handleUserFilter = (userId) => {
    // Toggle filter: if clicking the same user, clear filter
    setSelectedUserId(prev => prev === userId ? null : userId);
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
      <div className="mb-6">
        <Link to="/dashboard" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
          ← Back to Workspaces
        </Link>
        <div className="flex justify-between items-center mt-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{workspace.name}</h1>
            {workspace.description && (
              <p className="text-gray-600 mt-2">{workspace.description}</p>
            )}
          </div>
          <div className="flex space-x-3">
            {isOwner && (
              <Link
                to={`/workspace/${id}/billing`}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
              >
                Billing
              </Link>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              + Create Ticket
            </button>
          </div>
        </div>
      </div>

      {/* User Filter Avatars */}
      {uniqueUsers.length > 0 && (
        <div className="mb-4 bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 mr-2">Filter by:</span>
            <button
              onClick={() => handleUserFilter(null)}
              className={`
                px-3 py-1.5 text-sm rounded-lg transition-all
                ${selectedUserId === null
                  ? 'bg-primary-600 text-white font-semibold'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              All
            </button>
            <div className="flex items-center gap-2">
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
        </div>
      )}

      {/* Ticket Board */}
      <div className="bg-white rounded-lg shadow p-6">
        <TicketBoard
          tickets={filteredTickets}
          onStatusChange={handleStatusChange}
          onTicketClick={setSelectedTicket}
          workspaceId={id}
        />
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
                  Go Live Date *
                </label>
                <input
                  type="date"
                  value={newTicket.goLiveDate}
                  onChange={(e) => setNewTicket({ ...newTicket, goLiveDate: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
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
