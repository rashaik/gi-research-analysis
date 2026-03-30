import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Badge } from './Cards';
import { T } from '../theme/tokens';

export default function ExtractRecentPage() {
  const [query, setQuery] = useState('');
  const [provider, setProvider] = useState(''); 
  const [maxResults, setMaxResults] = useState(5);
  const [selectedSources, setSelectedSources] = useState(['pubmed', 'clinicaltrials']);
  const [year, setYear] = useState('2025');

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugMsg, setDebugMsg] = useState("");

  // 🔹 Environment Detection
  const [isLocal, setIsLocal] = useState(true);

  useEffect(() => {
    const localCheck =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    setIsLocal(localCheck);

    // Default provider: Ollama for local, RunPod for production
    setProvider(localCheck ? 'ollama' : 'runpod');
  }, []);

  const toggleSource = (source) => {
    if (selectedSources.includes(source)) {
      setSelectedSources(selectedSources.filter((s) => s !== source));
    } else {
      setSelectedSources([...selectedSources, source]);
    }
  };

  const handleExtract = async () => {
    if (!query.trim()) {
      setError("Please enter a search value.");
      return;
    }
    if (selectedSources.length === 0) {
      setError("Please select at least one source.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setDebugMsg("Initializing multi-source search...");

    try {
      // const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
      const API_BASE = import.meta.env.VITE_API_BASE || '';
      const response = await axios.post(`${API_BASE}/api/search`, {
        query: query,
        provider: provider,
        sources: selectedSources,
        max_results: maxResults,
        year: year ? parseInt(year) : null,
      });

      const rawResults = response.data.results || [];
      const flattened = [];

      rawResults.forEach((sourceBatch) => {
        const sourceName = sourceBatch.source;
        sourceBatch.data.forEach((item) => {
          flattened.push({
            ...item,
            source: sourceName === 'pubmed' ? 'PubMed' : 'ClinicalTrials',
          });
        });
      });

      setResults(flattened);
      if (flattened.length === 0) {
        setDebugMsg("No records found for this query.");
      } else {
        setDebugMsg(`Retrieved ${flattened.length} records.`);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Search failed. Check backend connectivity.";
      setError(msg);
      setDebugMsg("Search terminated with error.");
    } finally {
      setLoading(false);
    }
  };

  const pubmedResults = results.filter((r) => r.source === 'PubMed');
  const ctResults = results.filter((r) => r.source === 'ClinicalTrials');

  return (
    <div className="space-y-4 animate-in fade-in duration-700 max-w-6xl mx-auto pb-12">
      <header className="px-1">
        <Badge variant="primary">EVIDENCE DISCOVERY</Badge>
        <h2 className="font-serif font-black text-brand-navy mt-2 mb-1" style={{ fontSize: T.h2 }}>
          Search Research Abstracts
        </h2>
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          Enter a GI clinical topic. Evidence is summarized in real-time using {provider.toUpperCase()} logic.
        </p>
      </header>

      {/* SEARCH CARD */}
      <Card className="p-6 border border-slate-200 bg-white shadow-xl shadow-blue-900/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          
          {/* Search Input */}
          <div className="lg:col-span-4 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Search Value</label>
            <input
              type="text"
              placeholder="e.g. MASH Fibrosis Resmetirom..."
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold focus:ring-2 focus:ring-brand-blue focus:bg-white transition-all outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
            />
          </div>

          {/* Source Toggles */}
          <div className="lg:col-span-3 space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Sources</label>
            <div className="flex items-center gap-4">
              {['pubmed', 'clinicaltrials'].map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedSources.includes(s)}
                    onChange={() => toggleSource(s)}
                    className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                  />
                  <span className="text-[11px] font-bold text-slate-600 uppercase group-hover:text-brand-blue transition-colors">
                    {s === 'pubmed' ? 'PubMed' : 'Trials'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Results Limit */}
          <div className="lg:col-span-1 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Limit</label>
            <select 
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-bold" 
              value={maxResults} 
              onChange={(e) => setMaxResults(parseInt(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((v) => (<option key={v} value={v}>{v}</option>))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="lg:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Year</label>
            <select 
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-bold" 
              value={year} 
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">Any</option>
              {[2026, 2025, 2024, 2023, 2022].map((y) => (<option key={y} value={y}>{y}</option>))}
            </select>
          </div>

          {/* Model Provider */}
          <div className="lg:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Model</label>
            <select
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-bold"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              {isLocal && <option value="ollama">Ollama (Local)</option>}
              <option value="runpod">RunPod (MedGemma)</option>
              <option value="groq">Groq (Llama-3)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleExtract}
          disabled={loading}
          className="w-full mt-6 py-4 bg-brand-navy text-white rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all text-xs disabled:opacity-50"
        >
          {loading ? 'ANALYZING CLINICAL DATA...' : 'Execute Research Search'}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-bold rounded-lg flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}
        {debugMsg && !error && (
          <p className="mt-4 text-[10px] text-slate-400 font-mono italic">{debugMsg}</p>
        )}
      </Card>

      {/* RESULTS DISPLAY */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-5 duration-700 mt-8">
          {/* PubMed Column */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-brand-navy uppercase tracking-[0.2em] border-b pb-2">
              PubMed Results ({pubmedResults.length})
            </h3>
            {pubmedResults.map((res, i) => <ResultCard key={i} res={res} />)}
          </div>
          
          {/* Clinical Trials Column */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-amber-600 uppercase tracking-[0.2em] border-b pb-2">
              Clinical Trials ({ctResults.length})
            </h3>
            {ctResults.map((res, i) => <ResultCard key={i} res={res} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultCard({ res }) {
  // Parsing logic for PICO breakdown
  const picoLines = res.summary
    ? res.summary
        .split(/(?=P \(Population\)|I \(Intervention\)|C \(Comparison\)|O \(Outcome\))/)
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  return (
    <Card className="p-0 border border-slate-100 bg-white hover:border-brand-blue transition-all shadow-sm overflow-hidden relative">
      {/* Card Header */}
      <div className="p-4 border-b border-slate-50 flex items-start justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Badge variant={res.source === 'PubMed' ? 'primary' : 'warning'}>{res.paper_id}</Badge>
          {res.cached && (
            <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-black uppercase">
              Cached
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{res.source}</span>
          <span className="text-[10px] font-black text-brand-navy bg-blue-50 px-2 rounded-sm">{res.year}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6">
        <p className="text-sm text-slate-700 leading-relaxed italic mb-6">
          "{res.abstract.substring(0, 280)}..."
        </p>

        {/* ⚡ PICO BOX */}
        <div className="p-5 bg-blue-50/40 rounded-2xl border border-blue-100 ai-glow">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs animate-bounce">⚡</span>
            <p className="text-[10px] font-black uppercase text-brand-navy tracking-widest">PICO Synthesis</p>
          </div>

          {picoLines.length > 0 ? (
            <div className="space-y-3">
              {picoLines.map((line, i) => (
                <div 
                  key={i} 
                  className="pico-line" 
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <p className="text-xs text-slate-800 leading-relaxed font-semibold border-l-2 border-brand-blue/30 pl-3">
                    {line}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Processing evidence...</p>
          )}
        </div>
      </div>
    </Card>
  );
}