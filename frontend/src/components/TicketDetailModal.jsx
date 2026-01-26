import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { hoursMinutesToDecimal, decimalToHoursMinutes, formatHoursDisplay } from '../utils/timeUtils';
import UserAvatar from './UserAvatar';

const TicketDetailModal = ({ ticket, workspace, onClose, onUpdate, workspaceId: propWorkspaceId }) => {
  const navigate = useNavigate();
  const params = useParams();
  const workspaceId = propWorkspaceId || params.id || params.workspaceId;
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
    if (ticket) {
      fetchComments();
      fetchHistory();
      fetchSubtasks();
      const { hours, minutes } = decimalToHoursMinutes(ticket.hoursWorked || 0);
      setHoursInput(hours.toString());
      setMinutesInput(minutes.toString());
    }
  }, [ticket]);

  const fetchComments = async () => {
    try {
      const response = await api.get(`/comments/ticket/${ticket._id}`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get(`/tickets/${ticket._id}/history`);
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubtasks = async () => {
    try {
      const response = await api.get(`/tickets/${ticket._id}/subtasks`);
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
      const defaultGoLiveDate = ticket.goLiveDate ? new Date(ticket.goLiveDate).toISOString().split('T')[0] : null;

      const workspaceId = typeof ticket.workspace === 'object' 
        ? ticket.workspace._id 
        : ticket.workspace;

      const payload = {
        title: newSubtaskTitle,
        description: '',
        assignee: defaultAssignee,
        workspace: workspaceId,
        type: 'subtask',
        parentTicket: ticket._id
      };
      
      if (defaultGoLiveDate) {
        payload.goLiveDate = defaultGoLiveDate;
      }

      const response = await api.post('/tickets', payload);
      setSubtasks([...subtasks, response.data]);
      setNewSubtaskTitle('');
      await fetchHistory();
      if (onUpdate) {
        const refreshed = await api.get(`/tickets/${ticket._id}`);
        onUpdate(refreshed.data);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add subtask');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubtaskClick = (subtask) => {
    if (onClose) onClose();
    navigate(`/workspace/${workspaceId}/ticket/${subtask._id}`);
  };

  const handleOpenFullScreen = () => {
    if (onClose) onClose();
    navigate(`/workspace/${workspaceId}/ticket/${ticket._id}`);
  };

  const handleOpenParentTicket = () => {
    if (ticket.parentTicket) {
      const parentId = typeof ticket.parentTicket === 'object' 
        ? ticket.parentTicket._id 
        : ticket.parentTicket;
      if (onClose) onClose();
      navigate(`/workspace/${workspaceId}/ticket/${parentId}`);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!window.confirm('Are you sure you want to delete this subtask?')) return;

    try {
      await api.delete(`/tickets/${subtaskId}`);
      setSubtasks(subtasks.filter(s => s._id !== subtaskId));
      await fetchHistory();
      if (onUpdate) {
        const refreshed = await api.get(`/tickets/${ticket._id}`);
        onUpdate(refreshed.data);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete subtask');
    }
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

  if (!ticket) return null;

  const completedSubtasks = subtasks.filter(s => s.status === 'completed').length;
  const totalSubtasks = subtasks.length;
  const assigneeUser = workspace?.members?.find(m => m._id === (ticket.assignee?._id || ticket.assignee));

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-none shadow-2xl w-full max-w-6xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-300">
        {/* Modern Header with Gradient */}
        <div className="relative bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 px-4 sm:px-6 py-4 sm:py-5">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
          <div className="relative flex flex-col sm:flex-row justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-none truncate">
                  {ticket.title}
                </h2>
                {ticket.ticketNumber && (
                  <span className="text-xs sm:text-sm text-primary-100 font-mono bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-none border border-white/30 flex-shrink-0">
                    {ticket.ticketNumber}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-primary-50">
                <span className={`px-2.5 py-1 rounded-none text-xs font-medium backdrop-blur-sm border ${
                  ticket.type === 'story' 
                    ? 'bg-white/20 text-white border-white/30' 
                    : 'bg-purple-500/80 text-white border-purple-400/50'
                }`}>
                  {ticket.type === 'story' ? '📖 Story' : '📋 Subtask'}
                </span>
                {ticket.goLiveDate ? (
                  <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-none border border-white/30">
                    📅 {new Date(ticket.goLiveDate).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="bg-amber-500/80 backdrop-blur-sm px-2.5 py-1 rounded-none border border-amber-400/50">
                    📦 Backlog
                  </span>
                )}
                {ticket.hoursWorked > 0 && (
                  <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-none border border-white/30">
                    ⏱️ {formatHoursDisplay(ticket.hoursWorked)}
                  </span>
                )}
                {ticket.type === 'story' && totalSubtasks > 0 && (
                  <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-none border border-white/30">
                    ✅ {completedSubtasks}/{totalSubtasks}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleOpenFullScreen}
                className="text-xs sm:text-sm text-white hover:text-primary-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-none hover:bg-white/20 backdrop-blur-sm border border-white/30 transition-all duration-200 font-medium"
                title="Open in full screen"
              >
                <span className="hidden sm:inline">🔍 Full Screen</span>
                <span className="sm:hidden">🔍</span>
              </button>
              {ticket.type === 'subtask' && ticket.parentTicket && (
                <button
                  onClick={handleOpenParentTicket}
                  className="text-xs sm:text-sm text-white hover:text-primary-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-none hover:bg-white/20 backdrop-blur-sm border border-white/30 transition-all duration-200 font-medium"
                  title="View parent ticket"
                >
                  <span className="hidden sm:inline">👆 Parent</span>
                  <span className="sm:hidden">👆</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="text-white hover:text-primary-50 text-2xl sm:text-3xl w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-none hover:bg-white/20 backdrop-blur-sm border border-white/30 transition-all duration-200"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Content with Scroll */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Description Card */}
                <div className="bg-white rounded-none shadow-none border border-gray-200/60 p-5 sm:p-6 hover:shadow-none transition-shadow duration-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-primary-500 to-primary-600 rounded-none"></div>
                    <h3 className="font-semibold text-gray-900 text-lg">Description</h3>
                  </div>
                  <div className="text-gray-700 bg-gradient-to-br from-gray-50 to-white p-4 sm:p-5 rounded-none border border-gray-100 leading-relaxed whitespace-pre-wrap">
                    {ticket.description || (
                      <span className="text-gray-400 italic">No description provided</span>
                    )}
                  </div>
                </div>

                {/* Subtasks Card */}
                {ticket.type === 'story' && (
                  <div className="bg-white rounded-none shadow-none border border-gray-200/60 p-5 sm:p-6 hover:shadow-none transition-shadow duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-none"></div>
                        <h3 className="font-semibold text-gray-900 text-lg">Subtasks</h3>
                        {totalSubtasks > 0 && (
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-none">
                            {completedSubtasks}/{totalSubtasks} completed
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3 mb-4">
                      {subtasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <div className="text-4xl mb-2">📋</div>
                          <p className="text-sm">No subtasks yet</p>
                        </div>
                      ) : (
                        subtasks.map((subtask) => (
                          <div
                            key={subtask._id}
                            className="group bg-gradient-to-br from-gray-50 to-white p-4 rounded-none border border-gray-200 hover:border-primary-300 hover:shadow-none transition-all duration-200 cursor-pointer relative overflow-hidden"
                            onClick={() => handleSubtaskClick(subtask)}
                          >
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary-500 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  {subtask.ticketNumber && (
                                    <span className="text-xs font-mono text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                                      {subtask.ticketNumber}
                                    </span>
                                  )}
                                  <span className="text-xs px-2 py-0.5 rounded-none bg-purple-100 text-purple-800 font-medium border border-purple-200">
                                    Subtask
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-none font-medium border ${getStatusColor(subtask.status)}`}>
                                    {getStatusIcon(subtask.status)} {subtask.status}
                                  </span>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-1">{subtask.title}</h4>
                                {subtask.description && (
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{subtask.description}</p>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSubtask(subtask._id);
                                }}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-none transition-all duration-200 ml-2 flex-shrink-0"
                                title="Delete subtask"
                              >
                                🗑️
                              </button>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-3">
                                {subtask.assignee && (
                                  <div className="flex items-center gap-2">
                                    <UserAvatar user={subtask.assignee} />
                                    <span className="font-medium">{subtask.assignee?.name || subtask.assignee?.username}</span>
                                  </div>
                                )}
                                {subtask.hoursWorked > 0 && (
                                  <span className="bg-gray-100 px-2 py-1 rounded-none font-medium">
                                    ⏱️ {formatHoursDisplay(subtask.hoursWorked)}
                                  </span>
                                )}
                              </div>
                              {subtask.goLiveDate && (
                                <span className="text-gray-500">📅 {new Date(subtask.goLiveDate).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <form onSubmit={handleAddSubtask} className="flex gap-2">
                      <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        placeholder="Add a new subtask..."
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 bg-white"
                      />
                      <button
                        type="submit"
                        disabled={submitting || !newSubtaskTitle.trim()}
                        className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-5 py-2.5 rounded-none hover:from-primary-700 hover:to-primary-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-none hover:shadow-none"
                      >
                        {submitting ? '...' : 'Add'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Comments Card */}
                <div className="bg-white rounded-none shadow-none border border-gray-200/60 p-5 sm:p-6 hover:shadow-none transition-shadow duration-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-none"></div>
                    <h3 className="font-semibold text-gray-900 text-lg">Comments</h3>
                    {comments.length > 0 && (
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-none">
                        {comments.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                    {comments.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <div className="text-4xl mb-2">💬</div>
                        <p className="text-sm">No comments yet</p>
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment._id} className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-none border border-gray-200 hover:shadow-none transition-shadow duration-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <UserAvatar user={comment.user} />
                              <span className="font-semibold text-gray-900 text-sm">
                                {comment.user?.name || comment.user?.username}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleAddComment} className="space-y-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 resize-none bg-white"
                      rows="3"
                    />
                    <button
                      type="submit"
                      disabled={submitting || !newComment.trim()}
                      className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white px-5 py-2.5 rounded-none hover:from-primary-700 hover:to-primary-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-none hover:shadow-none"
                    >
                      {submitting ? 'Adding comment...' : 'Add Comment'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4 sm:space-y-5">
                {/* Assignee Card */}
                <div className="bg-white rounded-none shadow-none border border-gray-200/60 p-5 hover:shadow-none transition-shadow duration-200">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Assignee</h3>
                  <div className="flex items-center gap-3 mb-3">
                    {assigneeUser && <UserAvatar user={assigneeUser} />}
                    <select
                      value={ticket.assignee?._id || (typeof ticket.assignee === 'string' ? ticket.assignee : '')}
                      onChange={(e) => onUpdate({ assignee: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 text-sm bg-white"
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
                <div className="bg-white rounded-none shadow-none border border-gray-200/60 p-5 hover:shadow-none transition-shadow duration-200">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Status</h3>
                  <select
                    value={ticket.status}
                    onChange={(e) => onUpdate({ status: e.target.value })}
                    className={`w-full px-4 py-3 border-2 rounded-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 font-medium text-sm ${getStatusColor(ticket.status)}`}
                  >
                    <option value="todo">○ To Do</option>
                    <option value="in-progress">⟳ In Progress</option>
                    <option value="completed">✓ Completed</option>
                  </select>
                </div>

                {/* Payment Status Card */}
                {ticket.status === 'completed' && (
                  <div className="bg-white rounded-none shadow-none border border-gray-200/60 p-5 hover:shadow-none transition-shadow duration-200">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Payment Status</h3>
                    <select
                      value={ticket.paymentStatus}
                      onChange={(e) => onUpdate({ paymentStatus: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 font-medium text-sm bg-white"
                    >
                      <option value="pending-pay">⏳ Pending Pay</option>
                      <option value="billed">💰 Billed</option>
                      <option value="not-applicable">➖ Not Applicable</option>
                    </select>
                  </div>
                )}

                {/* Go Live Date Card */}
                <div className="bg-white rounded-none shadow-none border border-gray-200/60 p-5 hover:shadow-none transition-shadow duration-200">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Go Live Date</h3>
                  <input
                    type="date"
                    value={ticket.goLiveDate ? new Date(ticket.goLiveDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      onUpdate({ goLiveDate: value ? new Date(value) : null });
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 text-sm bg-white"
                  />
                  {ticket.goLiveDate && (
                    <button
                      onClick={() => onUpdate({ goLiveDate: null })}
                      className="mt-3 w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-none transition-all duration-200 font-medium border border-red-200 hover:border-red-300"
                    >
                      📦 Move to backlog
                    </button>
                  )}
                </div>

                {/* Hours Worked Card */}
                <div className="bg-white rounded-none shadow-none border border-gray-200/60 p-5 hover:shadow-none transition-shadow duration-200">
                  <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">Hours Worked</h3>
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
                            onUpdate({ hoursWorked: decimalHours });
                          }
                        }}
                        className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 text-sm bg-white"
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
                            onUpdate({ hoursWorked: decimalHours });
                          }
                        }}
                        className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 text-sm bg-white"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  {ticket.hoursWorked > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500">Total: <span className="font-semibold text-gray-900">{formatHoursDisplay(ticket.hoursWorked)}</span></div>
                    </div>
                  )}
                </div>

                {/* History Card */}
                <div className="bg-white rounded-none shadow-none border border-gray-200/60 p-5 hover:shadow-none transition-shadow duration-200">
                  <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">History</h3>
                  {loading ? (
                    <div className="text-sm text-gray-500 text-center py-4">Loading...</div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {history.length === 0 ? (
                        <div className="text-center py-6 text-gray-400">
                          <div className="text-3xl mb-2">📜</div>
                          <p className="text-xs">No history</p>
                        </div>
                      ) : (
                        history.map((item) => (
                          <div key={item._id} className="text-sm pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between mb-1.5">
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
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;
