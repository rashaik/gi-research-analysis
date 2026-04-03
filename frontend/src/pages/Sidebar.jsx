import React, { useState } from 'react';
import { NAV_ITEMS } from '../data';

export default function Sidebar({ activePage, onNavigate, backendOk, runpodStatus }) {
  const [isOpen, setIsOpen] = useState(false);

  // Helper to determine RunPod dot color
  const getRunpodColor = () => {
    if (!runpodStatus) return 'bg-gray-500';
    switch (runpodStatus.stage) {
      case 'online': return 'bg-emerald-400 animate-pulse';
      case 'loading_model': return 'bg-amber-400 animate-pulse';
      case 'starting_gpu': return 'bg-blue-400 animate-pulse';
      default: return 'bg-red-400';
    }
  };

  const handleNavigate = (id) => {
    onNavigate(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* ── MOBILE TOP BAR ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#1E3A8A] text-white flex items-center justify-between px-4 py-3 shadow-lg">
        <div>
          <h1 className="font-serif text-lg font-black tracking-tight leading-none">GI Research</h1>
          <p className="text-blue-300 text-[9px] uppercase font-black tracking-widest opacity-70">
            Evidence Gap Analyst
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Dual Status Mobile */}
          <div className="flex flex-col gap-1 items-end bg-black/20 px-2 py-1 rounded-lg">
             <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${backendOk ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span className="text-[7px] font-black text-white/50 uppercase">Engine</span>
             </div>
             <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${getRunpodColor()}`} />
                <span className="text-[7px] font-black text-white/50 uppercase">Model</span>
             </div>
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-lg bg-white/10">
            {isOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── MOBILE DROPDOWN ── */}
      {isOpen && (
        <div className="lg:hidden fixed top-[56px] left-0 right-0 bottom-0 z-40 bg-[#1E3A8A] overflow-y-auto">
          <nav className="py-4">
            {NAV_ITEMS.map(group => (
              <div key={group.group} className="mb-6 px-4">
                <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-300 mb-3 px-3">{group.group}</h4>
                <div className="space-y-1">
                  {group.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                        activePage === item.id ? 'bg-white text-blue-900 shadow-xl' : 'text-blue-100 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex w-64 bg-[#1E3A8A] text-white flex-col h-screen sticky top-0 shadow-xl">
        <div className="p-6 border-b border-white/10">
          <h1 className="font-serif text-2xl font-black tracking-tight text-white leading-none">GI Research</h1>
          <p className="text-blue-300 text-[10px] uppercase font-black tracking-widest mt-1 opacity-70">
            Evidence Gap Analyst
          </p>
          
          <div className="mt-5 space-y-2">
            {/* Backend Status */}
            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
              <div className={`w-1.5 h-1.5 rounded-full ${backendOk ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <p className="text-white/60 text-[9px] font-black uppercase tracking-widest">
                App Engine: {backendOk ? 'Live' : 'Offline'}
              </p>
            </div>

            {/* RunPod Status */}
            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
              <div className={`w-1.5 h-1.5 rounded-full ${getRunpodColor()}`} />
              <div className="flex flex-col">
                <p className="text-white/80 text-[9px] font-black uppercase tracking-widest leading-none">
                  AI Model: {runpodStatus?.label || 'Checking...'}
                </p>
                {runpodStatus?.stage !== 'online' && runpodStatus?.stage !== 'offline' && (
                  <span className="text-blue-300 text-[8px] font-bold mt-1 animate-pulse">Initializing...</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6">
          {NAV_ITEMS.map(group => (
            <div key={group.group} className="mb-8 px-4">
              <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-50 mb-4 px-3 text-left">
                {group.group}
              </h4>
              <div className="space-y-1">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center justify-start gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold text-left ${
                      activePage === item.id
                        ? 'bg-white text-blue-900 shadow-xl scale-[1.02] border-r-4 border-blue-500'
                        : 'text-blue-100 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex-none w-6 flex justify-center text-xl">
                      {item.icon}
                    </div>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}