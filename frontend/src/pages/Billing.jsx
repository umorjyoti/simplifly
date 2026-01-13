import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';

const Billing = () => {
  const { id } = useParams();
  const [billableUsers, setBillableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [hourlyRate, setHourlyRate] = useState('');
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillableData();
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

  const handleUserSelect = (userData) => {
    setSelectedUser(userData);
    setSelectedTickets([]);
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

  const handleGenerateBill = async () => {
    if (!selectedUser || selectedTickets.length === 0 || !hourlyRate || parseFloat(hourlyRate) <= 0) {
      alert('Please select tickets and enter a valid hourly rate');
      return;
    }

    try {
      const response = await api.post('/billing/generate', {
        workspaceId: id,
        ticketIds: selectedTickets,
        userId: selectedUser.user._id,
        hourlyRate: parseFloat(hourlyRate)
      });
      setBill(response.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to generate bill');
    }
  };

  const handleMarkAsBilled = async () => {
    if (!selectedTickets.length) {
      alert('Please select tickets to mark as billed');
      return;
    }

    try {
      await api.patch('/billing/tickets/status', {
        ticketIds: selectedTickets,
        paymentStatus: 'billed'
      });
      await fetchBillableData();
      setSelectedTickets([]);
      setBill(null);
      setHourlyRate('');
      alert('Tickets marked as billed successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update status');
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

  return (
    <Layout>
      <div className="mb-6">
        <Link to={`/workspace/${id}`} className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
          ← Back to Workspace
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-600 mt-2">Generate bills for completed tasks</p>
      </div>

      {billableUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-lg">No billable tickets found</p>
          <p className="text-gray-400 text-sm mt-2">
            Completed tickets with hours worked will appear here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Selection */}
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

          {/* Ticket Selection & Bill Generation */}
          <div className="lg:col-span-2">
            {selectedUser ? (
              <div className="space-y-6">
                {/* Ticket Selection */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Select Tickets for {selectedUser.user.name || selectedUser.user.username}
                  </h2>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedUser.tickets.map((ticket) => (
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
                            <span>
                              Completed: {new Date(ticket.completedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Bill Generation */}
                {selectedTickets.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Bill</h2>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hourly Rate ($)
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
                        <h3 className="text-sm font-medium text-gray-500 mb-1">User</h3>
                        <p className="text-gray-900 font-semibold">
                          {bill.user.name || bill.user.username}
                        </p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Tasks</h3>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Task
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Hours
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {bill.tickets.map((ticket) => (
                              <tr key={ticket.id}>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-gray-900">{ticket.title}</div>
                                  {ticket.description && (
                                    <div className="text-sm text-gray-500">{ticket.description}</div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                  {ticket.hoursWorked}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                                  ${(ticket.hoursWorked * bill.hourlyRate).toFixed(2)}
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
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">Select a user to view their billable tickets</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Billing;
