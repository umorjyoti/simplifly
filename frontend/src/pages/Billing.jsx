import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';

const Billing = () => {
  const { id } = useParams();
  const [billableUsers, setBillableUsers] = useState([]);
  const [allTickets, setAllTickets] = useState([]);
  const [manualItems, setManualItems] = useState([]);
  const [isAgencyLevel, setIsAgencyLevel] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [selectedManualItems, setSelectedManualItems] = useState([]);
  const [hourlyRate, setHourlyRate] = useState('');
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddManualItem, setShowAddManualItem] = useState(false);
  const [editingManualItem, setEditingManualItem] = useState(null);
  const [manualItemForm, setManualItemForm] = useState({
    title: '',
    description: '',
    hours: '',
    userId: ''
  });

  useEffect(() => {
    fetchBillableData();
    fetchManualItems();
  }, [id]);

  const fetchBillableData = async () => {
    try {
      const response = await api.get(`/billing/workspace/${id}/billable`);
      setBillableUsers(response.data);
    } catch (error) {
      console.error('Error fetching billable data:', error);
      if (error.response?.status === 404) {
        alert('You must be the workspace owner to access billing');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTickets = async () => {
    try {
      const response = await api.get(`/billing/workspace/${id}/billable/all`);
      setAllTickets(response.data);
    } catch (error) {
      console.error('Error fetching all tickets:', error);
    }
  };

  const fetchManualItems = async () => {
    try {
      const response = await api.get(`/billing/workspace/${id}/manual-items`);
      setManualItems(response.data);
    } catch (error) {
      console.error('Error fetching manual items:', error);
    }
  };

  const handleAgencyLevelToggle = (enabled) => {
    setIsAgencyLevel(enabled);
    setSelectedUser(null);
    setSelectedTickets([]);
    setSelectedManualItems([]);
    setBill(null);
    if (enabled) {
      fetchAllTickets();
    }
  };

  const handleUserSelect = (userData) => {
    setSelectedUser(userData);
    setSelectedTickets([]);
    setSelectedManualItems([]);
    setBill(null);
  };

  const handleTicketToggle = (ticketId) => {
    setSelectedTickets(prev => {
      if (prev.includes(ticketId)) {
        return prev.filter(id => id !== ticketId);
      } else {
        return [...prev, ticketId];
      }
    });
  };

  const handleManualItemToggle = (itemId) => {
    setSelectedManualItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleSelectAllTickets = () => {
    const ticketsToSelect = isAgencyLevel 
      ? allTickets.map(t => t._id)
      : selectedUser?.tickets.map(t => t._id) || [];
    setSelectedTickets(ticketsToSelect);
  };

  const handleDeselectAllTickets = () => {
    setSelectedTickets([]);
  };

  const handleAddManualItem = async () => {
    if (!manualItemForm.title || !manualItemForm.hours || parseFloat(manualItemForm.hours) <= 0) {
      alert('Please enter a title and valid hours');
      return;
    }

    try {
      await api.post(`/billing/workspace/${id}/manual-item`, {
        title: manualItemForm.title,
        description: manualItemForm.description || '',
        hours: parseFloat(manualItemForm.hours),
        userId: manualItemForm.userId || null
      });
      await fetchManualItems();
      setShowAddManualItem(false);
      setManualItemForm({ title: '', description: '', hours: '', userId: '' });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add manual item');
    }
  };

  const handleEditManualItem = async () => {
    if (!editingManualItem || !manualItemForm.title || !manualItemForm.hours || parseFloat(manualItemForm.hours) <= 0) {
      alert('Please enter a title and valid hours');
      return;
    }

    try {
      await api.put(`/billing/manual-item/${editingManualItem._id}`, {
        title: manualItemForm.title,
        description: manualItemForm.description || '',
        hours: parseFloat(manualItemForm.hours),
        userId: manualItemForm.userId || null
      });
      await fetchManualItems();
      setEditingManualItem(null);
      setManualItemForm({ title: '', description: '', hours: '', userId: '' });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update manual item');
    }
  };

  const handleDeleteManualItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this manual item?')) {
      return;
    }

    try {
      await api.delete(`/billing/manual-item/${itemId}`);
      await fetchManualItems();
      setSelectedManualItems(prev => prev.filter(id => id !== itemId));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete manual item');
    }
  };

  const handleGenerateBill = async () => {
    const hasTickets = selectedTickets.length > 0;
    const hasManualItems = selectedManualItems.length > 0;

    if ((!hasTickets && !hasManualItems) || !hourlyRate || parseFloat(hourlyRate) <= 0) {
      alert('Please select work items and enter a valid hourly rate');
      return;
    }

    if (!isAgencyLevel && !selectedUser) {
      alert('Please select a user or enable agency-level billing');
      return;
    }

    try {
      const response = await api.post('/billing/generate', {
        workspaceId: id,
        ticketIds: hasTickets ? selectedTickets : [],
        manualItemIds: hasManualItems ? selectedManualItems : [],
        userId: isAgencyLevel ? null : selectedUser.user._id,
        hourlyRate: parseFloat(hourlyRate),
        isAgencyLevel
      });
      setBill(response.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to generate bill');
    }
  };

  const handleMarkAsBilled = async () => {
    if (selectedTickets.length === 0 && selectedManualItems.length === 0) {
      alert('Please select items to mark as billed');
      return;
    }

    try {
      if (selectedTickets.length > 0) {
        await api.patch('/billing/tickets/status', {
          ticketIds: selectedTickets,
          paymentStatus: 'billed'
        });
      }
      // Note: Manual items don't have a payment status, they're just included in bills
      await fetchBillableData();
      if (isAgencyLevel) {
        await fetchAllTickets();
      }
      await fetchManualItems();
      setSelectedTickets([]);
      setSelectedManualItems([]);
      setBill(null);
      setHourlyRate('');
      alert('Items marked as billed successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const openEditManualItem = (item) => {
    setEditingManualItem(item);
    setManualItemForm({
      title: item.title,
      description: item.description || '',
      hours: item.hours.toString(),
      userId: item.user?._id || ''
    });
    setShowAddManualItem(true);
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

  const displayTickets = isAgencyLevel ? allTickets : (selectedUser?.tickets || []);
  const hasBillableItems = billableUsers.length > 0 || allTickets.length > 0 || manualItems.length > 0;

  return (
    <Layout>
      <div className="mb-6">
        <Link to={`/workspace/${id}`} className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
          ← Back to Workspace
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-600 mt-2">Generate bills for completed tasks</p>
      </div>

      {/* Billing Mode Toggle */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Billing Mode</h2>
            <p className="text-sm text-gray-600">
              {isAgencyLevel 
                ? 'Agency-level billing: All users\' work hours with a single hourly rate'
                : 'User-level billing: Individual user billing with separate hourly rates'}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isAgencyLevel}
              onChange={(e) => handleAgencyLevelToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              {isAgencyLevel ? 'Agency Level' : 'User Level'}
            </span>
          </label>
        </div>
      </div>

      {!hasBillableItems ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-lg">No billable items found</p>
          <p className="text-gray-400 text-sm mt-2">
            Completed tickets with hours worked or manual items will appear here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Selection (only for user-level) */}
          {!isAgencyLevel && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Select User</h2>
                <div className="space-y-3">
                  {billableUsers.map((userData) => (
                    <button
                      key={userData.user._id}
                      onClick={() => handleUserSelect(userData)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition ${
                        selectedUser?.user._id === userData.user._id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">
                        {userData.user.name || userData.user.username}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {userData.tickets.length} ticket{userData.tickets.length !== 1 ? 's' : ''}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ticket Selection & Bill Generation */}
          <div className={isAgencyLevel ? 'lg:col-span-3' : 'lg:col-span-2'}>
            <div className="space-y-6">
              {/* Ticket Selection */}
              {(isAgencyLevel || selectedUser) && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {isAgencyLevel 
                        ? 'Select Tickets (All Users)'
                        : `Select Tickets for ${selectedUser.user.name || selectedUser.user.username}`
                      }
                    </h2>
                    {displayTickets.length > 0 && (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSelectAllTickets}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Select All
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={handleDeselectAllTickets}
                          className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                        >
                          Deselect All
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {displayTickets.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No billable tickets available</p>
                    ) : (
                      displayTickets.map((ticket) => (
                        <label
                          key={ticket._id}
                          className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTickets.includes(ticket._id)}
                            onChange={() => handleTicketToggle(ticket._id)}
                            className="mt-1 mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{ticket.title}</div>
                            {ticket.description && (
                              <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {ticket.description}
                              </div>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span>Hours: {ticket.hoursWorked}</span>
                              {isAgencyLevel && ticket.assignee && (
                                <span>User: {ticket.assignee.name || ticket.assignee.username}</span>
                              )}
                              <span>
                                Completed: {new Date(ticket.completedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Manual Items Section */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Manual Bill Items</h2>
                  <button
                    onClick={() => {
                      setShowAddManualItem(true);
                      setEditingManualItem(null);
                      setManualItemForm({ title: '', description: '', hours: '', userId: '' });
                    }}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition text-sm"
                  >
                    + Add Manual Item
                  </button>
                </div>

                {/* Add/Edit Manual Item Form */}
                {showAddManualItem && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      {editingManualItem ? 'Edit Manual Item' : 'Add Manual Item'}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={manualItemForm.title}
                          onChange={(e) => setManualItemForm({ ...manualItemForm, title: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          placeholder="Enter work item title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={manualItemForm.description}
                          onChange={(e) => setManualItemForm({ ...manualItemForm, description: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          placeholder="Enter description (optional)"
                          rows="2"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hours *
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={manualItemForm.hours}
                            onChange={(e) => setManualItemForm({ ...manualItemForm, hours: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            placeholder="0.0"
                          />
                        </div>
                        {isAgencyLevel && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              User (Optional)
                            </label>
                            <select
                              value={manualItemForm.userId}
                              onChange={(e) => setManualItemForm({ ...manualItemForm, userId: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            >
                              <option value="">All Users (Agency)</option>
                              {billableUsers.map((userData) => (
                                <option key={userData.user._id} value={userData.user._id}>
                                  {userData.user.name || userData.user.username}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={editingManualItem ? handleEditManualItem : handleAddManualItem}
                          className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
                        >
                          {editingManualItem ? 'Update' : 'Add'} Item
                        </button>
                        <button
                          onClick={() => {
                            setShowAddManualItem(false);
                            setEditingManualItem(null);
                            setManualItemForm({ title: '', description: '', hours: '', userId: '' });
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Manual Items List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {manualItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No manual items added yet</p>
                  ) : (
                    manualItems.map((item) => (
                      <label
                        key={item._id}
                        className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedManualItems.includes(item._id)}
                          onChange={() => handleManualItemToggle(item._id)}
                          className="mt-1 mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.title}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {item.description}
                            </div>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>Hours: {item.hours}</span>
                            {item.user && (
                              <span>User: {item.user.name || item.user.username}</span>
                            )}
                            {!item.user && isAgencyLevel && (
                              <span className="text-primary-600">Agency Level</span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditManualItem(item);
                            }}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteManualItem(item._id);
                            }}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Bill Generation */}
              {(selectedTickets.length > 0 || selectedManualItems.length > 0) && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Bill</h2>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isAgencyLevel ? 'Agency Hourly Rate ($)' : 'Hourly Rate ($)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="Enter hourly rate"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleGenerateBill}
                      className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
                    >
                      Generate Bill
                    </button>
                    <button
                      onClick={handleMarkAsBilled}
                      className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
                    >
                      Mark as Billed
                    </button>
                  </div>
                </div>
              )}

              {/* Bill Display */}
              {bill && (
                <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-primary-200">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Invoice</h2>
                      <p className="text-gray-500 text-sm mt-1">
                        Generated: {new Date(bill.generatedAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      Print
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Workspace</h3>
                      <p className="text-gray-900 font-semibold">{bill.workspace.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        {bill.isAgencyLevel ? 'Billing Type' : 'User'}
                      </h3>
                      <p className="text-gray-900 font-semibold">
                        {bill.isAgencyLevel ? 'Agency Level' : (bill.user?.name || bill.user?.username || 'N/A')}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Items</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Work Item
                            </th>
                            {bill.isAgencyLevel && (
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                User
                              </th>
                            )}
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Hours
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {bill.workItems.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">{item.title}</div>
                                {item.description && (
                                  <div className="text-sm text-gray-500">{item.description}</div>
                                )}
                                <div className="text-xs text-gray-400 mt-1">
                                  {item.type === 'manual' ? 'Manual Item' : 'Ticket'}
                                </div>
                              </td>
                              {bill.isAgencyLevel && (
                                <td className="px-4 py-3 text-gray-700">
                                  {item.user ? (item.user.name || item.user.username) : 'Agency'}
                                </td>
                              )}
                              <td className="px-4 py-3 text-gray-700">
                                {item.hours}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                                ${(item.hours * bill.hourlyRate).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Hourly Rate:</span>
                      <span className="text-gray-900 font-semibold">${bill.hourlyRate.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Total Items:</span>
                      <span className="text-gray-900 font-semibold">{bill.summary.totalItems}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Total Hours:</span>
                      <span className="text-gray-900 font-semibold">{bill.summary.totalHours}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                      <span>Total Amount:</span>
                      <span>${bill.summary.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Billing;
