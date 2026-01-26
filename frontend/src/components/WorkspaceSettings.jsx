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
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-brand-dark p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-brand-dark mb-8">System Configuration</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <label className="block text-[10px] font-black uppercase tracking-widest text-brand-dark/60 mb-4">
              Period Type
            </label>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-dark/40 mb-6 italic">
              Choose how tickets are organized on the board
            </p>
            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 border-brand-dark cursor-pointer hover:bg-brand-dark hover:text-white transition group">
                <input
                  type="radio"
                  name="periodType"
                  value="weekly"
                  checked={periodType === 'weekly'}
                  onChange={(e) => setPeriodType(e.target.value)}
                  className="mr-4 w-5 h-5"
                />
                <div className="flex-1">
                  <div className="font-black text-brand-dark group-hover:text-white uppercase tracking-tight">Weekly</div>
                  <div className="text-[10px] font-bold text-brand-dark/60 group-hover:text-white/60 uppercase tracking-widest mt-1">Organize tickets by week (Monday to Sunday)</div>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 border-brand-dark cursor-pointer hover:bg-brand-dark hover:text-white transition group">
                <input
                  type="radio"
                  name="periodType"
                  value="monthly"
                  checked={periodType === 'monthly'}
                  onChange={(e) => setPeriodType(e.target.value)}
                  className="mr-4 w-5 h-5"
                />
                <div className="flex-1">
                  <div className="font-black text-brand-dark group-hover:text-white uppercase tracking-tight">Monthly</div>
                  <div className="text-[10px] font-bold text-brand-dark/60 group-hover:text-white/60 uppercase tracking-widest mt-1">Organize tickets by month (1st to end of month)</div>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 border-brand-dark cursor-pointer hover:bg-brand-dark hover:text-white transition group">
                <input
                  type="radio"
                  name="periodType"
                  value="quarterly"
                  checked={periodType === 'quarterly'}
                  onChange={(e) => setPeriodType(e.target.value)}
                  className="mr-4 w-5 h-5"
                />
                <div className="flex-1">
                  <div className="font-black text-brand-dark group-hover:text-white uppercase tracking-tight">Quarterly</div>
                  <div className="text-[10px] font-bold text-brand-dark/60 group-hover:text-white/60 uppercase tracking-widest mt-1">Organize tickets by quarter (Q1, Q2, Q3, Q4)</div>
                </div>
              </label>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-[10px] font-black uppercase tracking-widest text-brand-dark/60 mb-4">
              Currency
            </label>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-dark/40 mb-6 italic">
              Select the currency for billing
            </p>
            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 border-brand-dark cursor-pointer hover:bg-brand-dark hover:text-white transition group">
                <input
                  type="radio"
                  name="currency"
                  value="USD"
                  checked={currency === 'USD'}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mr-4 w-5 h-5"
                />
                <div className="flex-1">
                  <div className="font-black text-brand-dark group-hover:text-white uppercase tracking-tight">USD ($)</div>
                  <div className="text-[10px] font-bold text-brand-dark/60 group-hover:text-white/60 uppercase tracking-widest mt-1">US Dollar</div>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 border-brand-dark cursor-pointer hover:bg-brand-dark hover:text-white transition group">
                <input
                  type="radio"
                  name="currency"
                  value="INR"
                  checked={currency === 'INR'}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mr-4 w-5 h-5"
                />
                <div className="flex-1">
                  <div className="font-black text-brand-dark group-hover:text-white uppercase tracking-tight">INR (₹)</div>
                  <div className="text-[10px] font-bold text-brand-dark/60 group-hover:text-white/60 uppercase tracking-widest mt-1">Indian Rupee</div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-brand-dark text-brand-dark font-black uppercase text-xs tracking-widest hover:bg-brand-dark hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-brand-accent text-white font-black uppercase text-xs tracking-widest hover:bg-brand-dark transition"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkspaceSettings;
