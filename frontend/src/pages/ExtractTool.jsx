import React, { useState } from 'react';
import axios from 'axios';

export default function ExtractTool({ type, endpoint }) {
  const [id, setId] = useState("");
  const [status, setStatus] = useState(null);

  const handleExtract = async () => {
    setStatus("Processing...");
    try {
      await axios.post(`http://localhost:8000${endpoint}`, { id });
      setStatus("Success! Check the PICO Explorer in a few moments.");
    } catch (err) {
      setStatus("Error: Could not trigger extraction.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-sm border">
      <h2 className="text-xl font-black mb-2">Extract {type} Abstract</h2>
      <p className="text-sm text-slate-500 mb-6">Enter the {type === 'PubMed' ? 'PMID' : 'NCTID'} to begin AI PICO processing.</p>
      
      <input 
        type="text" 
        value={id}
        onChange={(e) => setId(e.target.value)}
        placeholder={type === 'PubMed' ? "e.g., 11303298" : "e.g., NCT01234567"}
        className="w-full p-3 border rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      <button 
        onClick={handleExtract}
        className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all"
      >
        Start Extraction
      </button>
      
      {status && <p className="mt-4 text-center text-sm font-medium text-blue-600">{status}</p>}
    </div>
  );
}