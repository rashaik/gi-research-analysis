import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Badge } from './Cards';
import { API_BASE } from '../config';

export default function ExplorerPage() {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState("abstract");

  const [filterSource, setFilterSource] = useState("All");
  const [filterNiche, setFilterNiche] = useState("All");

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/research/list`);
        const data = Array.isArray(res.data) ? res.data : [];
        setRecords(data);
        setFilteredRecords(data);
        if (data.length > 0) setSelectedId(data[0].external_id);
      } catch (err) {
        console.error("Fetch error:", err);
        setRecords([]);
        setFilteredRecords([]);
      }
    };
    fetchList();
  }, []);

  useEffect(() => {
    let filtered = records;
    if (filterSource !== "All") filtered = filtered.filter(r => r.source === filterSource);
    if (filterNiche !== "All") filtered = filtered.filter(r => r.niche === filterNiche);
    setFilteredRecords(filtered);
    if (filtered.length > 0) {
      if (!filtered.find(r => r.external_id === selectedId)) setSelectedId(filtered[0].external_id);
    } else {
      setSelectedId("");
      setSelectedRecord(null);
    }
  }, [filterSource, filterNiche, records]);

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

  const picoItems = [
    { label: 'Population', key: 'P', icon: '👥', color: 'border-blue-500/20 bg-blue-500/5' },
    { label: 'Intervention', key: 'I', icon: '💊', color: 'border-emerald-500/20 bg-emerald-500/5' },
    { label: 'Comparison', key: 'C', icon: '⚖️', color: 'border-amber-500/20 bg-amber-500/5' },
    { label: 'Outcome', key: 'O', icon: '📉', color: 'border-rose-500/20 bg-rose-500/5' },
  ];

  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen">

      {/* ── HEADER & FILTERS ── */}
      <div className="p-4 lg:p-8 border-b border-slate-200 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8">

          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-1">
              <Badge variant="primary" className="px-3 py-1 text-[10px] font-black tracking-widest uppercase">
                AI ANALYZER
              </Badge>
              <h2 className="text-2xl lg:text-4xl font-black text-[#1E3A8A] font-serif tracking-tight">
                PICO Explorer
              </h2>
            </div>
            <p className="text-slate-500 text-xs lg:text-sm font-medium">
              Select and filter evidence records to examine MedGemma extracted PICO elements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-400">Niche:</span>
              <select value={filterNiche} onChange={e => setFilterNiche(e.target.value)}
                className="px-2 py-1.5 text-xs font-bold border-2 border-slate-100 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option>All</option>
                <option>Lean_MASLD</option>
                <option>MASH_Fibrosis</option>
                <option>MASLD_HCC</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-400">Source:</span>
              <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
                className="px-2 py-1.5 text-xs font-bold border-2 border-slate-100 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option>All</option>
                <option>PubMed</option>
                <option>ClinicalTrials</option>
              </select>
            </div>

            <div className="relative w-full lg:w-auto">
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
                className="w-full lg:min-w-[280px] px-3 py-2 border-2 border-blue-50 shadow-sm rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-black text-slate-700">
                <option value="" disabled>Select a Record</option>
                {filteredRecords.map(rec => (
                  <option key={rec.external_id} value={rec.external_id}>
                    {rec.external_id} - {rec.title.substring(0, 45)}...
                  </option>
                ))}
              </select>
              {filteredRecords.length > 0 && (
                <div className="absolute -top-4 right-1 text-[9px] font-bold text-slate-300 uppercase">
                  {filteredRecords.length} records
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE TAB SWITCHER ── */}
      <div className="lg:hidden flex border-b border-slate-200 bg-white sticky top-0 z-10">
        <button onClick={() => setMobileTab("abstract")}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${
            mobileTab === "abstract" ? "text-[#1E3A8A] border-b-2 border-[#1E3A8A]" : "text-slate-400"
          }`}>
          Abstract
        </button>
        <button onClick={() => setMobileTab("pico")}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${
            mobileTab === "pico" ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-400"
          }`}>
          PICO
        </button>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 lg:p-8 flex-1">

        {/* ABSTRACT PANEL */}
        <div className={`${mobileTab === "abstract" ? "block" : "hidden"} lg:block lg:w-1/2 bg-white rounded-2xl border shadow-sm p-5 lg:p-8 overflow-y-auto`}>
          <h3 className="text-sm font-black text-[#1E3A8A] uppercase tracking-widest mb-4 opacity-40">Abstract</h3>

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-100 rounded w-1/4"></div>
              <div className="h-6 bg-slate-100 rounded w-3/4"></div>
              <div className="h-24 bg-slate-100 rounded"></div>
            </div>
          ) : selectedRecord ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant={selectedRecord.source === "PubMed" ? "primary" : "warning"}>
                  {selectedRecord.source}
                </Badge>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  {selectedRecord.external_id} • {selectedRecord.year}
                </span>
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-4 leading-tight">
                {selectedRecord.title}
              </h4>
              <p className="text-slate-600 leading-loose text-sm whitespace-pre-line border-t border-slate-50 pt-4">
                {selectedRecord.abstract}
              </p>
              <button onClick={() => setMobileTab("pico")}
                className="lg:hidden mt-6 w-full py-3 bg-[#1E3A8A] text-white rounded-xl font-black uppercase tracking-widest text-xs">
                View PICO Extraction →
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-300">
              <span className="text-4xl mb-2">🔍</span>
              <p className="text-xs font-bold uppercase tracking-widest">No matching records</p>
            </div>
          )}
        </div>

        {/* PICO PANEL */}
        <div className={`${mobileTab === "pico" ? "block" : "hidden"} lg:block lg:w-1/2 bg-slate-900 rounded-2xl shadow-xl p-5 lg:p-8 overflow-y-auto text-white`}>
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
            <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.3em]">PICO Extraction</h3>
            <div className="text-right">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">AI Confidence</p>
              <Badge variant="hcc" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-none font-mono">
                91.1% Accuracy
              </Badge>
            </div>
          </div>

          {!loading && selectedRecord ? (
            <div className="space-y-4">
              {picoItems.map(item => (
                <div key={item.key} className={`p-4 rounded-2xl border transition-all ${item.color}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg opacity-60">{item.icon}</span>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</h4>
                  </div>
                  <p className="text-slate-200 text-sm leading-relaxed pl-2 border-l border-white/10">
                    {selectedRecord?.pico_json?.[item.key] || "Not synchronized"}
                  </p>
                </div>
              ))}
              <button onClick={() => setMobileTab("abstract")}
                className="lg:hidden mt-2 w-full py-3 bg-white/10 text-white rounded-xl font-black uppercase tracking-widest text-xs">
                ← Back to Abstract
              </button>
            </div>
          ) : !loading && (
            <p className="text-slate-500 text-center italic text-xs pt-20">
              Select an abstract to view PICO synthesis
            </p>
          )}
        </div>

      </div>
    </div>
  );
}