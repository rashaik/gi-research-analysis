import React from 'react';
import { Card, Badge } from './Cards';
import { KEY_FINDINGS_DATA } from '../data';
import { T } from '../theme/tokens';

export default function KeyFindingsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-6xl mx-auto">
      <header>
        <Badge variant="primary">SUMMARIZED INSIGHTS</Badge>
        <h2 className="font-serif font-black text-[#1E3A8A] mt-4 mb-2 leading-tight" style={{ fontSize: T.h1 }}>
          Key Findings Overview
        </h2>
        <p className="text-slate-500 text-lg">
          Evidence gap analysis across major GI niches, triangulating real-world mortality with research intensity.
        </p>
      </header>

      {/* --- KEY FINDINGS TABLE --- */}
      <section>
        <Card className="p-0 border border-slate-200 bg-white overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Niche</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">CDC Deaths (2024)</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">% Change (1999-2024)</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Res. Intensity</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Worst Age Band</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {KEY_FINDINGS_DATA.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-5 font-black text-[#1E3A8A]">{row.niche}</td>
                    <td className="px-6 py-5 text-center font-mono font-bold text-slate-600">{row.deaths.toLocaleString()}</td>
                    <td className="px-6 py-5 text-center text-rose-600 font-bold">{row.change}</td>
                    <td className="px-6 py-5 text-center font-bold text-blue-600">{row.intensity}</td>
                    <td className="px-6 py-5 text-center font-black text-rose-500 bg-rose-50/50">{row.ageBand}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* --- NARRATIVE SECTIONS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        
        {/* LEAN MASLD & MASH */}
        <Card className="p-8 border-l-8 border-blue-500">
           <h3 className="text-xl font-black text-blue-900 mb-4">The Lean MASLD & MASH Fibrosis "Lag"</h3>
           <p className="text-slate-600 mb-4 text-sm leading-relaxed">
             While these areas have higher "Research Intensity" scores, the data reveals a different kind of problem.
           </p>
           <ul className="space-y-3 text-sm">
             <li className="flex gap-2">
               <span className="text-blue-500 font-bold">•</span>
               <span><strong>Explosive Mortality:</strong> Both categories saw a 193.9% increase in deaths since 1999.</span>
             </li>
             <li className="flex gap-2">
               <span className="text-blue-500 font-bold">•</span>
               <span><strong>Surrogate Focus:</strong> Heavy lean toward Surrogate Endpoints (around 32% to 50%).</span>
             </li>
             <li className="bg-blue-50 p-3 rounded-lg border border-blue-100 font-medium italic text-blue-800">
               "Research in MASH is very active (RI = 160.94), but focus is on 'soft' markers (fat/biopsy) rather than 'hard' mortality outcomes."
             </li>
           </ul>
        </Card>

        {/* MASLD-HCC */}
        <Card className="p-8 border-l-8 border-rose-500">
           <h3 className="text-xl font-black text-rose-900 mb-4">The MASLD-HCC "Research Desert"</h3>
           <p className="text-slate-600 mb-4 text-sm leading-relaxed">
             This is the most striking finding regarding population-scale health equity.
           </p>
           <ul className="space-y-3 text-sm">
             <li className="flex gap-2">
               <span className="text-rose-500 font-bold">•</span>
               <span><strong>The Burden:</strong> Highest death toll (61,064 in 2024) and 119.4% growth rate.</span>
             </li>
             <li className="flex gap-2">
               <span className="text-rose-500 font-bold">•</span>
               <span><strong>The Gap:</strong> Research Intensity of only 7.94. Fewer than 8 major publications per 1,000 deaths.</span>
             </li>
             <li className="bg-rose-50 p-3 rounded-lg border border-rose-100 font-medium italic text-rose-800">
               "We face a mounting mortality crisis in liver cancer with a disproportionately small amount of research compared to the size of the problem."
             </li>
           </ul>
        </Card>

        {/* GERIATRIC BLIND SPOT */}
        <Card className="p-8 md:col-span-2 border-l-8 border-amber-500 bg-amber-50/30">
           <h3 className="text-xl font-black text-amber-900 mb-4">The "Geriatric Blind Spot" (85+ Age Band)</h3>
           <p className="text-slate-700 mb-6 text-sm">
             Essential for health equity analysis: clinical trial eligibility (PICO) reveals systemic exclusion of the geriatric population.
           </p>
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center font-bold text-amber-700 flex-none">!</div>
                    <div>
                      <h4 className="font-bold text-amber-900">The Disparity</h4>
                      <p className="text-xs text-slate-600">Across all three niches, the 85+ age group is the "Worst Covered" demographic.</p>
                    </div>
                 </div>
                 <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center font-bold text-amber-700 flex-none">📊</div>
                    <div>
                      <h4 className="font-bold text-amber-900">The Data</h4>
                      <p className="text-xs text-slate-600">Trial coverage at only 29.1% for 85+ despite high density of K76.0 deaths.</p>
                    </div>
                 </div>
              </div>
              <div className="p-6 bg-white border border-amber-200 rounded-2xl">
                 <p className="text-sm font-bold text-amber-900 italic leading-relaxed">
                   "As patients get older and more likely to die from the disease, they are paradoxically less likely to be included in the research that dictates their treatment."
                 </p>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
}
