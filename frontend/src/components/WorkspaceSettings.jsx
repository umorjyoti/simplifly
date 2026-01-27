import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const WorkspaceSettings = ({ workspace, onClose, onSave }) => {
  const [periodType, setPeriodType] = useState(
    workspace?.settings?.periodType || 'monthly'
  );
  const [currency, setCurrency] = useState(
    workspace?.settings?.currency || 'USD'
  );
  const [isPanelClosing, setIsPanelClosing] = useState(false);
  const [isPanelReady, setIsPanelReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsPanelReady(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const closeSettingsPanel = () => {
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const closeDurationMs = prefersReducedMotion ? 0 : 500;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsPanelClosing(true);
        setTimeout(() => {
          onClose?.();
          setIsPanelClosing(false);
          setIsPanelReady(false);
        }, closeDurationMs);
      });
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave({ periodType, currency });
      closeSettingsPanel();
    } catch (error) {
      alert('Failed to update settings');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[70]" onClick={closeSettingsPanel}>
      <div
        className={`absolute inset-0 bg-brand-dark/40 backdrop-blur-sm transition-opacity duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:duration-0 ${
          isPanelClosing ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden="true"
      />
      <div
        className={`fixed top-0 right-0 h-screen w-[50vw] bg-white overflow-y-auto sharp-card border-l border-brand-dark/10 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:duration-0 ${
          !isPanelClosing && isPanelReady ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          boxShadow: '-8px 0 32px rgba(26, 26, 26, 0.12)',
          willChange: isPanelClosing || isPanelReady ? 'transform' : undefined,
        }}
        role="dialog"
        aria-labelledby="settings-panel-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 md:p-10">
          <h2 id="settings-panel-title" className="text-3xl font-black uppercase tracking-tighter text-brand-dark mb-8">System Configuration</h2>

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
                  <div className="font-black text-brand-dark group-hover:!text-white uppercase tracking-tight transition-colors">Weekly</div>
                  <div className="text-[10px] font-bold text-brand-dark/60 group-hover:!text-white uppercase tracking-widest mt-1 transition-colors">Organize tickets by week (Monday to Sunday)</div>
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
                  <div className="font-black text-brand-dark group-hover:!text-white uppercase tracking-tight transition-colors">Monthly</div>
                  <div className="text-[10px] font-bold text-brand-dark/60 group-hover:!text-white uppercase tracking-widest mt-1 transition-colors">Organize tickets by month (1st to end of month)</div>
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
                  <div className="font-black text-brand-dark group-hover:!text-white uppercase tracking-tight transition-colors">Quarterly</div>
                  <div className="text-[10px] font-bold text-brand-dark/60 group-hover:!text-white uppercase tracking-widest mt-1 transition-colors">Organize tickets by quarter (Q1, Q2, Q3, Q4)</div>
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
                  <div className="font-black text-brand-dark group-hover:!text-white uppercase tracking-tight transition-colors">USD ($)</div>
                  <div className="text-[10px] font-bold text-brand-dark/60 group-hover:!text-white uppercase tracking-widest mt-1 transition-colors">US Dollar</div>
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
                  <div className="font-black text-brand-dark group-hover:!text-white uppercase tracking-tight transition-colors">INR (₹)</div>
                  <div className="text-[10px] font-bold text-brand-dark/60 group-hover:!text-white uppercase tracking-widest mt-1 transition-colors">Indian Rupee</div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={closeSettingsPanel}
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
    </div>
  ,
  document.body
  );
};

export default WorkspaceSettings;
