import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Badge } from './Cards';
import { T } from '../theme/tokens';
import { API_BASE } from '../config';

export default function IntroPage() {
  const [dbStats, setDbStats] = useState({ cdc_count: 0, research_count: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
        const [statsRes] = await Promise.all([
          axios.get(`${API_BASE}/api/stats`)
        ]);
        setDbStats(statsRes.data);
      } catch (err) {
        console.error("Intro Data Sync Failed:", err);
      }
    };
    fetchStats();
  }, []);

  const PILLS = [
    { label: "K76.0 — MASLD / Other Liver Disease", color: "bg-blue-100/80 text-blue-800 border-blue-200" },
    { label: "C22 — Liver Cancer (HCC + ICC)", color: "bg-rose-100/80 text-rose-800 border-rose-200" },
    { label: "1999–2024 CDC Window", color: "bg-amber-100/80 text-amber-800 border-amber-200" },
    { label: "MedGemma PICO Extraction", color: "bg-emerald-100/80 text-emerald-800 border-emerald-200" }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-5xl mx-auto pb-6">
      <header className="pb-6 border-b border-slate-100">
        <h2 className="font-serif font-black text-[#1E3A8A] mb-3 leading-tight" style={{ fontSize: T.h1 }}>
           Evidence Gap Analysis: MASLD · MASH · HCC
        </h2>
        <p className="text-slate-600 max-w-4xl leading-relaxed text-lg font-medium">
          Triangulating PubMed literature and ClinicalTrials.gov interventions against CDC ICD-10 mortality reality — to expose where research fails to match disease burden.
        </p>

        {/* PROMINENT PILLS */}
        <div className="flex flex-wrap gap-3 mt-6">
           {PILLS.map(pill => (
             <span key={pill.label} className={`px-4 py-1.5 rounded-full border-2 text-[11px] font-black uppercase tracking-wider shadow-sm transition-all cursor-default ${pill.color}`}>
               {pill.label}
             </span>
           ))}
        </div>
      </header>

      {/* --- RESEARCH QUESTION --- */}
      <Card className="p-8 border-l-8 border-[#1E3A8A] bg-white shadow-xl shadow-blue-900/5">
         <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-4 tracking-widest">The Research Question</h3>
         <p className="text-2xl font-serif text-[#1E3A8A] leading-relaxed">
           Metabolic-dysfunction Associated Steatotic Liver Disease (MASLD) — formerly NAFLD — now represents the leading cause of chronic liver disease globally, yet the CDC mortality data reveals a stark temporal lag between rising death counts and meaningful clinical research activity.
         </p>
      </Card>

      {/* --- SIMPLIFIED VISUAL FLOW --- */}
      <section className="py-10 px-10 bg-slate-50 border border-slate-100 rounded-[32px] relative overflow-hidden">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1E3A8A] mb-8 text-center opacity-40">Methodology Logic</h4>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-10 max-w-3xl mx-auto">
          {/* Source 1 */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-[20px] bg-white border-2 border-slate-100 flex items-center justify-center text-3xl shadow-sm">🕮</div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1E3A8A]">PubMed</span>
          </div>

          <div className="text-slate-300 text-2xl font-black">+</div>

          {/* Source 2 */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-[20px] bg-white border-2 border-slate-100 flex items-center justify-center text-3xl shadow-sm">⌬</div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1E3A8A]">Clinical Trials</span>
          </div>

          <div className="text-blue-500 text-2xl animate-pulse">⇒</div>

          {/* Processor */}
          <div className="flex flex-col items-center gap-2">
             <div className="w-20 h-20 rounded-[28px] bg-[#1E3A8A] text-white flex flex-col items-center justify-center shadow-lg relative border-4 border-white">
                <span className="text-2xl">⚖</span>
             </div>
             <span className="text-[10px] font-black text-blue-800 tracking-widest uppercase">PICO Synthesis</span>
          </div>
        </div>
      </section>
    </div>
  );
}
