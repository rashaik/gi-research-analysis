import React from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card, Badge, StatCard } from './Cards';
import { C, T } from '../theme/tokens';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DemographicGapPage() {
  const ageData = {
    labels: ['18-44', '45-64', '65-74', '75-84', '85+'],
    datasets: [
      {
        label: 'Mortality Intensity (CDC)',
        data: [5, 25, 35, 65, 85],
        backgroundColor: C.hcc,
        borderRadius: 4,
      },
      {
        label: 'Trial Eligibility (%)',
        data: [95, 92, 75, 45, 29],
        backgroundColor: '#3B82F6',
        borderRadius: 4,
      }
    ]
  };

  const ageOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { 
      y: { beginAtZero: true, title: { display: true, text: 'Percentage / Intensity' } } 
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-6 duration-700">
      <header>
        <Badge variant="primary">DEMOGRAPHIC FINDING 02</Badge>
        <h2 className="font-serif font-black text-[#1E3A8A] mt-4 mb-4" style={{ fontSize: T.h1 }}>
          The Demographic Gap: Aging Crisis
        </h2>
        <p className="text-[#64748B] max-w-3xl leading-relaxed" style={{ fontSize: T.body }}>
          Clinical trial eligibility criteria significantly deviate from the actual age distribution of MASLD-related mortality. 
          The highest-risk demographic is currently the most under-studied.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard label="85+ Group Coverage" value="29.1%" sub="Relative Mortality vs Trial Intensity" color="primary" compact />
        <StatCard label="Critical Exclusion" value=">70%" sub="Trials excluding highest mortality band" color="hcc" compact />
      </div>

      <Card className="p-6 border-t-8 border-[#3B82F6]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 bg-blue-50/50 p-8 rounded-2xl border border-blue-100/50">
              <h4 className="text-[9px] font-black uppercase text-blue-800 tracking-widest mb-3">Critical Data Point</h4>
              <div className="text-3xl font-black text-[#1E3A8A] mb-3">Only 29.1%</div>
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                MASLD (K76) coverage for the 85+ age band. This represents the widest gap in evidence-based 
                liver research today.
              </p>
          </div>
          <div className="lg:col-span-8 flex flex-col justify-center">
              <h3 className="text-xl font-black text-[#1E3A8A] mb-4">Evidence Void Analysis</h3>
              <p className="text-md text-[#475569] leading-relaxed mb-4">
                A critical evidence void exists where over **70% of MASLD clinical trials** explicitly exclude the age demographic 
                with the absolute highest mortality burden.
              </p>
             <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-4">
                <span className="text-2xl">⚠️</span>
                <p className="text-sm font-bold text-rose-800">Conclusion: Urgent need for inclusive trials in aging populations at the highest risk.</p>
             </div>
          </div>
        </div>
      </Card>
      
      {/* Age Distribution Visualization */}
      <Card className="p-6 border border-slate-100 shadow-xl bg-gradient-to-br from-white to-slate-50/50">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1E3A8A] mb-6 text-center">Mortality vs Trial Access: Demographic Mismatch Index</h4>
        <div className="h-[400px]">
          <Bar data={ageData} options={ageOptions} />
        </div>
      </Card>
    </div>
  );
}
