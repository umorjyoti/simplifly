import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const TicketDetailModal = ({ ticket, workspace, onClose, onUpdate }) => {
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtask, setEditingSubtask] = useState(null);
  const [editSubtaskTitle, setEditSubtaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ticket) {
      fetchComments();
      fetchHistory();
      fetchSubtasks();
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
      const response = await api.get(`/subtasks/ticket/${ticket._id}`);
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
      await fetchHistory(); // Refresh history to show new comment
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    setSubmitting(true);
    try {
      const response = await api.post('/subtasks', {
        ticketId: ticket._id,
        title: newSubtaskTitle,
        order: subtasks.length
      });
      setSubtasks([...subtasks, response.data]);
      setNewSubtaskTitle('');
      await fetchHistory();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add subtask');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSubtask = async (subtaskId, completed) => {
    try {
      const response = await api.put(`/subtasks/${subtaskId}`, { completed: !completed });
      setSubtasks(subtasks.map(s => s._id === subtaskId ? response.data : s));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update subtask');
    }
  };

  const handleEditSubtask = async (subtaskId) => {
    if (!editSubtaskTitle.trim()) {
      setEditingSubtask(null);
      setEditSubtaskTitle('');
      return;
    }

    try {
      const response = await api.put(`/subtasks/${subtaskId}`, { title: editSubtaskTitle });
      setSubtasks(subtasks.map(s => s._id === subtaskId ? response.data : s));
      setEditingSubtask(null);
      setEditSubtaskTitle('');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update subtask');
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!window.confirm('Are you sure you want to delete this subtask?')) return;

    try {
      await api.delete(`/subtasks/${subtaskId}`);
      setSubtasks(subtasks.filter(s => s._id !== subtaskId));
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

  if (!ticket) return null;

  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const totalSubtasks = subtasks.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{ticket.title}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Go Live: {new Date(ticket.goLiveDate).toLocaleDateString()}</span>
              {ticket.hoursWorked > 0 && <span>Hours: {ticket.hoursWorked}</span>}
              {totalSubtasks > 0 && (
                <span>Subtasks: {completedSubtasks}/{totalSubtasks}</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="col-span-2 space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <div className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {ticket.description || 'No description provided'}
                </div>
              </div>

              {/* Subtasks */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Subtasks</h3>
                <div className="space-y-2 mb-4">
                  {subtasks.length === 0 ? (
                    <p className="text-gray-500 text-sm">No subtasks yet</p>
                  ) : (
                    subtasks.map((subtask) => (
                      <div
                        key={subtask._id}
                        className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg"
                      >
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() => handleToggleSubtask(subtask._id, subtask.completed)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        {editingSubtask === subtask._id ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <input
                              type="text"
                              value={editSubtaskTitle}
                              onChange={(e) => setEditSubtaskTitle(e.target.value)}
                              onBlur={() => handleEditSubtask(subtask._id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleEditSubtask(subtask._id);
                                } else if (e.key === 'Escape') {
                                  setEditingSubtask(null);
                                  setEditSubtaskTitle('');
                                }
                              }}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <>
                            <span
                              className={`flex-1 cursor-pointer ${
                                subtask.completed
                                  ? 'line-through text-gray-500'
                                  : 'text-gray-900'
                              }`}
                              onClick={() => {
                                setEditingSubtask(subtask._id);
                                setEditSubtaskTitle(subtask.title);
                              }}
                            >
                              {subtask.title}
                            </span>
                            <button
                              onClick={() => handleDeleteSubtask(subtask._id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </>
                        )}
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

              {/* Comments */}
              <div>
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
              {/* Assignee */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Assignee</h3>
                <select
                  value={ticket.assignee?._id || (typeof ticket.assignee === 'string' ? ticket.assignee : '')}
                  onChange={(e) => onUpdate({ assignee: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  {workspace?.members?.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name || member.username}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                <select
                  value={ticket.status}
                  onChange={(e) => onUpdate({ status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Payment Status */}
              {ticket.status === 'completed' && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Payment Status</h3>
                  <select
                    value={ticket.paymentStatus}
                    onChange={(e) => onUpdate({ paymentStatus: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="pending-pay">Pending Pay</option>
                    <option value="billed">Billed</option>
                    <option value="not-applicable">Not Applicable</option>
                  </select>
                </div>
              )}

              {/* Hours Worked */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Hours Worked</h3>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={ticket.hoursWorked || ''}
                  onBlur={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    if (value !== ticket.hoursWorked) {
                      onUpdate({ hoursWorked: value });
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>

              {/* History */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">History</h3>
                {loading ? (
                  <div className="text-sm text-gray-500">Loading...</div>
                ) : (
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
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;
