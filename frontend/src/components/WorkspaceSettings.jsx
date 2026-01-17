import React, { useState } from 'react';

const WorkspaceSettings = ({ workspace, onClose, onSave }) => {
  const [periodType, setPeriodType] = useState(
    workspace?.settings?.periodType || 'monthly'
  );
  const [currency, setCurrency] = useState(
    workspace?.settings?.currency || 'USD'
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave({ periodType, currency });
      onClose();
    } catch (error) {
      alert('Failed to update settings');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Workspace Settings</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Period Type
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Choose how tickets are organized on the board
            </p>
            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="periodType"
                  value="weekly"
                  checked={periodType === 'weekly'}
                  onChange={(e) => setPeriodType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">Weekly</div>
                  <div className="text-xs text-gray-500">Organize tickets by week (Monday to Sunday)</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="periodType"
                  value="monthly"
                  checked={periodType === 'monthly'}
                  onChange={(e) => setPeriodType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">Monthly</div>
                  <div className="text-xs text-gray-500">Organize tickets by month (1st to end of month)</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="periodType"
                  value="quarterly"
                  checked={periodType === 'quarterly'}
                  onChange={(e) => setPeriodType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">Quarterly</div>
                  <div className="text-xs text-gray-500">Organize tickets by quarter (Q1, Q2, Q3, Q4)</div>
                </div>
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Select the currency for billing
            </p>
            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="currency"
                  value="USD"
                  checked={currency === 'USD'}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">USD ($)</div>
                  <div className="text-xs text-gray-500">US Dollar</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="currency"
                  value="INR"
                  checked={currency === 'INR'}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">INR (₹)</div>
                  <div className="text-xs text-gray-500">Indian Rupee</div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkspaceSettings;
