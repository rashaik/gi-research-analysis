import React, { useState } from 'react';
import { NAV_ITEMS } from '../data';

export default function Sidebar({ activePage, onNavigate, backendOk }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (id) => {
    onNavigate(id);
    setIsOpen(false); // close menu after selecting on mobile
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

        <div className="flex items-center gap-3">
          {/* Engine status dot */}
          <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg">
            <div className={`w-1.5 h-1.5 rounded-full ${backendOk ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/60">
              {backendOk ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* Hamburger button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              // X icon
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger icon
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── MOBILE DROPDOWN MENU ── */}
      {isOpen && (
        <div className="lg:hidden fixed top-[56px] left-0 right-0 bottom-0 z-40 bg-[#1E3A8A] overflow-y-auto">
          <nav className="py-4">
            {NAV_ITEMS.map(group => (
              <div key={group.group} className="mb-6 px-4">
                <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-300 mb-3 px-3">
                  {group.group}
                </h4>
                <div className="space-y-1">
                  {group.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold text-left ${
                        activePage === item.id
                          ? 'bg-white text-blue-900 shadow-xl border-r-4 border-blue-500'
                          : 'text-blue-100 hover:bg-white/10'
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
          <p className="text-blue-400 text-[10px] font-bold mt-0.5 leading-tight">
            MASLD · MASH · HCC
          </p>
          <div className="flex items-center gap-2 mt-4 bg-white/5 p-2 rounded-lg border border-white/5">
            <div className={`w-1.5 h-1.5 rounded-full ${backendOk ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <p className="text-white/60 text-[9px] font-black uppercase tracking-widest">
              {backendOk ? 'Engine Live' : 'Engine Offline'}
            </p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-6">
          {NAV_ITEMS.map(group => (
            <div key={group.group} className="mb-8 px-4">
              <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-50 mb-4 px-3 text-left drop-shadow-sm">
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
                    <div className="flex-none w-6 flex justify-center">
                      <span className={`text-xl transition-transform ${activePage === item.id ? 'scale-110 opacity-100' : 'opacity-60'}`}>
                        {item.icon}
                      </span>
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