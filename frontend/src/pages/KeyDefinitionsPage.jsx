import React from 'react';
import { Card, Badge, StatCard } from './Cards';
import { DEFINITIONS_DATA } from '../data';
import { T } from '../theme/tokens';

export default function KeyDefinitionsPage() {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-10 duration-700 max-w-5xl mx-auto pb-8">
      <header className="border-b border-slate-200 pb-6">
        <Badge variant="primary">EVIDENCE FRAMEWORK</Badge>
        <h2 className="font-serif font-black text-[#1E3A8A] mt-4 mb-2 leading-tight" style={{ fontSize: T.h1 }}>
          Key Definitions & Concepts
        </h2>
        <p className="text-slate-500 text-lg max-w-3xl">
          Core metrics and terminologies used to map the research-reality gap in GI hepatology.
        </p>
      </header>

      {/* --- DEFINITIONS LIST --- */}
      <div className="space-y-6">
        {DEFINITIONS_DATA.map((item, i) => (
          <Card key={i} className="p-8 hover:border-blue-300 transition-colors bg-white shadow-sm border border-slate-100">
             <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1">
                   <h3 className="text-xl font-black text-[#1E3A8A] mb-3">{item.term}</h3>
                   <p className="text-slate-600 mb-4 leading-relaxed font-medium">
                     {item.def}
                   </p>
                   {item.formula && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-blue-800 mb-4">
                        <span className="font-black">Formula:</span> {item.formula}
                      </div>
                   )}
                </div>
                <div className="w-full md:w-1/3 bg-blue-50/50 p-6 rounded-2xl border border-blue-100 italic text-blue-900 text-sm">
                   {item.explanation}
                </div>
             </div>
          </Card>
        ))}
      </div>

      {/* --- ABOUT MEDGEMMA --- */}
      <section className="bg-slate-900 rounded-[40px] p-12 text-white shadow-2xl relative overflow-hidden group">
         <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity duration-1000" />
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="md:w-1/2">
               <Badge variant="hcc" className="bg-rose-500/20 text-rose-300 border-rose-500/30">AI ENGINE</Badge>
               <h3 className="text-4xl font-black mt-6 mb-8">About MedGemma</h3>
               <p className="text-slate-300 leading-loose mb-8 text-sm">
                 MedGemma is a collection of open-source large language models specifically fine-tuned on vast amounts of medical knowledge. 
                 Acts as an <strong>Automated Evidence Synthesizer</strong> for this gap analysis.
               </p>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                     <p className="text-xs font-black text-rose-400 mb-1 tracking-widest uppercase">Accuracy</p>
                     <p className="text-lg font-bold">91.1% MedQA</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                     <p className="text-xs font-black text-blue-400 mb-1 tracking-widest uppercase">Benchmark</p>
                     <p className="text-lg font-bold">USMLE Expert</p>
                  </div>
               </div>
            </div>
            <div className="md:w-1/2 bg-white/5 p-8 rounded-3xl border border-white/10 space-y-4">
               {[
                  { icon: '🕮', label: 'PubMed Papers & NCT Protocols' },
                  { icon: '💡', label: 'Clinically Fine-tuned USMLE Tasks' },
                  { icon: '👁', label: 'Multimodal: X-ray/CT/Pathology' },
                  { icon: '📍', label: 'Superior Anatomical Localization' }
               ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0">
                     <span className="text-xl bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center">{feat.icon}</span>
                     <span className="text-sm font-semibold text-slate-200">{feat.label}</span>
                  </div>
               ))}
            </div>
         </div>
      </section>
    </div>
  );
}
