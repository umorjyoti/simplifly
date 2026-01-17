import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';

const TicketDetail = () => {
  const { workspaceId, ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hoursInput, setHoursInput] = useState('');

  useEffect(() => {
    fetchTicket();
    fetchWorkspace();
  }, [ticketId, workspaceId]);

  // Update hours input when ticket changes
  useEffect(() => {
    if (ticket) {
      setHoursInput(ticket.hoursWorked !== undefined ? ticket.hoursWorked.toString() : '');
    }
  }, [ticket]);

  const fetchTicket = async () => {
    try {
      const response = await api.get(`/tickets/${ticketId}`);
      setTicket(response.data);
      await Promise.all([
        fetchComments(),
        fetchHistory(),
        fetchSubtasks()
      ]);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      alert('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspace = async () => {
    try {
      const response = await api.get(`/workspaces/${workspaceId}`);
      setWorkspace(response.data);
    } catch (error) {
      console.error('Error fetching workspace:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/comments/ticket/${ticketId}`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get(`/tickets/${ticketId}/history`);
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const fetchSubtasks = async () => {
    try {
      const response = await api.get(`/tickets/${ticketId}/subtasks`);
      setSubtasks(response.data);
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await api.post('/comments', {
        ticketId: ticket._id,
        content: newComment
      });
      setComments([...comments, response.data]);
      setNewComment('');
      await fetchHistory();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    if (ticket.type === 'subtask') {
      alert('Cannot create subtask inside a subtask');
      return;
    }

    setSubmitting(true);
    try {
      const defaultAssignee = ticket.assignee?._id || ticket.assignee || workspace?.members?.[0]?._id;
      const defaultGoLiveDate = ticket.goLiveDate || new Date().toISOString().split('T')[0];

      const workspaceIdValue = typeof ticket.workspace === 'object' 
        ? ticket.workspace._id 
        : ticket.workspace;

      const response = await api.post('/tickets', {
        title: newSubtaskTitle,
        description: '',
        goLiveDate: defaultGoLiveDate,
        assignee: defaultAssignee,
        workspace: workspaceIdValue,
        type: 'subtask',
        parentTicket: ticket._id
      });
      setSubtasks([...subtasks, response.data]);
      setNewSubtaskTitle('');
      await fetchHistory();
      await fetchTicket();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add subtask');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!window.confirm('Are you sure you want to delete this subtask?')) return;

    try {
      await api.delete(`/tickets/${subtaskId}`);
      setSubtasks(subtasks.filter(s => s._id !== subtaskId));
      await fetchHistory();
      await fetchTicket();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete subtask');
    }
  };

  const handleTicketUpdate = async (updates) => {
    try {
      if (updates.hoursWorked !== undefined) {
        const response = await api.patch(`/tickets/${ticket._id}/hours`, {
          hoursWorked: updates.hoursWorked
        });
        setTicket(response.data);
        setHoursInput(response.data.hoursWorked?.toString() || '');
      } else {
        const response = await api.put(`/tickets/${ticket._id}`, updates);
        setTicket(response.data);
      }
      await fetchTicket();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update ticket');
      // Reset hours input on error
      if (updates.hoursWorked !== undefined) {
        setHoursInput(ticket.hoursWorked?.toString() || '');
      }
    }
  };

  const handleOpenParentTicket = () => {
    if (ticket.parentTicket) {
      const parentId = typeof ticket.parentTicket === 'object' 
        ? ticket.parentTicket._id 
        : ticket.parentTicket;
      navigate(`/workspace/${workspaceId}/ticket/${parentId}`);
    }
  };

  const handleOpenSubtask = (subtask) => {
    navigate(`/workspace/${workspaceId}/ticket/${subtask._id}`);
  };

  const formatAction = (action) => {
    switch (action) {
      case 'created': return 'created this ticket';
      case 'status_changed': return 'changed status';
      case 'assigned': return 'changed assignee';
      case 'hours_updated': return 'updated hours';
      case 'payment_status_changed': return 'changed payment status';
      case 'commented': return 'commented';
      default: return action;
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

  if (!ticket) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Ticket not found</p>
          <Link to={`/workspace/${workspaceId}`} className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
            ← Back to Workspace
          </Link>
        </div>
      </Layout>
    );
  }

  const completedSubtasks = subtasks.filter(s => s.status === 'completed').length;
  const totalSubtasks = subtasks.length;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Link 
                  to={`/workspace/${workspaceId}`}
                  className="text-gray-600 hover:text-gray-900 flex-shrink-0"
                >
                  ← Back
                </Link>
                <h1 className="text-xl font-bold text-gray-900 flex-shrink-0">{ticket.title}</h1>
                {ticket.ticketNumber && (
                  <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                    {ticket.ticketNumber}
                  </span>
                )}
                <span className={`px-2 py-1 rounded text-xs flex-shrink-0 ${
                  ticket.type === 'story' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {ticket.type === 'story' ? 'Story' : 'Subtask'}
                </span>
                <span className="text-sm text-gray-600 flex-shrink-0">Go Live: {new Date(ticket.goLiveDate).toLocaleDateString()}</span>
                {ticket.type === 'story' && totalSubtasks > 0 && (
                  <span className="text-sm text-gray-600 flex-shrink-0">Subtasks: {completedSubtasks}/{totalSubtasks}</span>
                )}
                {ticket.hoursWorked > 0 && (
                  <span className="text-sm text-gray-600 flex-shrink-0">Hours: {ticket.hoursWorked}</span>
                )}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm text-gray-600">Assignee:</span>
                  <select
                    value={ticket.assignee?._id || (typeof ticket.assignee === 'string' ? ticket.assignee : '')}
                    onChange={(e) => handleTicketUpdate({ assignee: e.target.value })}
                    className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {workspace?.members?.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name || member.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {ticket.type === 'subtask' && ticket.parentTicket && (
                <button
                  onClick={handleOpenParentTicket}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition text-sm flex-shrink-0"
                >
                  View Parent
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <div className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {ticket.description || 'No description provided'}
                </div>
              </div>

              {/* Subtasks */}
              {ticket.type === 'story' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Subtasks</h3>
                  <div className="space-y-3 mb-4">
                    {subtasks.length === 0 ? (
                      <p className="text-gray-500 text-sm">No subtasks yet</p>
                    ) : (
                      subtasks.map((subtask) => (
                        <div
                          key={subtask._id}
                          className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition cursor-pointer"
                          onClick={() => handleOpenSubtask(subtask)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {subtask.ticketNumber && (
                                  <span className="text-xs font-mono text-gray-500 bg-white px-2 py-0.5 rounded">
                                    {subtask.ticketNumber}
                                  </span>
                                )}
                                <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                                  Subtask
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  subtask.status === 'completed' 
                                    ? 'bg-green-100 text-green-800'
                                    : subtask.status === 'in-progress'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {subtask.status}
                                </span>
                              </div>
                              <h4 className="font-semibold text-gray-900">{subtask.title}</h4>
                              {subtask.description && (
                                <p className="text-sm text-gray-600 mt-1">{subtask.description}</p>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSubtask(subtask._id);
                              }}
                              className="text-red-600 hover:text-red-800 text-sm ml-2"
                            >
                              Delete
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                            <div className="flex items-center gap-3">
                              <span>{subtask.assignee?.name || subtask.assignee?.username}</span>
                              {subtask.hoursWorked > 0 && (
                                <span className="bg-gray-200 px-2 py-1 rounded">
                                  {subtask.hoursWorked}h
                                </span>
                              )}
                            </div>
                            {subtask.goLiveDate && (
                              <span>Due: {new Date(subtask.goLiveDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleAddSubtask} className="flex space-x-2">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      placeholder="Add a subtask..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                    <button
                      type="submit"
                      disabled={submitting || !newSubtaskTitle.trim()}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </form>
                </div>
              )}

              {/* Comments */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Comments</h3>
                <div className="space-y-4 mb-4">
                  {comments.length === 0 ? (
                    <p className="text-gray-500 text-sm">No comments yet</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment._id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">
                            {comment.user?.name || comment.user?.username}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleAddComment}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none mb-2"
                    rows="3"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Adding...' : 'Add Comment'}
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">

              {/* Status */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                <select
                  value={ticket.status}
                  onChange={(e) => handleTicketUpdate({ status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Payment Status */}
              {ticket.status === 'completed' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Payment Status</h3>
                  <select
                    value={ticket.paymentStatus}
                    onChange={(e) => handleTicketUpdate({ paymentStatus: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="pending-pay">Pending Pay</option>
                    <option value="billed">Billed</option>
                    <option value="not-applicable">Not Applicable</option>
                  </select>
                </div>
              )}

              {/* Hours Worked */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Hours Worked</h3>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={hoursInput}
                  onChange={(e) => setHoursInput(e.target.value)}
                  onBlur={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    const currentHours = ticket.hoursWorked || 0;
                    if (value !== currentHours) {
                      handleTicketUpdate({ hoursWorked: value });
                    } else {
                      // Reset to original value if unchanged
                      setHoursInput(currentHours.toString());
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.target.blur();
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>

              {/* History */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-3">History</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {history.length === 0 ? (
                    <p className="text-gray-500 text-sm">No history</p>
                  ) : (
                    history.map((item) => (
                      <div key={item._id} className="text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">
                            {item.user?.name || item.user?.username}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700">
                          {item.description || formatAction(item.action)}
                          {item.oldValue && item.newValue && (
                            <span className="text-gray-500">
                              {' '}({item.oldValue} → {item.newValue})
                            </span>
                          )}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TicketDetail;
