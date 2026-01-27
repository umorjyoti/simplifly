import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [isPanelClosing, setIsPanelClosing] = useState(false);
  const [isPanelReady, setIsPanelReady] = useState(false);

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

  // Same panel behaviour as Create Workspace / Deploy: slide in from right, smooth close (double rAF, backdrop fade)
  useEffect(() => {
    if (ticket && !isPanelClosing) {
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsPanelReady(true));
      });
      return () => cancelAnimationFrame(id);
    }
    if (!ticket) {
      setIsPanelReady(false);
    }
  }, [ticket, isPanelClosing]);

  const closeTicketPanel = (afterClose) => {
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const closeDurationMs = prefersReducedMotion ? 0 : 500;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsPanelClosing(true);
        setTimeout(() => {
          onClose?.();
          afterClose?.();
          setIsPanelClosing(false);
          setIsPanelReady(false);
        }, closeDurationMs);
      });
    });
  };

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
    closeTicketPanel(() => navigate(`/workspace/${workspaceId}/ticket/${subtask._id}`));
  };

  const handleOpenFullScreen = () => {
    closeTicketPanel(() => navigate(`/workspace/${workspaceId}/ticket/${ticket._id}`));
  };

  const handleOpenParentTicket = () => {
    if (ticket.parentTicket) {
      const parentId = typeof ticket.parentTicket === 'object'
        ? ticket.parentTicket._id
        : ticket.parentTicket;
      closeTicketPanel(() => navigate(`/workspace/${workspaceId}/ticket/${parentId}`));
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
      default: return 'bg-brand-dark/5 text-brand-dark border-brand-dark/20';
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

  return createPortal(
    <div className="fixed inset-0 z-[70]" onClick={() => closeTicketPanel()}>
      <div
        className={`absolute inset-0 bg-brand-dark/40 backdrop-blur-sm transition-opacity duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:duration-0 ${
          isPanelClosing ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden="true"
      />
      <div
        className={`fixed top-0 right-0 h-screen w-[50vw] bg-white overflow-y-auto sharp-card border-l border-brand-dark/10 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:duration-0 ${
          ticket && !isPanelClosing && isPanelReady ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          boxShadow: '-8px 0 32px rgba(26, 26, 26, 0.12)',
          willChange: ticket && (isPanelClosing || isPanelReady) ? 'transform' : undefined,
        }}
        role="dialog"
        aria-labelledby="ticket-detail-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: brand-dark, sharp, no gradient (frontend-specialist: no purple, solid colors) */}
        <div className="bg-brand-dark px-6 py-5 border-b border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                <h2 id="ticket-detail-title" className="text-xl sm:text-2xl font-bold text-white truncate">
                  {ticket.title}
                </h2>
                {ticket.ticketNumber && (
                  <span className="text-xs sm:text-sm font-mono bg-white/10 text-white px-2.5 py-1 sharp-card border border-white/20 flex-shrink-0">
                    {ticket.ticketNumber}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-white/80">
                <span className={`px-2.5 py-1 sharp-card text-xs font-medium border ${
                  ticket.type === 'story'
                    ? 'bg-white/10 text-white border-white/20'
                    : 'bg-brand-accent/90 text-white border-brand-accent'
                }`}>
                  {ticket.type === 'story' ? 'Story' : 'Subtask'}
                </span>
                {ticket.goLiveDate ? (
                  <span className="bg-white/10 px-2.5 py-1 sharp-card border border-white/20">
                    {new Date(ticket.goLiveDate).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="bg-amber-500/90 text-white px-2.5 py-1 sharp-card border border-amber-400/50">
                    Backlog
                  </span>
                )}
                {ticket.hoursWorked > 0 && (
                  <span className="bg-white/10 px-2.5 py-1 sharp-card border border-white/20">
                    {formatHoursDisplay(ticket.hoursWorked)}
                  </span>
                )}
                {ticket.type === 'story' && totalSubtasks > 0 && (
                  <span className="bg-white/10 px-2.5 py-1 sharp-card border border-white/20">
                    {completedSubtasks}/{totalSubtasks}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleOpenFullScreen}
                className="text-xs sm:text-sm text-white hover:bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 sharp-card border border-white/20 transition-all font-medium"
                title="Open in full screen"
              >
                <span className="hidden sm:inline">Full Screen</span>
                <span className="sm:hidden">↗</span>
              </button>
              {ticket.type === 'subtask' && ticket.parentTicket && (
                <button
                  onClick={handleOpenParentTicket}
                  className="text-xs sm:text-sm text-white hover:bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 sharp-card border border-white/20 transition-all font-medium"
                  title="View parent ticket"
                >
                  <span className="hidden sm:inline">Parent</span>
                  <span className="sm:hidden">↑</span>
                </button>
              )}
              <button
                onClick={() => closeTicketPanel()}
                className="text-white hover:bg-white/10 text-2xl w-10 h-10 flex items-center justify-center sharp-card border border-white/20 transition-all"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <div className="sharp-card border border-brand-dark/10 bg-white p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-brand-accent"></div>
                    <h3 className="font-semibold text-brand-dark text-lg">Description</h3>
                  </div>
                  <div className="text-brand-dark/80 p-4 border border-brand-dark/10 leading-relaxed whitespace-pre-wrap">
                    {ticket.description || (
                      <span className="text-brand-dark/40 italic">No description provided</span>
                    )}
                  </div>
                </div>

                {/* Subtasks */}
                {ticket.type === 'story' && (
                  <div className="sharp-card border border-brand-dark/10 bg-white p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-brand-accent"></div>
                        <h3 className="font-semibold text-brand-dark text-lg">Subtasks</h3>
                        {totalSubtasks > 0 && (
                          <span className="text-xs font-medium text-brand-dark/60 bg-brand-dark/5 px-2.5 py-1 sharp-card border border-brand-dark/10">
                            {completedSubtasks}/{totalSubtasks} completed
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3 mb-4">
                      {subtasks.length === 0 ? (
                        <div className="text-center py-8 text-brand-dark/40">
                          <p className="text-sm">No subtasks yet</p>
                        </div>
                      ) : (
                        subtasks.map((subtask) => (
                          <div
                            key={subtask._id}
                            className="group sharp-card border border-brand-dark/10 bg-white p-4 hover:border-brand-accent transition-all cursor-pointer relative overflow-hidden"
                            onClick={() => handleSubtaskClick(subtask)}
                          >
                            <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  {subtask.ticketNumber && (
                                    <span className="text-xs font-mono text-brand-dark/60 bg-brand-dark/5 px-2 py-0.5 sharp-card border border-brand-dark/10">
                                      {subtask.ticketNumber}
                                    </span>
                                  )}
                                  <span className="text-xs px-2 py-0.5 sharp-card bg-brand-accent/10 text-brand-accent font-medium border border-brand-accent/30">
                                    Subtask
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 sharp-card font-medium border ${getStatusColor(subtask.status)}`}>
                                    {getStatusIcon(subtask.status)} {subtask.status}
                                  </span>
                                </div>
                                <h4 className="font-semibold text-brand-dark mb-1">{subtask.title}</h4>
                                {subtask.description && (
                                  <p className="text-sm text-brand-dark/70 mt-1 line-clamp-2">{subtask.description}</p>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSubtask(subtask._id);
                                }}
                                className="text-brand-accent hover:bg-brand-accent/10 p-1.5 sharp-card transition-all ml-2 flex-shrink-0"
                                title="Delete subtask"
                              >
                                ×
                              </button>
                            </div>
                            <div className="flex items-center justify-between text-xs text-brand-dark/60 mt-3 pt-3 border-t border-brand-dark/10">
                              <div className="flex items-center gap-3">
                                {subtask.assignee && (
                                  <div className="flex items-center gap-2">
                                    <UserAvatar user={subtask.assignee} />
                                    <span className="font-medium">{subtask.assignee?.name || subtask.assignee?.username}</span>
                                  </div>
                                )}
                                {subtask.hoursWorked > 0 && (
                                  <span className="bg-brand-dark/5 px-2 py-1 sharp-card font-medium border border-brand-dark/10">
                                    {formatHoursDisplay(subtask.hoursWorked)}
                                  </span>
                                )}
                              </div>
                              {subtask.goLiveDate && (
                                <span className="text-brand-dark/60">{new Date(subtask.goLiveDate).toLocaleDateString()}</span>
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
                        className="flex-1 px-4 py-2.5 border border-brand-dark/20 sharp-card focus:ring-2 focus:ring-brand-dark focus:border-brand-dark outline-none bg-white text-brand-dark placeholder-brand-dark/40"
                      />
                      <button
                        type="submit"
                        disabled={submitting || !newSubtaskTitle.trim()}
                        className="bg-brand-dark text-white px-5 py-2.5 sharp-card hover:bg-brand-dark/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {submitting ? '...' : 'Add'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Comments */}
                <div className="sharp-card border border-brand-dark/10 bg-white p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-brand-dark"></div>
                    <h3 className="font-semibold text-brand-dark text-lg">Comments</h3>
                    {comments.length > 0 && (
                      <span className="text-xs font-medium text-brand-dark/60 bg-brand-dark/5 px-2.5 py-1 sharp-card border border-brand-dark/10">
                        {comments.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                    {comments.length === 0 ? (
                      <div className="text-center py-8 text-brand-dark/40">
                        <p className="text-sm">No comments yet</p>
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment._id} className="sharp-card border border-brand-dark/10 bg-white p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <UserAvatar user={comment.user} />
                              <span className="font-semibold text-brand-dark text-sm">
                                {comment.user?.name || comment.user?.username}
                              </span>
                            </div>
                            <span className="text-xs text-brand-dark/60">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-brand-dark/80 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleAddComment} className="space-y-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full px-4 py-3 border border-brand-dark/20 sharp-card focus:ring-2 focus:ring-brand-dark focus:border-brand-dark outline-none resize-none bg-white text-brand-dark placeholder-brand-dark/40"
                      rows="3"
                    />
                    <button
                      type="submit"
                      disabled={submitting || !newComment.trim()}
                      className="w-full bg-brand-dark text-white px-5 py-2.5 sharp-card hover:bg-brand-dark/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {submitting ? 'Adding comment...' : 'Add Comment'}
                    </button>
                  </form>
                </div>

                {/* History */}
                <div className="sharp-card border border-brand-dark/10 bg-white p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-brand-dark"></div>
                    <h3 className="font-semibold text-brand-dark text-lg">History</h3>
                  </div>
                  {loading ? (
                    <div className="text-sm text-brand-dark/60 text-center py-4">Loading...</div>
                  ) : (
                    <div className="space-y-3">
                      {history.length === 0 ? (
                        <div className="text-center py-6 text-brand-dark/40">
                          <p className="text-sm">No history</p>
                        </div>
                      ) : (
                        history.map((item) => (
                          <div key={item._id} className="text-sm pb-3 border-b border-brand-dark/10 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <UserAvatar user={item.user} />
                                <span className="font-medium text-brand-dark text-xs">
                                  {item.user?.name || item.user?.username}
                                </span>
                              </div>
                              <span className="text-xs text-brand-dark/60">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-brand-dark/80 text-xs ml-12 leading-relaxed">
                              {item.description || formatAction(item.action)}
                              {item.oldValue && item.newValue && (
                                <span className="text-brand-dark/50 ml-1">
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

              {/* Sidebar */}
              <div className="space-y-5">
                {/* Assignee */}
                <div className="sharp-card border border-brand-dark/10 bg-white p-5">
                  <h3 className="font-semibold text-brand-dark mb-3 text-xs uppercase tracking-widest text-brand-dark/70">Assignee</h3>
                  <div className="flex items-center gap-3 mb-3">
                    {assigneeUser && <UserAvatar user={assigneeUser} />}
                    <select
                      value={ticket.assignee?._id || (typeof ticket.assignee === 'string' ? ticket.assignee : '')}
                      onChange={(e) => onUpdate({ assignee: e.target.value })}
                      className="flex-1 px-3 py-2 border border-brand-dark/20 sharp-card focus:ring-2 focus:ring-brand-dark focus:border-brand-dark outline-none text-sm bg-white text-brand-dark"
                    >
                      {workspace?.members?.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name || member.username}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status */}
                <div className="sharp-card border border-brand-dark/10 bg-white p-5">
                  <h3 className="font-semibold text-brand-dark mb-3 text-xs uppercase tracking-widest text-brand-dark/70">Status</h3>
                  <select
                    value={ticket.status}
                    onChange={(e) => onUpdate({ status: e.target.value })}
                    className={`w-full px-4 py-3 border-2 sharp-card focus:ring-2 focus:ring-brand-dark focus:border-brand-dark outline-none font-medium text-sm ${getStatusColor(ticket.status)}`}
                  >
                    <option value="todo">○ To Do</option>
                    <option value="in-progress">⟳ In Progress</option>
                    <option value="completed">✓ Completed</option>
                  </select>
                </div>

                {/* Payment Status */}
                {ticket.status === 'completed' && (
                  <div className="sharp-card border border-brand-dark/10 bg-white p-5">
                    <h3 className="font-semibold text-brand-dark mb-3 text-xs uppercase tracking-widest text-brand-dark/70">Payment Status</h3>
                    <select
                      value={ticket.paymentStatus}
                      onChange={(e) => onUpdate({ paymentStatus: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-brand-dark/20 sharp-card focus:ring-2 focus:ring-brand-dark focus:border-brand-dark outline-none font-medium text-sm bg-white text-brand-dark"
                    >
                      <option value="pending-pay">⏳ Pending Pay</option>
                      <option value="billed">💰 Billed</option>
                      <option value="not-applicable">➖ Not Applicable</option>
                    </select>
                  </div>
                )}

                {/* Go Live Date */}
                <div className="sharp-card border border-brand-dark/10 bg-white p-5">
                  <h3 className="font-semibold text-brand-dark mb-3 text-xs uppercase tracking-widest text-brand-dark/70">Go Live Date</h3>
                  <input
                    type="date"
                    value={ticket.goLiveDate ? new Date(ticket.goLiveDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      onUpdate({ goLiveDate: value ? new Date(value) : null });
                    }}
                    className="w-full px-4 py-3 border-2 border-brand-dark/20 sharp-card focus:ring-2 focus:ring-brand-dark focus:border-brand-dark outline-none text-sm bg-white text-brand-dark"
                  />
                  {ticket.goLiveDate && (
                    <button
                      onClick={() => onUpdate({ goLiveDate: null })}
                      className="mt-3 w-full text-xs text-brand-accent hover:bg-brand-accent/10 px-3 py-2 sharp-card font-medium border border-brand-accent/30 hover:border-brand-accent transition-all"
                    >
                      Move to backlog
                    </button>
                  )}
                </div>

                {/* Hours Worked */}
                <div className="sharp-card border border-brand-dark/10 bg-white p-5">
                  <h3 className="font-semibold text-brand-dark mb-4 text-xs uppercase tracking-widest text-brand-dark/70">Hours Worked</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-brand-dark/70 mb-2">Hours</label>
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
                        className="w-full px-3 py-2.5 border-2 border-brand-dark/20 sharp-card focus:ring-2 focus:ring-brand-dark focus:border-brand-dark outline-none text-sm bg-white text-brand-dark"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-dark/70 mb-2">Minutes</label>
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
                        className="w-full px-3 py-2.5 border-2 border-brand-dark/20 sharp-card focus:ring-2 focus:ring-brand-dark focus:border-brand-dark outline-none text-sm bg-white text-brand-dark"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  {ticket.hoursWorked > 0 && (
                    <div className="mt-3 pt-3 border-t border-brand-dark/10">
                      <div className="text-xs text-brand-dark/60">Total: <span className="font-semibold text-brand-dark">{formatHoursDisplay(ticket.hoursWorked)}</span></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ,
  document.body
  );
};

export default TicketDetailModal;
