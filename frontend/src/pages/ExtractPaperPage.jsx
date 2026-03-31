import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Badge } from './Cards';
import { T } from '../theme/tokens';
import { API_BASE } from '../config';

const NICHES = ['Lean_MASLD', 'MASH_Fibrosis', 'MASLD_HCC'];

export default function ExtractPaperPage() {
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [niche, setNiche] = useState(NICHES[0]);
  const [records, setRecords] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugMsg, setDebugMsg] = useState('');

  const filteredRecords = records.filter(r => {
    if (sourceFilter === 'ALL') return true;
    const normalizedSource = r.source === 'ClinicalTrials' ? 'CT' : 'PubMed';
    return normalizedSource === sourceFilter;
  });

  useEffect(() => {
    const loadRecords = async () => {
      setLoadingRecords(true);
      setRecords([]);
      setSelectedId('');
      setResult(null);
      setError(null);
      setDebugMsg('');
      setSourceFilter('ALL');

      try {
        const res = await axios.get(`${API_BASE}/api/records`, {
          params: { niche },
        });
        const data = res.data.records || [];
        setRecords(data);
        if (data.length > 0) setSelectedId(data[0].external_id);
      } catch (err) {
        setError('Failed to load records for this niche.');
      } finally {
        setLoadingRecords(false);
      }
    };

    loadRecords();
  }, [niche]);

  const handleExtract = async () => {
    if (!selectedId) {
      setError('No record selected.');
      return;
    }

    const isPMID = selectedId.includes('_PMID_');
    const source = isPMID ? 'PMID' : 'NCT';
    
    const rawId = isPMID
      ? selectedId.split('_PMID_')[1]
      : `NCT${selectedId.split('_NCT_')[1]}`;

    setLoading(true);
    setError(null);
    setResult(null);
    setDebugMsg('Retrieving full text...');

    try {
      const res = await axios.post(`${API_BASE}/api/extract/paper`, {
        source,
        niche,
        id: rawId,
      });
      setResult(res.data);
      setDebugMsg('Full text retrieved successfully.');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Extraction failed. Check backend connectivity.';
      setError(msg);
      setDebugMsg('Extraction terminated with error.');
    } finally {
      setLoading(false);
    }
  };

  const selectedRecord = records.find(r => r.external_id === selectedId);

  const formatLabel = (record) => {
    const label = `${record.external_id} - ${record.title || ''}`;
    return label.length > 90 ? label.substring(0, 90) + '...' : label;
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-700 max-w-6xl mx-auto pb-12">
      <header className="px-1">
        <Badge variant="primary">TOOLS / FULL TEXT RETRIEVAL</Badge>
        <h2 className="font-serif font-black text-[#1E3A8A] mt-2 mb-1" style={{ fontSize: T.h2 }}>
          Extract Complete Paper
        </h2>
        <p className="text-[#64748B] text-sm leading-relaxed max-w-2xl">
          Retrieve protocols and clinical data from PubMed Central (Open Access) or
          ClinicalTrials.gov documentation.
        </p>
      </header>

      {/* FILTER CARD */}
      <Card className="p-6 border border-slate-200 bg-white shadow-xl shadow-blue-900/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">

          {/* Niche */}
          <div className="lg:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Niche</label>
            <select
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
            >
              {NICHES.map(n => (
                <option key={n} value={n}>{n.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div className="lg:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Source</label>
            <select
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              value={sourceFilter}
              onChange={(e) => {
                const newSource = e.target.value;
                setSourceFilter(newSource);
                const nextFiltered = records.filter(r => {
                  if (newSource === 'ALL') return true;
                  const norm = r.source === 'ClinicalTrials' ? 'CT' : 'PubMed';
                  return norm === newSource;
                });
                setSelectedId(nextFiltered.length > 0 ? nextFiltered[0].external_id : '');
              }}
            >
              <option value="ALL">All Sources</option>
              <option value="PubMed">PubMed</option>
              <option value="CT">Clinical Trials</option>
            </select>
          </div>

          {/* Record selector */}
          <div className="lg:col-span-6 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Select a Record
              {!loadingRecords && (
                <span className="ml-2 text-slate-300 normal-case font-medium">
                  {filteredRecords.length} matches
                </span>
              )}
            </label>
            <select
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={loadingRecords || filteredRecords.length === 0}
            >
              {loadingRecords ? (
                <option>Loading...</option>
              ) : filteredRecords.length === 0 ? (
                <option value="">No matches found</option>
              ) : (
                filteredRecords.map(r => (
                  <option key={r.external_id} value={r.external_id}>
                    {formatLabel(r)}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Extract Button */}
          <div className="lg:col-span-2">
            <button
              onClick={handleExtract}
              disabled={loading || !selectedId || filteredRecords.length === 0}
              className="w-full py-3 bg-[#1E3A8A] text-white rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all text-[10px] disabled:opacity-50"
            >
              {loading ? 'Extracting...' : 'Extract Full Paper'}
            </button>
          </div>
        </div>

        {selectedRecord && (
          <div className="mt-4 flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
            <span className="text-[10px] text-slate-400 font-mono">Ready:</span>
            <Badge variant={(selectedRecord.source === 'PubMed' || selectedRecord.source === 'PMID') ? 'primary' : 'warning'}>
              {selectedRecord.external_id}
            </Badge>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {selectedRecord.source}
            </span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-bold rounded-lg flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {debugMsg && !error && (
          <p className="mt-4 text-[10px] text-slate-400 font-mono italic">{debugMsg}</p>
        )}
      </Card>

      {/* RESULT SECTION */}
      {result && (
        <div className="animate-in slide-in-from-bottom-5 duration-700 mt-4">
          <Card className="p-0 border border-slate-100 bg-white shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={(result.source === 'PubMed' || result.source === 'PMID') ? 'primary' : 'warning'}>
                  {result.external_id}
                </Badge>
                <span className="text-[9px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-black uppercase tracking-tighter">
                  Full Text
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                  Full Document Title
                </p>
                <h3 className="text-xl font-bold text-[#1E3A8A] leading-snug">
                  {result.title && !result.title.startsWith('Paper') 
                    ? result.title 
                    : (records.find(r => r.external_id === result.external_id)?.title || result.title)}
                </h3>
              </div>

              {result.full_text && (
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                    Full Text Content
                  </p>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium max-h-[600px] overflow-y-auto">
                    {result.full_text}
                  </div>
                </div>
              )}

              {result.external_id && (
                <a
                  href={
                    (result.source === 'PubMed' || result.source === 'PMID')
                      ? `https://pubmed.ncbi.nlm.nih.gov/${result.external_id.replace(/\D/g, '')}/`
                      : `https://clinicaltrials.gov/study/NCT${result.external_id.replace(/\D/g, '')}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-700 hover:text-black transition-colors"
                >
                  <span>↗</span> View Original Source
                </a>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}