import React from 'react';
import { Card, Badge } from './Cards';
import { T } from '../theme/tokens';

export default function PipelinePage() {
  return (
    <div className="pt-20 space-y-12 animate-in fade-in duration-700 max-w-6xl mx-auto pb-20">
      <header className="px-4">
        <Badge variant="warning">METHODOLOGY & ARCHITECTURE</Badge>
        <h2 className="font-serif font-black text-[#1E3A8A] mt-4 mb-3 leading-tight" style={{ fontSize: T.h1 }}>
           Pipeline: Visual Workflow
        </h2>
        <p className="text-[#64748B] max-w-4xl text-lg font-medium leading-relaxed">
          A systematic mapping of clinical intelligence against real-world mortality. 
          This workflow ensures high-fidelity triangulation for evidence gap analysis.
        </p>
      </header>

      {/* --- VISUAL FLOWCHART --- */}
      <div className="relative py-8 px-8 bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden mx-4">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-50 -translate-y-1/2 hidden lg:block" />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 relative z-10">
          {[
            { 
              step: "01", 
              title: "DATA INGESTION", 
              desc: "Extraction from PubMed (E-utils), ClinicalTrials.gov (v2), and CDC WONDER via Python services.",
              tags: ["Python", "REST APIs"]
            },
            { 
              step: "02", 
              title: "DEDUPLICATION", 
              desc: "Merging of literature and trial records using 'bib_dedupe' library for a unique record set.",
              tags: ["Bib_Dedupe", "Refined Set"]
            },
            { 
              step: "03", 
              title: "PICO EXTRACTION", 
              desc: "MedGemma 4B transforms raw abstracts into PICO data format (Population, Intervention, Comp, Outcome).",
              tags: ["MedGemma 4B", "JSON"]
            },
            { 
              step: "04", 
              title: "TRIANGULATION", 
              desc: "Gap Analysis mapping focus areas against CDC mortality trends to expose under-studied areas.",
              tags: ["Gap Analysis", "Healthcare Equity"]
            }
          ].map((item, idx) => (
            <div key={item.step} className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-[#1E3A8A] text-white flex items-center justify-center font-black text-xl mb-6 shadow-xl shadow-blue-900/10 border-4 border-white">
                {item.step}
              </div>
              <h4 className="font-black text-[#1E3A8A] mb-2 tracking-widest uppercase text-xs">{item.title}</h4>
              <p className="text-[#64748B] text-xs font-medium leading-relaxed mb-4 px-2">{item.desc}</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {item.tags.map(t => (
                  <span key={t} className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-50 text-slate-400 border border-slate-100 uppercase tracking-widest">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- DATA SOURCES & WEBSITES --- */}
      <section className="px-4 space-y-6">
        <h3 className="text-sm font-black text-[#1E3A8A] uppercase tracking-[0.3em] opacity-40">System Endpoints & Registries</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <a href="https://eutils.ncbi.nlm.nih.gov/entrez/eutils" target="_blank" rel="noreferrer" className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-500 transition-all group">
              <div className="flex justify-between items-center mb-4">
                 <span className="text-2xl">🕮</span>
                 <Badge variant="primary">API v2.0</Badge>
              </div>
              <h4 className="font-black text-[#1E3A8A] group-hover:text-blue-600 transition-colors uppercase text-xs tracking-widest">PubMed (MeSH)</h4>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">Medical Subject Headings: Controlled vocabulary thesaurus used for indexing, cataloging, and searching of biomedical information.</p>
           </a>

           <a href="https://clinicaltrials.gov/api/v2/studies" target="_blank" rel="noreferrer" className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-emerald-500 transition-all group">
              <div className="flex justify-between items-center mb-4">
                 <span className="text-2xl">⌬</span>
                 <Badge variant="warning">v2.0 Beta</Badge>
              </div>
              <h4 className="font-black text-emerald-800 group-hover:text-emerald-600 transition-colors uppercase text-xs tracking-widest">Clinical Trials Registry</h4>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">Database of privately and publicly funded clinical studies conducted around the world.</p>
           </a>

           <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4 lg:col-span-1">
              <div className="flex justify-between items-center mb-4">
                 <span className="text-2xl">◎</span>
                 <Badge variant="hcc">WONDER Portals</Badge>
              </div>
              <div className="space-y-3">
                 <a href="https://wonder.cdc.gov/ucd-icd10.html" target="_blank" rel="noreferrer" className="block text-[11px] font-bold text-blue-600 hover:underline">
                    CDC Wonder (1999–2020) portal
                 </a>
                 <a href="https://wonder.cdc.gov/ucd-icd10-expanded.html" target="_blank" rel="noreferrer" className="block text-[11px] font-bold text-blue-600 hover:underline">
                    CDC Wonder (2018–2024 Expanded) portal
                 </a>
              </div>
           </div>
        </div>
      </section>

      {/* --- MESH DEFINITION CALLOUT --- */}
      <Card className="mx-4 p-8 border-l-8 border-[#1E3A8A] bg-blue-50/30">
        <h4 className="text-[10px] font-black uppercase text-[#1E3A8A] tracking-[0.2em] mb-4">Key Terminology</h4>
        <div className="flex flex-col md:flex-row gap-8 items-start">
           <div className="flex-1">
              <p className="text-lg font-serif italic text-blue-900 leading-relaxed">
                MeSH (Medical Subject Headings) is the National Library of Medicine's controlled vocabulary. 
                Our pipeline uses it to ensure "Evidence Centricity"—aligning diverse clinical terms to a single standardized concept.
              </p>
           </div>
           <div className="flex-none p-4 bg-white rounded-xl border border-blue-100 text-[11px] text-blue-800 max-w-xs leading-loose">
              <strong>Usage:</strong> [MeSH] tags in our Python scripts ensure we capture all subterms of NAFLD/MASLD without manual synonym lists.
           </div>
        </div>
      </Card>
    </div>
  );
}
