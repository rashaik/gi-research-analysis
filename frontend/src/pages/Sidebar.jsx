import React from 'react';
import { NAV_ITEMS } from '../data';

export default function Sidebar({ activePage, onNavigate, backendOk }) {
  return (
    <aside className="w-64 bg-[#1E3A8A] text-white flex flex-col h-screen sticky top-0 shadow-xl transition-all">
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
  );
}