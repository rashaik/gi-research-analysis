import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './pages/Sidebar';
import IntroPage from './pages/IntroPage';
import KeyDefinitionsPage from './pages/KeyDefinitionsPage';
import MethodologyPage from './pages/MethodologyPage';
import KeyFindingsPage from './pages/KeyFindingsPage';
import CdcPage from './pages/CdcPage';
import ExplorerPage from './pages/ExplorerPage'; 
import PipelinePage from './pages/PipelinePage';
import TemporalLagPage from './pages/TemporalLagPage';
import DemographicGapPage from './pages/DemographicGapPage';
import OutcomeMismatchPage from './pages/OutcomeMismatchPage';
import ExtractRecentPage from './pages/ExtractRecentPage';
import ExtractPaperPage from './pages/ExtractPaperPage';

export default function App() {
  const [page, setPage] = useState('intro');
  const [backendOk, setBackendOk] = useState(false);

  // const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/health`);
        if (response.data.status === 'online') {
          setBackendOk(true);
        }
      } catch (err) {
        setBackendOk(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 10000); 
    return () => clearInterval(interval);
  }, [API_BASE]);

  const renderContent = () => {
    switch(page) {
      case 'intro':            return <IntroPage />;
      case 'definitions':      return <KeyDefinitionsPage />;
      case 'methodology':      return <MethodologyPage />;
      case 'pipeline':         return <PipelinePage />;
      case 'cdc':              return <CdcPage />;
      case 'findings-table':   return <KeyFindingsPage />;
      case 'explorer':         return <ExplorerPage />;
      case 'temporal-lag':     return <TemporalLagPage />;
      case 'demographic-gap':  return <DemographicGapPage />;
      case 'outcome-mismatch': return <OutcomeMismatchPage />;
      case 'extract-recent':   return <ExtractRecentPage />;
      case 'extract-paper':    return <ExtractPaperPage />;
      default:                 return <IntroPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar 
        activePage={page} 
        onNavigate={setPage} 
        backendOk={backendOk} 
      />
      
      <main className="flex-1 overflow-hidden h-screen overflow-y-auto">
        {/* Full width for explorer, max-w for others */}
        {['explorer', 'pipeline', 'methodology'].includes(page) ? renderContent() : (
          <div className="max-w-7xl mx-auto p-12">
            {renderContent()}
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=Inter:wght@400;500;700&display=swap');
        body { font-family: 'Inter', sans-serif; color: #0F172A; }
        h1, h2, h3, .font-serif { font-family: 'Fraunces', serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  );
}