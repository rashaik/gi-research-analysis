import React from 'react';
import { C, T } from '../theme/tokens';

export const Card = ({ children, className = "" }) => (
  <div className={`bg-white border border-[${C.border}] rounded-2xl shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

export const StatCard = ({ label, value, sub, color = 'primary', compact = false }) => (
  <div className={`bg-white ${compact ? 'p-5' : 'p-8'} rounded-2xl border border-[#E2E8F0] shadow-sm relative overflow-hidden transition-all hover:border-slate-300`}>
    <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: C[color] }} />
    <p className={`uppercase tracking-widest font-black text-[#64748B] ${compact ? 'text-[0.65rem]' : 'text-[0.8rem]'} mb-${compact ? '2' : '4'}`}>{label}</p>
    <h3 className="font-serif font-black mb-1" style={{ color: C[color], fontSize: compact ? '1.75rem' : T.stat, lineHeight: 1.1 }}>{value}</h3>
    <p className={`font-bold text-[#64748B] ${compact ? 'text-[0.8rem]' : ''}`} style={{ fontSize: compact ? '0.8rem' : T.body }}>{sub}</p>
  </div>
);

export const Badge = ({ children, variant = 'primary' }) => {
  const styles = {
    primary: `bg-blue-50 text-blue-700 border-blue-200`,
    hcc: `bg-rose-50 text-rose-700 border-rose-200`,
    warning: `bg-amber-50 text-amber-700 border-amber-200`,
  };
  return (
    <span className={`px-4 py-1.5 rounded-full border text-[0.95rem] font-bold ${styles[variant]}`}>
      {children}
    </span>
  );
};
