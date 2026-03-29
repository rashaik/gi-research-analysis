import React, { useState } from 'react';
import { Card, Badge } from './Cards';
import { C, T } from '../theme/tokens';

// Sample Extraction Data
const MOCK_EXTRACTIONS = [
  {
    id: 1,
    title: "Resmetirom in NASH with Liver Fibrosis",
    source: "NEJM 2024",
    pico: {
      p: "Adults with biopsy-confirmed NASH and fibrosis stages F1B, F2, or F3",
      i: "Resmetirom 80mg or 100mg once daily",
      c: "Placebo",
      o: "NASH resolution and improvement in fibrosis by ≥1 stage"
    },
    confidence: 0.98
  },
  {
    id: 2,
    title: "Semaglutide Effects on MASH Histology",
    source: "Lancet Gastro 2023",
    pico: {
      p: "Patients with MASH and compensated cirrhosis",
      i: "Subcutaneous Semaglutide 2.4mg weekly",
      c: "Standard of care",
      o: "Regression of fibrosis and MASH resolution"
    },
    confidence: 0.94
  }
];

export default function AnalysisPage() {
  const [selected, setSelected] = useState(MOCK_EXTRACTIONS[0]);

  return (
    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
      <header>
        <Badge>MedGemma 4B Extraction</Badge>
        <h2 className="font-serif font-black text-[#1E3A8A] mt-4 mb-4" style={{ fontSize: T.h1 }}>
          PICO Semantic Explorer
        </h2>
        <p className="text-[#64748B] max-w-2xl leading-relaxed" style={{ fontSize: T.body }}>
          Reviewing AI-structured extractions from clinical literature. This mapping identifies the 
          specific populations (P) and interventions (I) currently being prioritized in the field.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: Results List */}
        <div className="lg:col-span-4 space-y-4">
          <h4 className="text-[0.8rem] font-black uppercase tracking-widest text-slate-400 px-2">Recent Extractions</h4>
          {MOCK_EXTRACTIONS.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className={`w-full text-left p-6 rounded-2xl border transition-all ${
                selected.id === item.id 
                ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white shadow-lg' 
                : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
              }`}
            >
              <p className="text-[0.7rem] uppercase font-bold opacity-60 mb-2">{item.source}</p>
              <h5 className="font-bold leading-snug" style={{ fontSize: '1.1rem' }}>{item.title}</h5>
            </button>
          ))}
        </div>

        {/* Right Content: PICO Detail */}
        <div className="lg:col-span-8">
          <Card className="h-full border-t-8 border-blue-500">
            <div className="p-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-2xl font-bold text-[#1E3A8A] mb-2">{selected.title}</h3>
                  <p className="text-slate-500 font-medium">{selected.source} · Peer Reviewed</p>
                </div>
                <div className="text-right">
                  <p className="text-[0.7rem] font-black text-blue-600 uppercase mb-1">AI Confidence</p>
                  <p className="text-2xl font-black text-[#1E3A8A]">{(selected.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {[
                  { key: 'P', label: 'Population', val: selected.pico.p, color: 'bg-blue-50 text-blue-800' },
                  { key: 'I', label: 'Intervention', val: selected.pico.i, color: 'bg-indigo-50 text-indigo-800' },
                  { key: 'C', label: 'Comparison', val: selected.pico.c, color: 'bg-slate-50 text-slate-800' },
                  { key: 'O', label: 'Outcome', val: selected.pico.o, color: 'bg-emerald-50 text-emerald-800' },
                ].map((part) => (
                  <div key={part.key} className="flex gap-6 items-start group">
                    <div className={`w-14 h-14 shrink-0 rounded-xl flex items-center justify-center font-black text-2xl shadow-sm ${part.color}`}>
                      {part.key}
                    </div>
                    <div className="pt-1">
                      <h4 className="text-[0.8rem] font-black uppercase tracking-wider text-slate-400 mb-1">{part.label}</h4>
                      <p className="text-slate-700 leading-relaxed font-medium" style={{ fontSize: T.body }}>{part.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
