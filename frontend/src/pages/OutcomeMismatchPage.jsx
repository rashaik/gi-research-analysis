import React from 'react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Card, Badge, StatCard } from './Cards';
import { C, T } from '../theme/tokens';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function OutcomeMismatchPage() {
  const outcomeData = {
    labels: ['Surrogate Markers (Fat/Imaging)', 'Bio-Markers (ALT/AST)', 'Hard Mortality/Survival', 'Secondary Endpoints'],
    datasets: [
      {
        data: [50.5, 25.0, 7.9, 16.6],
        backgroundColor: [
          '#F59E0B', // amber
          '#3B82F6', // blue
          C.hcc,     // crimson
          '#94A3B8'  // slate
        ],
        borderWidth: 0,
      }
    ]
  };

  const outcomeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } }
    },
    cutout: '70%'
  };

  return (
    <div className="space-y-8 animate-in rotate-in-1 duration-700">
      <header>
        <Badge variant="warning">OUTCOME FINDING 03</Badge>
        <h2 className="font-serif font-black text-[#1E3A8A] mt-4 mb-4" style={{ fontSize: T.h1 }}>
          The Outcome-Mortality Mismatch
        </h2>
        <p className="text-[#64748B] max-w-3xl leading-relaxed" style={{ fontSize: T.body }}>
          A persistent misalignment between clinical trial focuses and the real-world mortality burden. 
          While mortality is increasing, research remains tethered to surrogate markers.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard label="Surrogate Focus" value="50.5%" sub="MASH Trials Focused on Fat/Imaging" color="warning" compact />
        <StatCard label="Highest Mortality" value="MASLD-HCC" sub="Liver cell carcinoma (C22.0)" color="hcc" compact />
        <StatCard label="Research Intensity" value="7.94" sub="Lowest Intensity for Highest Burden" color="primary" compact />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
           <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1E3A8A] mb-6">PICO Outcome Typology: Clinical Focus Distribution</h4>
           <div className="h-[250px]">
              <Doughnut data={outcomeData} options={outcomeOptions} />
           </div>
        </Card>

        <div className="p-8 bg-[#1B2B48] text-white rounded-3xl flex flex-col justify-center border-l-8 border-rose-500 shadow-xl">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-500 text-2xl font-black">!</div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-300">Analytical Recommendation</h4>
           </div>
           <p className="text-2xl font-black text-white italic leading-tight mb-4">
             "Clinical trials must shift focus toward hard mortality endpoints to effectively address the MASLD crisis."
           </p>
           <p className="text-slate-400 text-sm">
             Current reliance on surrogate markers slows the triangulation between trial outcomes and real-world population data.
           </p>
        </div>
      </div>

      <div className="space-y-8">
        <Card className="p-6 border-r-8 border-[#F59E0B]">
           <h3 className="text-xl font-black text-[#1E3A8A] mb-6">Structural Mismatch Analysis</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                 <h4 className="flex items-center gap-3 text-lg font-bold text-amber-700 uppercase tracking-tight">
                   <div className="w-10 h-10 rounded bg-amber-100 flex items-center justify-center">🔍</div>
                   MASH Fibrosis Gap
                 </h4>
                 <p className="text-slate-600 leading-loose">
                   A significant **50.5%** of recent clinical trials focus exclusively on **surrogate markers** 
                   like liver fat content or radiological imaging, rather than hard clinical endpoints.
                 </p>
              </div>
              <div className="space-y-4">
                 <h4 className="flex items-center gap-3 text-lg font-bold text-rose-800 uppercase tracking-tight">
                   <div className="w-10 h-10 rounded bg-rose-100 flex items-center justify-center">📉</div>
                   MASLD-HCC Paradox
                 </h4>
                 <p className="text-slate-600 leading-loose">
                   Despite representing the highest absolute mortality burden, **MASLD-HCC** currently receives 
                   the lowest research intensity score (**7.94**) relative to other liver disease niches.
                 </p>
              </div>
           </div>
        </Card>

        <div className="p-8 bg-[#1B2B48] text-white rounded-3xl flex items-center gap-10">
           <div className="hidden lg:block w-32 h-32 bg-white/10 rounded-full flex items-center justify-center text-4xl">⚠</div>
           <div className="flex-1">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-300 mb-2">Final Conclusion</h4>
              <p className="text-2xl font-black text-white italic">"Critical Need: Clinical trials must shift focus toward hard mortality endpoints to effectively address the MASLD crisis."</p>
           </div>
        </div>
      </div>
    </div>
  );
}
