import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Badge } from './Cards';

export default function ExplorerPage() {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterSource, setFilterSource] = useState("All");
  const [filterNiche, setFilterNiche] = useState("All");

  // const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
  const API_BASE = import.meta.env.VITE_API_BASE || '';

  // Fetch all records
  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/research/list`);
        
        // SAFE CHECK: Ensure res.data is actually an array
        const data = Array.isArray(res.data) ? res.data : [];
        
        setRecords(data);
        setFilteredRecords(data);
        
        if (data.length > 0) {
          setSelectedId(data[0].external_id);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        // Fallback to empty arrays so the UI doesn't break
        setRecords([]);
        setFilteredRecords([]);
      }
    };
    fetchList();
  }, []);

  // Sync filters
  useEffect(() => {
    let filtered = records;
    if (filterSource !== "All") {
      filtered = filtered.filter(r => r.source === filterSource);
    }
    if (filterNiche !== "All") {
      filtered = filtered.filter(r => r.niche === filterNiche);
    }
    setFilteredRecords(filtered);
    if (filtered.length > 0) {
      if (!filtered.find(r => r.external_id === selectedId)) {
        setSelectedId(filtered[0].external_id);
      }
    } else {
      setSelectedId("");
      setSelectedRecord(null);
    }
  }, [filterSource, filterNiche, records]);

  // Fetch selected record detail
  useEffect(() => {
    if (!selectedId) return;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/api/research/${selectedId}`);
        setSelectedRecord(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [selectedId]);

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      
      {/* HEADER & FILTERS - MATCHING IMAGE LAYOUT */}
      <div className="p-8 border-b border-slate-200 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          {/* Left Side: Title and Description */}
          <div className="max-w-xl">
            <div className="flex items-center gap-4 mb-2">
              <Badge variant="primary" className="px-3 py-1 text-[10px] font-black tracking-widest uppercase">
                AI ANALYZER
              </Badge>
              <h2 className="text-4xl font-black text-[#1E3A8A] font-serif tracking-tight">
                PICO Explorer
              </h2>
            </div>
            <p className="text-slate-500 text-sm font-medium">
              Select and filter evidence records to examine MedGemma extracted PICO elements.
            </p>
          </div>

          {/* Right Side: Triple Filter Row */}
          <div className="flex flex-wrap items-center gap-6">
            
            {/* Niche Filter */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Niche:</span>
              <select 
                value={filterNiche} 
                onChange={e => setFilterNiche(e.target.value)}
                className="min-w-[140px] px-3 py-2 text-xs font-bold border-2 border-slate-100 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
              >
                <option>All</option>
                <option>Lean_MASLD</option>
                <option>MASH_Fibrosis</option>
                <option>MASLD_HCC</option>
              </select>
            </div>

            {/* Source Filter */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Source:</span>
              <select 
                value={filterSource} 
                onChange={e => setFilterSource(e.target.value)}
                className="min-w-[120px] px-3 py-2 text-xs font-bold border-2 border-slate-100 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
              >
                <option>All</option>
                <option>PubMed</option>
                <option>ClinicalTrials</option>
              </select>
            </div>

            {/* Record Selector - Blue Tinted Style */}
            <div className="relative">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="min-w-[280px] px-4 py-2 border-2 border-blue-50 shadow-sm rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-black text-slate-700 cursor-pointer"
              >
                <option value="" disabled>Select a Record</option>
                {filteredRecords.map(rec => (
                  <option key={rec.external_id} value={rec.external_id}>
                    {rec.external_id} - {rec.title.substring(0, 45)}...
                  </option>
                ))}
              </select>
              {filteredRecords.length > 0 && (
                <div className="absolute -top-5 right-1 text-[9px] font-bold text-slate-300 uppercase">
                  {filteredRecords.length} records found
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* CONTENT SECTION - REMAINS THE SAME */}
      <div className="flex gap-4 p-8 flex-1 overflow-hidden">
        {/* LEFT ABSTRACT */}
        <div className="w-1/2 bg-white rounded-2xl border shadow-sm p-8 overflow-y-auto">
          <h3 className="text-sm font-black text-[#1E3A8A] uppercase tracking-widest mb-6 opacity-40">
              ABSTRACT
          </h3>

          {loading ? (
            <div className="animate-pulse space-y-4">
               <div className="h-4 bg-slate-100 rounded w-1/4"></div>
               <div className="h-6 bg-slate-100 rounded w-3/4"></div>
               <div className="h-24 bg-slate-100 rounded"></div>
            </div>
          ) : selectedRecord ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                 <Badge variant={selectedRecord.source === "PubMed" ? "primary" : "warning"}>
                    {selectedRecord.source}
                 </Badge>
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    {selectedRecord.external_id} • {selectedRecord.year}
                 </span>
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-6 leading-tight">
                {selectedRecord.title}
              </h4>
              <p className="text-slate-600 leading-loose text-sm whitespace-pre-line border-t border-slate-50 pt-6">
                {selectedRecord.abstract}
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
               <span className="text-4xl mb-2">🔍</span>
               <p className="text-xs font-bold uppercase tracking-widest">No matching records</p>
            </div>
          )}
        </div>

        {/* RIGHT PICO */}
        <div className="w-1/2 bg-slate-900 rounded-2xl shadow-xl p-8 overflow-y-auto text-white">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
             <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.3em]">
                PICO EXTRACTION
             </h3>
             <div className="text-right">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">AI CONFIDENCE</p>
                <Badge variant="hcc" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-none font-mono">91.1% ACCURACY</Badge>
             </div>
          </div>

          {!loading && selectedRecord ? (
            <div className="space-y-4">
              {[
                { label: 'Population', key: 'P', icon: '👥', color: 'border-blue-500/20 bg-blue-500/5' },
                { label: 'Intervention', key: 'I', icon: '💊', color: 'border-emerald-500/20 bg-emerald-500/5' },
                { label: 'Comparison', key: 'C', icon: '⚖️', color: 'border-amber-500/20 bg-amber-500/5' },
                { label: 'Outcome', key: 'O', icon: '📉', color: 'border-rose-500/20 bg-rose-500/5' }
              ].map(item => (
                <div key={item.key} className={`p-5 rounded-2xl border transition-all ${item.color} group hover:border-white/20`}>
                   <div className="flex items-center gap-3 mb-3">
                      <span className="text-lg opacity-60 group-hover:scale-110 transition-transform">{item.icon}</span>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</h4>
                   </div>
                   <p className="text-slate-200 text-sm leading-relaxed pl-8 border-l border-white/5">
                     {selectedRecord?.pico_json?.[item.key] || "Not synchronized"}
                   </p>
                </div>
              ))}
            </div>
          ) : !loading && (
             <p className="text-slate-500 text-center italic text-xs pt-20">Select an abstract to view PICO synthesis</p>
          )}
        </div>

      </div>
    </div>
  );
}