import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import { hoursMinutesToDecimal, decimalToHoursMinutes, formatHoursDisplay } from '../utils/timeUtils';
import { initRevealObserver } from '../utils/reveal';

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
    minutes: '',
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

  useEffect(() => {
    if (!loading) {
      return initRevealObserver();
    }
  }, [loading]);

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
    const { hours: h, minutes: m } = decimalToHoursMinutes(item.hours);
    setManualItemForm({
      title: item.title,
      description: item.description || '',
      hours: h.toString(),
      minutes: m.toString(),
      userId: item.user?._id || ''
    });
    setShowAddManualItem(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-12 w-12 border-2 border-brand-dark/20 border-t-brand-accent" aria-label="Loading"></div>
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
      <div className="px-4 sm:px-6 lg:px-8 mb-20">
        {/* Header — industrial, matches WorkspaceDetail */}
        <div className="mb-12 reveal stagger-1">
          <Link
            to={`/workspace/${id}`}
            className="text-brand-dark hover:text-brand-accent transition-colors inline-flex items-center gap-2 mb-6"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-bold uppercase tracking-widest">Back to Workspace</span>
          </Link>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-brand-dark leading-none mb-2">
            Billing & Invoicing
          </h1>
          <p className="text-brand-dark/60 font-medium uppercase tracking-wide text-sm">
            Generate professional invoices for completed work
          </p>
        </div>

        {/* Billing Mode — sharp card, brand palette */}
        <div className="sharp-card bg-white p-6 mb-8 reveal stagger-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 bg-brand-dark text-white flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-brand-dark mb-1">Billing Mode</h2>
                <p className="text-sm text-brand-dark/60 font-medium">
                  {isAgencyLevel
                    ? 'Agency-level: All users with a single hourly rate'
                    : 'User-level: Individual billing with separate rates'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0" aria-label="Toggle billing mode">
              <input
                type="checkbox"
                checked={isAgencyLevel}
                onChange={(e) => handleAgencyLevelToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-brand-dark/10 border-2 border-brand-dark peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-accent peer-focus:ring-offset-2 rounded-sm peer peer-checked:bg-brand-dark after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-2 after:border-brand-dark after:h-5 after:w-5 after:transition-transform after:rounded-sm peer-checked:after:translate-x-7"></div>
              <span className="ml-3 text-xs font-black uppercase tracking-widest text-brand-dark">
                {isAgencyLevel ? 'Agency' : 'User'}
              </span>
            </label>
          </div>
        </div>

        {!hasBillableItems ? (
          <div className="reveal stagger-3 py-32 border-8 border-brand-dark/5 flex flex-col items-center justify-center text-center px-6">
            <div className="inline-flex items-center justify-center w-20 h-20 border-2 border-brand-dark/20 mb-6">
              <svg className="w-10 h-10 text-brand-dark/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-brand-dark/20 mb-4">
              No Billable Items Yet
            </h2>
            <p className="text-brand-dark/60 font-medium max-w-md mb-8 leading-relaxed">
              Complete tickets with hours worked or add manual items to start billing.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar — Select User (user-level only) */}
            {!isAgencyLevel && (
              <div className="lg:col-span-3 reveal stagger-3">
                <div className="sharp-card bg-white p-6 sticky top-4">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-brand-dark/60 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-brand-dark/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Select User
                  </h2>
                  <div className="space-y-3">
                    {billableUsers.map((userData) => {
                      const userInitial = (userData.user.name || userData.user.username || 'U')[0].toUpperCase();
                      const isSelected = selectedUser?.user._id === userData.user._id;
                      return (
                        <button
                          key={userData.user._id}
                          onClick={() => handleUserSelect(userData)}
                          className={`w-full text-left p-4 border-2 transition-all hover-trigger ${
                            isSelected
                              ? 'border-brand-accent bg-brand-accent/5 shadow-[4px_4px_0_0_var(--brand-accent)]'
                              : 'border-brand-dark/20 hover:border-brand-dark bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 flex items-center justify-center font-black text-sm flex-shrink-0 ${
                              isSelected ? 'bg-brand-accent text-white' : 'bg-brand-dark/10 text-brand-dark'
                            }`}>
                              {userInitial}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-brand-dark truncate uppercase tracking-tight">
                                {userData.user.name || userData.user.username}
                              </div>
                              <div className="text-xs font-medium text-brand-dark/60 uppercase tracking-wide">
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
                <div className="space-y-6 reveal stagger-3">
                  {/* Tabs — sharp, brand-dark active */}
                  <div className="sharp-card bg-white p-1 flex gap-1">
                    <button
                      onClick={() => setActiveTab('tickets')}
                      className={`flex-1 px-4 py-3 font-black uppercase tracking-tight text-sm transition-all ${
                        activeTab === 'tickets'
                          ? 'bg-brand-dark text-white'
                          : 'text-brand-dark/60 hover:text-brand-dark hover:bg-brand-dark/5'
                      }`}
                    >
                      Tickets ({displayTickets.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('manual')}
                      className={`flex-1 px-4 py-3 font-black uppercase tracking-tight text-sm transition-all ${
                        activeTab === 'manual'
                          ? 'bg-brand-dark text-white'
                          : 'text-brand-dark/60 hover:text-brand-dark hover:bg-brand-dark/5'
                      }`}
                    >
                      Manual Items ({manualItems.length})
                    </button>
                  </div>

                  {/* Tickets Tab */}
                  {activeTab === 'tickets' && (
                    <div className="sharp-card bg-white p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-black uppercase tracking-tight text-brand-dark">
                          {isAgencyLevel ? 'All Billable Tickets' : `Tickets for ${selectedUser.user.name || selectedUser.user.username}`}
                        </h2>
                        {displayTickets.length > 0 && (
                          <div className="flex items-center gap-4">
                            <button
                              onClick={handleSelectAllTickets}
                              className="text-xs font-bold uppercase tracking-widest text-brand-accent hover:text-brand-dark transition-colors"
                            >
                              Select All
                            </button>
                            <span className="text-brand-dark/20">|</span>
                            <button
                              onClick={handleDeselectAllTickets}
                              className="text-xs font-bold uppercase tracking-widest text-brand-dark/60 hover:text-brand-dark transition-colors"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {displayTickets.length === 0 ? (
                          <div className="text-center py-16 border-2 border-dashed border-brand-dark/10">
                            <p className="text-brand-dark/50 font-medium uppercase tracking-wide text-sm">No billable tickets available</p>
                          </div>
                        ) : (
                          displayTickets.map((ticket) => {
                            const isSelected = selectedTickets.includes(ticket._id);
                            return (
                              <label
                                key={ticket._id}
                                className={`flex items-start p-4 border-2 cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-brand-accent bg-brand-accent/5'
                                    : 'border-brand-dark/20 hover:border-brand-dark/40 bg-white'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleTicketToggle(ticket._id)}
                                  className="mt-1 mr-4 h-5 w-5 text-brand-accent focus:ring-brand-accent border-brand-dark/30 rounded-sm"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-brand-dark mb-1 uppercase tracking-tight">{ticket.title}</div>
                                  {ticket.description && (
                                    <div className="text-sm text-brand-dark/60 mb-3 line-clamp-2 font-medium">
                                      {ticket.description}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-4 text-xs font-medium uppercase tracking-wide text-brand-dark/60">
                                    <div className="flex items-center gap-1.5">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span>{formatHoursDisplay(ticket.hoursWorked)}</span>
                                    </div>
                                    {isAgencyLevel && ticket.assignee && (
                                      <div className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span>{ticket.assignee.name || ticket.assignee.username}</span>
                                      </div>
                                    )}
                                    <span>{new Date(ticket.completedAt).toLocaleDateString()}</span>
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
                    <div className="sharp-card bg-white p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-black uppercase tracking-tight text-brand-dark">Manual Bill Items</h2>
                        <div className="flex items-center gap-4">
                          {manualItems.length > 0 && (
                            <>
                              <button
                                onClick={handleSelectAllManualItems}
                                className="text-xs font-bold uppercase tracking-widest text-brand-accent hover:text-brand-dark transition-colors"
                              >
                                Select All
                              </button>
                              <span className="text-brand-dark/20">|</span>
                              <button
                                onClick={handleDeselectAllManualItems}
                                className="text-xs font-bold uppercase tracking-widest text-brand-dark/60 hover:text-brand-dark transition-colors"
                              >
                                Clear
                              </button>
                              <span className="text-brand-dark/20">|</span>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setShowAddManualItem(true);
                              setEditingManualItem(null);
                              setManualItemForm({ title: '', description: '', hours: '', minutes: '', userId: '' });
                            }}
                            className="px-4 py-2 bg-brand-dark hover:bg-brand-dark/90 text-white font-black uppercase tracking-wide text-sm transition flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Item
                          </button>
                        </div>
                      </div>

                      {/* Add/Edit Form */}
                      {showAddManualItem && (
                        <div className="mb-6 p-6 border-2 border-brand-dark/10 bg-brand-dark/[0.02]">
                          <h3 className="text-sm font-black uppercase tracking-widest text-brand-dark/60 mb-4">
                            {editingManualItem ? 'Edit Manual Item' : 'Add Manual Item'}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-dark/60 mb-2">Title *</label>
                              <input
                                type="text"
                                value={manualItemForm.title}
                                onChange={(e) => setManualItemForm({ ...manualItemForm, title: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-brand-dark/20 focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all text-brand-dark placeholder-brand-dark/40"
                                placeholder="Enter work item title"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-dark/60 mb-2">Description</label>
                              <textarea
                                value={manualItemForm.description}
                                onChange={(e) => setManualItemForm({ ...manualItemForm, description: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-brand-dark/20 focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none resize-none transition-all text-brand-dark placeholder-brand-dark/40"
                                placeholder="Enter description (optional)"
                                rows="3"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-brand-dark/60 mb-2">Hours *</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={manualItemForm.hours}
                                  onChange={(e) => setManualItemForm({ ...manualItemForm, hours: e.target.value })}
                                  className="w-full px-4 py-3 border-2 border-brand-dark/20 focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all text-brand-dark placeholder-brand-dark/40"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-brand-dark/60 mb-2">Minutes *</label>
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
                                  className="w-full px-4 py-3 border-2 border-brand-dark/20 focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all text-brand-dark placeholder-brand-dark/40"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            {isAgencyLevel && (
                              <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-brand-dark/60 mb-2">User (Optional)</label>
                                <select
                                  value={manualItemForm.userId}
                                  onChange={(e) => setManualItemForm({ ...manualItemForm, userId: e.target.value })}
                                  className="w-full px-4 py-3 border-2 border-brand-dark/20 focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all text-brand-dark bg-white"
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
                              className="flex-1 px-6 py-3 bg-brand-dark hover:bg-brand-dark/90 text-white font-bold uppercase tracking-wide transition"
                            >
                              {editingManualItem ? 'Update' : 'Add'} Item
                            </button>
                            <button
                              onClick={() => {
                                setShowAddManualItem(false);
                                setEditingManualItem(null);
                                setManualItemForm({ title: '', description: '', hours: '', minutes: '', userId: '' });
                              }}
                              className="px-6 py-3 border-2 border-brand-dark/20 text-brand-dark font-bold uppercase tracking-wide hover:bg-brand-dark/5 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Manual Items List */}
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {manualItems.length === 0 ? (
                          <div className="text-center py-16 border-2 border-dashed border-brand-dark/10">
                            <p className="text-brand-dark/50 font-medium uppercase tracking-wide text-sm">No manual items added yet</p>
                          </div>
                        ) : (
                          manualItems.map((item) => {
                            const isSelected = selectedManualItems.includes(item._id);
                            return (
                              <label
                                key={item._id}
                                className={`flex items-start p-4 border-2 cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-brand-accent bg-brand-accent/5'
                                    : 'border-brand-dark/20 hover:border-brand-dark/40 bg-white'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleManualItemToggle(item._id)}
                                  className="mt-1 mr-4 h-5 w-5 text-brand-accent focus:ring-brand-accent border-brand-dark/30 rounded-sm"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-brand-dark mb-1 uppercase tracking-tight">{item.title}</div>
                                  {item.description && (
                                    <div className="text-sm text-brand-dark/60 mb-3 line-clamp-2 font-medium">
                                      {item.description}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-4 text-xs font-medium uppercase tracking-wide text-brand-dark/60">
                                    <div className="flex items-center gap-1.5">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span>{formatHoursDisplay(item.hours)}</span>
                                    </div>
                                    {item.user && (
                                      <div className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span>{item.user.name || item.user.username}</span>
                                      </div>
                                    )}
                                    {!item.user && isAgencyLevel && (
                                      <span className="text-brand-accent font-bold">Agency Level</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-4 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      openEditManualItem(item);
                                    }}
                                    className="p-2 text-brand-accent hover:text-brand-dark hover:bg-brand-dark/5 transition border-2 border-transparent hover:border-brand-dark/20"
                                    aria-label="Edit item"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeleteManualItem(item._id);
                                    }}
                                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 transition border-2 border-transparent hover:border-red-200"
                                    aria-label="Delete item"
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

                  {/* Bill Generation Panel — dark bar, brand-accent CTA */}
                  {totalSelected > 0 && (
                    <div className="bg-brand-dark border-2 border-brand-dark p-6 text-white">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
                        <div>
                          <h2 className="text-lg font-black uppercase tracking-tight mb-1">Generate Invoice</h2>
                          <p className="text-white/60 text-xs font-bold uppercase tracking-widest">
                            {totalSelected} item{totalSelected !== 1 ? 's' : ''} selected • {totalHours.toFixed(1)}h total
                          </p>
                        </div>
                        {estimatedAmount > 0 && (
                          <div className="text-right">
                            <div className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Estimated Amount</div>
                            <div className="text-2xl font-black">{getCurrencySymbol()}{estimatedAmount.toFixed(2)}</div>
                          </div>
                        )}
                      </div>
                      <div className="mb-6">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">
                          Hourly Rate ({getCurrencySymbol()})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={hourlyRate}
                          onChange={(e) => setHourlyRate(e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none text-white placeholder-white/40 transition-all"
                          placeholder="Enter hourly rate"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={handleGenerateBill}
                          className="flex-1 px-6 py-3 bg-brand-accent text-white font-black uppercase tracking-wide hover:bg-brand-accent/90 transition flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Generate Invoice
                        </button>
                        <button
                          onClick={handleMarkAsBilled}
                          className="px-6 py-3 bg-white text-brand-dark font-black uppercase tracking-wide hover:bg-white/90 transition border-2 border-white"
                        >
                          Mark as Billed
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Invoice Display — sharp card, brand typography */}
                  {bill && (
                    <div className="sharp-card bg-white p-8">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
                        <div>
                          <h2 className="text-3xl font-black uppercase tracking-tighter text-brand-dark mb-2">Invoice</h2>
                          <p className="text-brand-dark/60 text-xs font-bold uppercase tracking-widest">
                            Generated: {new Date(bill.generatedAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={handlePrintInvoice}
                          className="px-6 py-3 bg-brand-dark hover:bg-brand-dark/90 text-white font-bold uppercase tracking-wide transition flex items-center gap-2 border-2 border-brand-dark"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Print / Save PDF
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 pb-8 border-b-2 border-brand-dark/10">
                        <div>
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-dark/60 mb-2">Workspace</h3>
                          <p className="text-lg font-black text-brand-dark uppercase tracking-tight">{bill.workspace.name}</p>
                        </div>
                        <div>
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-dark/60 mb-2">
                            {bill.isAgencyLevel ? 'Billing Type' : 'User'}
                          </h3>
                          <p className="text-lg font-black text-brand-dark uppercase tracking-tight">
                            {bill.isAgencyLevel ? 'Agency Level' : (bill.user?.name || bill.user?.username || 'N/A')}
                          </p>
                        </div>
                      </div>

                      <div className="mb-8">
                        <h3 className="text-sm font-black uppercase tracking-widest text-brand-dark/60 mb-4">Work Items</h3>
                        <div className="border-2 border-brand-dark/10 overflow-hidden">
                          <table className="min-w-full divide-y divide-brand-dark/10">
                            <thead className="bg-brand-dark/5">
                              <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-brand-dark/60">
                                  Work Item
                                </th>
                                {bill.isAgencyLevel && (
                                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-brand-dark/60">
                                    User
                                  </th>
                                )}
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-brand-dark/60">
                                  Hours
                                </th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-brand-dark/60">
                                  Amount
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-brand-dark/10">
                              {bill.workItems.map((item) => (
                                <tr key={item.id} className="hover:bg-brand-dark/[0.02] transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="font-bold text-brand-dark uppercase tracking-tight">{item.title}</div>
                                    {item.description && (
                                      <div className="text-sm text-brand-dark/60 mt-1 font-medium">{item.description}</div>
                                    )}
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-brand-dark/40 mt-1">
                                      {item.type === 'manual' ? 'Manual Item' : 'Ticket'}
                                    </div>
                                  </td>
                                  {bill.isAgencyLevel && (
                                    <td className="px-6 py-4 font-medium text-brand-dark/80 uppercase tracking-wide text-sm">
                                      {item.user ? (item.user.name || item.user.username) : 'Agency'}
                                    </td>
                                  )}
                                  <td className="px-6 py-4 font-bold text-brand-dark uppercase tracking-wide">
                                    {formatHoursDisplay(item.hours)}
                                  </td>
                                  <td className="px-6 py-4 text-right font-black text-brand-dark">
                                    {getCurrencySymbol()}{(item.hours * bill.hourlyRate).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="bg-brand-dark/5 border-2 border-brand-dark/10 p-6">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-brand-dark/60 font-bold uppercase tracking-wide text-sm">Hourly Rate</span>
                            <span className="text-brand-dark font-black">{getCurrencySymbol()}{bill.hourlyRate.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-brand-dark/60 font-bold uppercase tracking-wide text-sm">Total Items</span>
                            <span className="text-brand-dark font-black">{bill.summary.totalItems}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-brand-dark/60 font-bold uppercase tracking-wide text-sm">Total Hours</span>
                            <span className="text-brand-dark font-black">{bill.summary.totalHours}</span>
                          </div>
                          <div className="pt-4 mt-4 border-t-2 border-brand-dark/20">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-black uppercase tracking-tight text-brand-dark">Total Amount</span>
                              <span className="text-2xl font-black text-brand-dark">{getCurrencySymbol()}{bill.summary.totalAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(!isAgencyLevel && !selectedUser) && (
                <div className="sharp-card bg-white border-brand-dark/10 p-16 text-center flex flex-col items-center justify-center min-h-[320px]">
                  <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-brand-dark/20 mb-6">
                    <svg className="w-8 h-8 text-brand-dark/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-brand-dark/60 font-bold uppercase tracking-widest text-sm">Select a user to view their billable items</p>
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
