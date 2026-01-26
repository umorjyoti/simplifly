import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import { hoursMinutesToDecimal, decimalToHoursMinutes, formatHoursDisplay } from '../utils/timeUtils';
import UserAvatar from '../components/UserAvatar';

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
  const [minutesInput, setMinutesInput] = useState('');

  useEffect(() => {
    fetchTicket();
    fetchWorkspace();
  }, [ticketId, workspaceId]);

  useEffect(() => {
    if (ticket) {
      const { hours, minutes } = decimalToHoursMinutes(ticket.hoursWorked || 0);
      setHoursInput(hours.toString());
      setMinutesInput(minutes.toString());
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'in-progress': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✓';
      case 'in-progress': return '⟳';
      default: return '○';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-brand-accent mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading ticket...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <p className="text-gray-600 font-medium mb-4">Ticket not found</p>
            <Link 
              to={`/workspace/${workspaceId}`} 
              className="inline-flex items-center gap-2 text-brand-accent hover:text-primary-700 font-medium transition-colors"
            >
              ← Back to Workspace
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const completedSubtasks = subtasks.filter(s => s.status === 'completed').length;
  const totalSubtasks = subtasks.length;
  const assigneeUser = workspace?.members?.find(m => m._id === (ticket.assignee?._id || ticket.assignee));

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Modern Sticky Header */}
        <div className="sticky top-0 z-20 bg-transparent/80 backdrop-blur-lg border-b border-gray-200/60 shadow-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <div className="flex flex-col gap-4">
                {/* Top Navigation */}
                <div className="flex items-center justify-between gap-3">
                  <Link 
                    to={`/workspace/${workspaceId}`}
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm group"
                  >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                    <span>Back to Workspace</span>
                  </Link>
                  {ticket.type === 'subtask' && ticket.parentTicket && (
                    <button
                      onClick={handleOpenParentTicket}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-none hover:from-blue-700 hover:to-blue-600 transition-all duration-200 font-medium text-sm shadow-none hover:shadow-none"
                    >
                      <span>👆</span>
                      <span className="hidden sm:inline">View Parent Ticket</span>
                      <span className="sm:hidden">Parent</span>
                    </button>
                  )}
                </div>

                {/* Ticket Title and Meta */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{ticket.title}</h1>
                    {ticket.ticketNumber && (
                      <span className="text-sm text-gray-600 font-mono bg-gray-100 px-3 py-1.5 rounded-none border border-gray-200">
                        {ticket.ticketNumber}
                      </span>
                    )}
                    <span className={`px-3 py-1.5 rounded-none text-sm font-medium border ${
                      ticket.type === 'story' 
                        ? 'bg-blue-100 text-blue-800 border-blue-200' 
                        : 'bg-purple-100 text-purple-800 border-purple-200'
                    }`}>
                      {ticket.type === 'story' ? '📖 Story' : '📋 Subtask'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    {ticket.goLiveDate ? (
                      <span className="inline-flex items-center gap-1.5 bg-transparent px-3 py-1.5 rounded-none border border-gray-200">
                        <span>📅</span>
                        <span>{new Date(ticket.goLiveDate).toLocaleDateString()}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-none border border-amber-200 text-amber-800">
                        <span>📦</span>
                        <span>Backlog</span>
                      </span>
                    )}
                    {ticket.type === 'story' && totalSubtasks > 0 && (
                      <span className="inline-flex items-center gap-1.5 bg-transparent px-3 py-1.5 rounded-none border border-gray-200">
                        <span>✅</span>
                        <span>{completedSubtasks}/{totalSubtasks} subtasks</span>
                      </span>
                    )}
                    {ticket.hoursWorked > 0 && (
                      <span className="inline-flex items-center gap-1.5 bg-transparent px-3 py-1.5 rounded-none border border-gray-200">
                        <span>⏱️</span>
                        <span>{formatHoursDisplay(ticket.hoursWorked)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description Card */}
              <div className="bg-transparent rounded-2xl shadow-none border border-gray-200/60 p-6 sm:p-8 hover:shadow-none transition-all duration-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-8 bg-gradient-to-b from-brand-accent to-brand-accent rounded-full"></div>
                  <h2 className="font-bold text-gray-900 text-xl">Description</h2>
                </div>
                <div className="text-gray-700 bg-gradient-to-br from-gray-50 to-white p-5 sm:p-6 rounded-none border border-gray-100 leading-relaxed whitespace-pre-wrap text-base">
                  {ticket.description || (
                    <span className="text-gray-400 italic">No description provided</span>
                  )}
                </div>
              </div>

              {/* Subtasks Card */}
              {ticket.type === 'story' && (
                <div className="bg-transparent rounded-2xl shadow-none border border-gray-200/60 p-6 sm:p-8 hover:shadow-none transition-all duration-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
                      <h2 className="font-bold text-gray-900 text-xl">Subtasks</h2>
                      {totalSubtasks > 0 && (
                        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                          {completedSubtasks}/{totalSubtasks} completed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4 mb-6">
                    {subtasks.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <div className="text-5xl mb-3">📋</div>
                        <p className="text-sm font-medium">No subtasks yet</p>
                        <p className="text-xs mt-1">Add your first subtask to break down this story</p>
                      </div>
                    ) : (
                      subtasks.map((subtask) => (
                        <div
                          key={subtask._id}
                          className="group bg-gradient-to-br from-gray-50 to-white p-5 rounded-none border border-gray-200 hover:border-primary-300 hover:shadow-none transition-all duration-200 cursor-pointer relative overflow-hidden"
                          onClick={() => handleOpenSubtask(subtask)}
                        >
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-brand-accent to-brand-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-3 flex-wrap">
                                {subtask.ticketNumber && (
                                  <span className="text-xs font-mono text-gray-500 bg-transparent px-2.5 py-1 rounded-none border border-gray-200">
                                    {subtask.ticketNumber}
                                  </span>
                                )}
                                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-medium border border-purple-200">
                                  Subtask
                                </span>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getStatusColor(subtask.status)}`}>
                                  {getStatusIcon(subtask.status)} {subtask.status}
                                </span>
                              </div>
                              <h3 className="font-semibold text-gray-900 text-base mb-2">{subtask.title}</h3>
                              {subtask.description && (
                                <p className="text-sm text-gray-600 line-clamp-2">{subtask.description}</p>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSubtask(subtask._id);
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-none transition-all duration-200 ml-3 flex-shrink-0"
                              title="Delete subtask"
                            >
                              🗑️
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-4">
                              {subtask.assignee && (
                                <div className="flex items-center gap-2">
                                  <UserAvatar user={subtask.assignee} />
                                  <span className="font-medium">{subtask.assignee?.name || subtask.assignee?.username}</span>
                                </div>
                              )}
                              {subtask.hoursWorked > 0 && (
                                <span className="bg-gray-100 px-3 py-1.5 rounded-full font-medium text-xs">
                                  ⏱️ {formatHoursDisplay(subtask.hoursWorked)}
                                </span>
                              )}
                            </div>
                            {subtask.goLiveDate && (
                              <span className="text-gray-500 text-xs">📅 {new Date(subtask.goLiveDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleAddSubtask} className="flex gap-3">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      placeholder="Add a new subtask..."
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all duration-200 bg-transparent text-sm"
                    />
                    <button
                      type="submit"
                      disabled={submitting || !newSubtaskTitle.trim()}
                      className="bg-gradient-to-r from-brand-accent to-brand-accent text-white px-6 py-3 rounded-none hover:from-primary-700 hover:to-brand-accent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-none hover:shadow-none"
                    >
                      {submitting ? 'Adding...' : 'Add'}
                    </button>
                  </form>
                </div>
              )}

              {/* Comments Card */}
              <div className="bg-transparent rounded-2xl shadow-none border border-gray-200/60 p-6 sm:p-8 hover:shadow-none transition-all duration-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                  <h2 className="font-bold text-gray-900 text-xl">Comments</h2>
                  {comments.length > 0 && (
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                      {comments.length}
                    </span>
                  )}
                </div>
                <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto pr-2">
                  {comments.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-5xl mb-3">💬</div>
                      <p className="text-sm font-medium">No comments yet</p>
                      <p className="text-xs mt-1">Start the conversation</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment._id} className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-none border border-gray-200 hover:shadow-none transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={comment.user} />
                            <span className="font-semibold text-gray-900">
                              {comment.user?.name || comment.user?.username}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap ml-14">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleAddComment} className="space-y-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all duration-200 resize-none bg-transparent text-sm"
                    rows="4"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="w-full bg-gradient-to-r from-brand-accent to-brand-accent text-white px-6 py-3 rounded-none hover:from-primary-700 hover:to-brand-accent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-none hover:shadow-none"
                  >
                    {submitting ? 'Adding comment...' : 'Add Comment'}
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              {/* Assignee Card */}
              <div className="bg-transparent rounded-2xl shadow-none border border-gray-200/60 p-6 hover:shadow-none transition-all duration-200">
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Assignee</h3>
                <div className="flex items-center gap-3 mb-4">
                  {assigneeUser && <UserAvatar user={assigneeUser} />}
                  <select
                    value={ticket.assignee?._id || (typeof ticket.assignee === 'string' ? ticket.assignee : '')}
                    onChange={(e) => handleTicketUpdate({ assignee: e.target.value })}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all duration-200 text-sm bg-transparent font-medium"
                  >
                    {workspace?.members?.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name || member.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Card */}
              <div className="bg-transparent rounded-2xl shadow-none border border-gray-200/60 p-6 hover:shadow-none transition-all duration-200">
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Status</h3>
                <select
                  value={ticket.status}
                  onChange={(e) => handleTicketUpdate({ status: e.target.value })}
                  className={`w-full px-4 py-3 border-2 rounded-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all duration-200 font-medium text-sm ${getStatusColor(ticket.status)}`}
                >
                  <option value="todo">○ To Do</option>
                  <option value="in-progress">⟳ In Progress</option>
                  <option value="completed">✓ Completed</option>
                </select>
              </div>

              {/* Payment Status Card */}
              {ticket.status === 'completed' && (
                <div className="bg-transparent rounded-2xl shadow-none border border-gray-200/60 p-6 hover:shadow-none transition-all duration-200">
                  <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Payment Status</h3>
                  <select
                    value={ticket.paymentStatus}
                    onChange={(e) => handleTicketUpdate({ paymentStatus: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all duration-200 font-medium text-sm bg-transparent"
                  >
                    <option value="pending-pay">⏳ Pending Pay</option>
                    <option value="billed">💰 Billed</option>
                    <option value="not-applicable">➖ Not Applicable</option>
                  </select>
                </div>
              )}

              {/* Go Live Date Card */}
              <div className="bg-transparent rounded-2xl shadow-none border border-gray-200/60 p-6 hover:shadow-none transition-all duration-200">
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Go Live Date</h3>
                <input
                  type="date"
                  value={ticket.goLiveDate ? new Date(ticket.goLiveDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleTicketUpdate({ goLiveDate: value ? new Date(value) : null });
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all duration-200 text-sm bg-transparent font-medium"
                />
                {ticket.goLiveDate && (
                  <button
                    onClick={() => handleTicketUpdate({ goLiveDate: null })}
                    className="mt-4 w-full text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2.5 rounded-none transition-all duration-200 font-medium border-2 border-red-200 hover:border-red-300"
                  >
                    📦 Move to backlog
                  </button>
                )}
              </div>

              {/* Hours Worked Card */}
              <div className="bg-transparent rounded-2xl shadow-none border border-gray-200/60 p-6 hover:shadow-none transition-all duration-200">
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Hours Worked</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Hours</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={hoursInput}
                      onChange={(e) => setHoursInput(e.target.value)}
                      onBlur={() => {
                        const hours = parseInt(hoursInput) || 0;
                        const minutes = parseInt(minutesInput) || 0;
                        const decimalHours = hoursMinutesToDecimal(hours, minutes);
                        const currentHours = ticket.hoursWorked || 0;
                        if (Math.abs(decimalHours - currentHours) > 0.001) {
                          handleTicketUpdate({ hoursWorked: decimalHours });
                        }
                      }}
                      className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all duration-200 text-sm bg-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Minutes</label>
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
                      onBlur={() => {
                        const hours = parseInt(hoursInput) || 0;
                        const minutes = parseInt(minutesInput) || 0;
                        const decimalHours = hoursMinutesToDecimal(hours, minutes);
                        const currentHours = ticket.hoursWorked || 0;
                        if (Math.abs(decimalHours - currentHours) > 0.001) {
                          handleTicketUpdate({ hoursWorked: decimalHours });
                        }
                      }}
                      className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all duration-200 text-sm bg-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>
                {ticket.hoursWorked > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-500">
                      Total: <span className="font-semibold text-gray-900 text-base">{formatHoursDisplay(ticket.hoursWorked)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* History Card */}
              <div className="bg-transparent rounded-2xl shadow-none border border-gray-200/60 p-6 hover:shadow-none transition-all duration-200">
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">History</h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {history.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-4xl mb-2">📜</div>
                      <p className="text-xs font-medium">No history</p>
                    </div>
                  ) : (
                    history.map((item) => (
                      <div key={item._id} className="text-sm pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <UserAvatar user={item.user} />
                            <span className="font-medium text-gray-900 text-xs">
                              {item.user?.name || item.user?.username}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700 text-xs ml-12 leading-relaxed">
                          {item.description || formatAction(item.action)}
                          {item.oldValue && item.newValue && (
                            <span className="text-gray-500 ml-1">
                              ({item.oldValue} → {item.newValue})
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
