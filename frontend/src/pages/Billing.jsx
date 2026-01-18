import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import { hoursMinutesToDecimal, decimalToHoursMinutes, formatHoursDisplay } from '../utils/timeUtils';

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
  const [workspace, setWorkspace] = useState(null);
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' or 'manual'
  const [manualItemForm, setManualItemForm] = useState({
    title: '',
    description: '',
    hours: '',
    userId: ''
  });

  const getCurrencySymbol = () => {
    const currency = workspace?.settings?.currency || 'USD';
    return currency === 'INR' ? '₹' : '$';
  };

  const handlePrintInvoice = () => {
    if (!bill) return;

    const currencySymbol = getCurrencySymbol();
    
    // Helper function to format hours for print
    const formatHoursForPrint = (decimalHours) => {
      if (!decimalHours || isNaN(decimalHours) || decimalHours === 0) {
        return '0h';
      }
      const hours = Math.floor(decimalHours);
      const minutes = Math.round((decimalHours - hours) * 60);
      if (hours === 0) {
        return `${minutes}m`;
      } else if (minutes === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h ${minutes}m`;
      }
    };
    
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${bill.workspace.name}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
              padding: 0;
              color: #000;
              background: white;
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
            }
            .invoice-container {
              padding: 20mm;
              width: 100%;
              height: 100%;
            }
            .invoice-header {
              margin-bottom: 30px;
            }
            .invoice-title {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 8px;
              color: #111827;
            }
            .invoice-date {
              font-size: 14px;
              color: #6b7280;
            }
            .invoice-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 30px;
            }
            .info-section h3 {
              font-size: 12px;
              font-weight: 500;
              color: #6b7280;
              margin-bottom: 4px;
              text-transform: uppercase;
            }
            .info-section p {
              font-size: 16px;
              font-weight: 600;
              color: #111827;
            }
            .work-items-section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 12px;
              color: #111827;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #e5e7eb;
            }
            thead {
              background-color: #f9fafb;
            }
            th {
              padding: 12px 16px;
              text-align: left;
              font-size: 12px;
              font-weight: 500;
              color: #6b7280;
              text-transform: uppercase;
              border-bottom: 1px solid #e5e7eb;
            }
            th.text-right {
              text-align: right;
            }
            td {
              padding: 12px 16px;
              border-bottom: 1px solid #e5e7eb;
            }
            tbody tr:last-child td {
              border-bottom: none;
            }
            .item-title {
              font-weight: 500;
              color: #111827;
              margin-bottom: 4px;
            }
            .item-description {
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 4px;
            }
            .item-type {
              font-size: 12px;
              color: #9ca3af;
            }
            .text-right {
              text-align: right;
            }
            .summary {
              border-top: 2px solid #e5e7eb;
              padding-top: 16px;
              margin-top: 20px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 14px;
            }
            .summary-label {
              color: #6b7280;
            }
            .summary-value {
              color: #111827;
              font-weight: 600;
            }
            .summary-total {
              border-top: 2px solid #e5e7eb;
              padding-top: 12px;
              margin-top: 12px;
              font-size: 18px;
              font-weight: bold;
            }
            @media print {
              @page {
                size: A4;
                margin: 0;
              }
              body {
                width: 210mm;
                min-height: 297mm;
                margin: 0;
                padding: 0;
              }
              .invoice-container {
                padding: 20mm;
                width: 100%;
                height: 100%;
              }
            }
            @media screen {
              body {
                background: #f3f4f6;
                padding: 20px;
              }
              .invoice-container {
                background: white;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                margin: 0 auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
          <div class="invoice-header">
            <h1 class="invoice-title">Invoice</h1>
            <p class="invoice-date">Generated: ${new Date(bill.generatedAt).toLocaleString()}</p>
          </div>

          <div class="invoice-info">
            <div class="info-section">
              <h3>Workspace</h3>
              <p>${bill.workspace.name}</p>
            </div>
            ${!bill.isAgencyLevel ? `
            <div class="info-section">
              <h3>User</h3>
              <p>${bill.user?.name || bill.user?.username || 'N/A'}</p>
            </div>
            ` : ''}
          </div>

          <div class="work-items-section">
            <h2 class="section-title">Work Items</h2>
            <table>
              <thead>
                <tr>
                  <th>Work Item</th>
                  <th>Hours</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${bill.workItems.map(item => `
                  <tr>
                    <td>
                      <div class="item-title">${item.title}</div>
                      ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
                      <div class="item-type">${item.type === 'manual' ? 'Manual Item' : 'Ticket'}</div>
                    </td>
                    <td>${formatHoursForPrint(item.hours)}</td>
                    <td class="text-right">${currencySymbol}${(item.hours * bill.hourlyRate).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="summary">
            <div class="summary-row">
              <span class="summary-label">Hourly Rate:</span>
              <span class="summary-value">${currencySymbol}${bill.hourlyRate.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Total Items:</span>
              <span class="summary-value">${bill.summary.totalItems}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Total Hours:</span>
              <span class="summary-value">${bill.summary.totalHours}</span>
            </div>
            <div class="summary-row summary-total">
              <span>Total Amount:</span>
              <span>${currencySymbol}${bill.summary.totalAmount.toFixed(2)}</span>
            </div>
          </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
    }
  };

  useEffect(() => {
    fetchWorkspace();
    fetchBillableData();
    fetchManualItems();
  }, [id]);

  const fetchWorkspace = async () => {
    try {
      const response = await api.get(`/workspaces/${id}`);
      setWorkspace(response.data);
    } catch (error) {
      console.error('Error fetching workspace:', error);
    }
  };

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

  const handleSelectAllManualItems = () => {
    setSelectedManualItems(manualItems.map(item => item._id));
  };

  const handleDeselectAllManualItems = () => {
    setSelectedManualItems([]);
  };

  const handleAddManualItem = async () => {
    const hours = parseInt(manualItemForm.hours) || 0;
    const minutes = parseInt(manualItemForm.minutes) || 0;
    
    if (!manualItemForm.title || (hours === 0 && minutes === 0)) {
      alert('Please enter a title and valid hours and/or minutes');
      return;
    }

    const decimalHours = hoursMinutesToDecimal(hours, minutes);

    try {
      await api.post(`/billing/workspace/${id}/manual-item`, {
        title: manualItemForm.title,
        description: manualItemForm.description || '',
        hours: decimalHours,
        userId: manualItemForm.userId || null
      });
      await fetchManualItems();
      setShowAddManualItem(false);
      setManualItemForm({ title: '', description: '', hours: '', minutes: '', userId: '' });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add manual item');
    }
  };

  const handleEditManualItem = async () => {
    const hours = parseInt(manualItemForm.hours) || 0;
    const minutes = parseInt(manualItemForm.minutes) || 0;
    
    if (!editingManualItem || !manualItemForm.title || (hours === 0 && minutes === 0)) {
      alert('Please enter a title and valid hours and/or minutes');
      return;
    }

    const decimalHours = hoursMinutesToDecimal(hours, minutes);

    try {
      await api.put(`/billing/manual-item/${editingManualItem._id}`, {
        title: manualItemForm.title,
        description: manualItemForm.description || '',
        hours: decimalHours,
        userId: manualItemForm.userId || null
      });
      await fetchManualItems();
      setEditingManualItem(null);
      setManualItemForm({ title: '', description: '', hours: '', minutes: '', userId: '' });
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
  const totalSelected = selectedTickets.length + selectedManualItems.length;
  const totalHours = 
    [...displayTickets.filter(t => selectedTickets.includes(t._id)), ...manualItems.filter(m => selectedManualItems.includes(m._id))]
      .reduce((sum, item) => sum + (item.hoursWorked || item.hours || 0), 0);
  const estimatedAmount = totalHours * (parseFloat(hourlyRate) || 0);

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 mt-6">
          <Link to={`/workspace/${id}`} className="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center gap-2 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Workspace
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Invoicing</h1>
          <p className="text-gray-600">Generate professional invoices for completed work</p>
        </div>

        {/* Billing Mode Toggle */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Billing Mode</h2>
                  <p className="text-sm text-gray-600">
                    {isAgencyLevel 
                      ? 'Agency-level: All users with a single hourly rate'
                      : 'User-level: Individual billing with separate rates'}
                  </p>
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAgencyLevel}
                onChange={(e) => handleAgencyLevelToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-semibold text-gray-700">
                {isAgencyLevel ? 'Agency' : 'User'}
              </span>
            </label>
          </div>
        </div>

        {!hasBillableItems ? (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-purple-50/50 rounded-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 p-16 sm:p-20 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-100 mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">No billable items yet</h2>
              <p className="text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
                Complete tickets with hours worked or add manual items to start billing.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar - User Selection (only for user-level) */}
            {!isAgencyLevel && (
              <div className="lg:col-span-3">
                <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Select User
                  </h2>
                  <div className="space-y-2">
                    {billableUsers.map((userData) => {
                      const userInitial = (userData.user.name || userData.user.username || 'U')[0].toUpperCase();
                      const isSelected = selectedUser?.user._id === userData.user._id;
                      
                      return (
                        <button
                          key={userData.user._id}
                          onClick={() => handleUserSelect(userData)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                              isSelected ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {userInitial}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate">
                                {userData.user.name || userData.user.username}
                              </div>
                              <div className="text-sm text-gray-500">
                                {userData.tickets.length} ticket{userData.tickets.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className={isAgencyLevel ? 'lg:col-span-12' : 'lg:col-span-9'}>
              {(isAgencyLevel || selectedUser) && (
                <div className="space-y-6">
                  {/* Tabs */}
                  <div className="bg-white rounded-xl border border-gray-200 p-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab('tickets')}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                          activeTab === 'tickets'
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        Tickets ({displayTickets.length})
                      </button>
                      <button
                        onClick={() => setActiveTab('manual')}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                          activeTab === 'manual'
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        Manual Items ({manualItems.length})
                      </button>
                    </div>
                  </div>

                  {/* Tickets Tab */}
                  {activeTab === 'tickets' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">
                          {isAgencyLevel ? 'All Billable Tickets' : `Tickets for ${selectedUser.user.name || selectedUser.user.username}`}
                        </h2>
                        {displayTickets.length > 0 && (
                          <div className="flex items-center gap-3">
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
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {displayTickets.length === 0 ? (
                          <div className="text-center py-12">
                            <p className="text-gray-500">No billable tickets available</p>
                          </div>
                        ) : (
                          displayTickets.map((ticket) => {
                            const isSelected = selectedTickets.includes(ticket._id);
                            return (
                              <label
                                key={ticket._id}
                                className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleTicketToggle(ticket._id)}
                                  className="mt-1 mr-4 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 mb-1">{ticket.title}</div>
                                  {ticket.description && (
                                    <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                                      {ticket.description}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="font-medium">{formatHoursDisplay(ticket.hoursWorked)}</span>
                                    </div>
                                    {isAgencyLevel && ticket.assignee && (
                                      <div className="flex items-center gap-1.5 text-gray-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span>{ticket.assignee.name || ticket.assignee.username}</span>
                                      </div>
                                    )}
                                    <div className="text-gray-500">
                                      {new Date(ticket.completedAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Manual Items Tab */}
                  {activeTab === 'manual' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Manual Bill Items</h2>
                        <div className="flex items-center gap-3">
                          {manualItems.length > 0 && (
                            <>
                              <button
                                onClick={handleSelectAllManualItems}
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                              >
                                Select All
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={handleDeselectAllManualItems}
                                className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                              >
                                Clear
                              </button>
                              <span className="text-gray-300">|</span>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setShowAddManualItem(true);
                              setEditingManualItem(null);
                              setManualItemForm({ title: '', description: '', hours: '', minutes: '', userId: '' });
                            }}
                            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Item
                          </button>
                        </div>
                      </div>

                      {/* Add/Edit Form */}
                      {showAddManualItem && (
                        <div className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                          <h3 className="font-bold text-gray-900 mb-4">
                            {editingManualItem ? 'Edit Manual Item' : 'Add Manual Item'}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Title *
                              </label>
                              <input
                                type="text"
                                value={manualItemForm.title}
                                onChange={(e) => setManualItemForm({ ...manualItemForm, title: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                placeholder="Enter work item title"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Description
                              </label>
                              <textarea
                                value={manualItemForm.description}
                                onChange={(e) => setManualItemForm({ ...manualItemForm, description: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                                placeholder="Enter description (optional)"
                                rows="3"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Hours *
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={manualItemForm.hours}
                                  onChange={(e) => setManualItemForm({ ...manualItemForm, hours: e.target.value })}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Minutes *
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="59"
                                  step="1"
                                  value={manualItemForm.minutes}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setManualItemForm({ ...manualItemForm, minutes: val > 59 ? 59 : val });
                                  }}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            {isAgencyLevel && (
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  User (Optional)
                                </label>
                                <select
                                  value={manualItemForm.userId}
                                  onChange={(e) => setManualItemForm({ ...manualItemForm, userId: e.target.value })}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
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
                          <div className="flex gap-3 mt-4">
                            <button
                              onClick={editingManualItem ? handleEditManualItem : handleAddManualItem}
                              className="flex-1 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition"
                            >
                              {editingManualItem ? 'Update' : 'Add'} Item
                            </button>
                            <button
                              onClick={() => {
                                setShowAddManualItem(false);
                                setEditingManualItem(null);
                                setManualItemForm({ title: '', description: '', hours: '', minutes: '', userId: '' });
                              }}
                              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Manual Items List */}
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {manualItems.length === 0 ? (
                          <div className="text-center py-12">
                            <p className="text-gray-500">No manual items added yet</p>
                          </div>
                        ) : (
                          manualItems.map((item) => {
                            const isSelected = selectedManualItems.includes(item._id);
                            return (
                              <label
                                key={item._id}
                                className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleManualItemToggle(item._id)}
                                  className="mt-1 mr-4 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 mb-1">{item.title}</div>
                                  {item.description && (
                                    <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                                      {item.description}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="font-medium">{formatHoursDisplay(item.hours)}</span>
                                    </div>
                                    {item.user && (
                                      <div className="flex items-center gap-1.5 text-gray-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span>{item.user.name || item.user.username}</span>
                                      </div>
                                    )}
                                    {!item.user && isAgencyLevel && (
                                      <span className="text-primary-600 font-medium">Agency Level</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditManualItem(item);
                                    }}
                                    className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteManualItem(item._id);
                                    }}
                                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bill Generation Panel */}
                  {totalSelected > 0 && (
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6 text-white">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-xl font-bold mb-1">Generate Invoice</h2>
                          <p className="text-gray-300 text-sm">
                            {totalSelected} item{totalSelected !== 1 ? 's' : ''} selected • {totalHours.toFixed(1)}h total
                          </p>
                        </div>
                        {estimatedAmount > 0 && (
                          <div className="text-right">
                            <div className="text-sm text-gray-300 mb-1">Estimated Amount</div>
                            <div className="text-2xl font-bold">{getCurrencySymbol()}{estimatedAmount.toFixed(2)}</div>
                          </div>
                        )}
                      </div>
                      <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-200 mb-2">
                          Hourly Rate ({getCurrencySymbol()})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={hourlyRate}
                          onChange={(e) => setHourlyRate(e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/50 outline-none text-white placeholder-gray-400"
                          placeholder="Enter hourly rate"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleGenerateBill}
                          className="flex-1 px-6 py-3 bg-white text-gray-900 rounded-lg font-bold hover:bg-gray-100 transition flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Generate Invoice
                        </button>
                        <button
                          onClick={handleMarkAsBilled}
                          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
                        >
                          Mark as Billed
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Invoice Display */}
                  {bill && (
                    <div className="bg-white rounded-xl border-2 border-primary-200 shadow-xl p-8">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                        <div>
                          <h2 className="text-3xl font-bold text-gray-900 mb-2">Invoice</h2>
                          <p className="text-gray-500 text-sm">
                            Generated: {new Date(bill.generatedAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={handlePrintInvoice}
                          className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Print / Save PDF
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 pb-8 border-b border-gray-200">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Workspace</h3>
                          <p className="text-lg font-bold text-gray-900">{bill.workspace.name}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                            {bill.isAgencyLevel ? 'Billing Type' : 'User'}
                          </h3>
                          <p className="text-lg font-bold text-gray-900">
                            {bill.isAgencyLevel ? 'Agency Level' : (bill.user?.name || bill.user?.username || 'N/A')}
                          </p>
                        </div>
                      </div>

                      <div className="mb-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Work Items</h3>
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                  Work Item
                                </th>
                                {bill.isAgencyLevel && (
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    User
                                  </th>
                                )}
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                  Hours
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                  Amount
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {bill.workItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4">
                                    <div className="font-semibold text-gray-900">{item.title}</div>
                                    {item.description && (
                                      <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                                    )}
                                    <div className="text-xs text-gray-400 mt-1">
                                      {item.type === 'manual' ? 'Manual Item' : 'Ticket'}
                                    </div>
                                  </td>
                                  {bill.isAgencyLevel && (
                                    <td className="px-6 py-4 text-gray-700">
                                      {item.user ? (item.user.name || item.user.username) : 'Agency'}
                                    </td>
                                  )}
                                  <td className="px-6 py-4 text-gray-700 font-medium">
                                    {formatHoursDisplay(item.hours)}
                                  </td>
                                  <td className="px-6 py-4 text-right text-gray-900 font-bold">
                                    {getCurrencySymbol()}{(item.hours * bill.hourlyRate).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Hourly Rate:</span>
                            <span className="text-gray-900 font-bold">{getCurrencySymbol()}{bill.hourlyRate.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Total Items:</span>
                            <span className="text-gray-900 font-bold">{bill.summary.totalItems}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Total Hours:</span>
                            <span className="text-gray-900 font-bold">{bill.summary.totalHours}</span>
                          </div>
                          <div className="pt-3 border-t-2 border-gray-300">
                            <div className="flex justify-between items-center">
                              <span className="text-xl font-bold text-gray-900">Total Amount:</span>
                              <span className="text-2xl font-bold text-gray-900">{getCurrencySymbol()}{bill.summary.totalAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(!isAgencyLevel && !selectedUser) && (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">Select a user to view their billable items</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Billing;
