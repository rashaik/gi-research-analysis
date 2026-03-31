import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler, BarController, LineController
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { Card, Badge, StatCard } from './Cards';
import { C, T } from '../theme/tokens';
import { API_BASE } from '../config';

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler, BarController, LineController
);

export default function TemporalLagPage() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/analytics/temporal-mismatch`);
        const rawData = response.data;

        if (rawData && rawData.length > 0) {
          const labels = rawData.map(item => item.year.toString());
          const cdc = rawData.map(item => item.deaths);
          const research = rawData.map(item => item.research);

          setChartData({
            labels,
            datasets: [
              {
                type: 'line',
                label: 'CDC Mortality (Deaths)',
                data: cdc,
                borderColor: C.hcc,
                backgroundColor: 'transparent',
                borderWidth: 4,
                pointRadius: 6,
                yAxisID: 'y1',
                tension: 0.3,
              },
              {
                type: 'bar',
                label: 'PubMed Literature',
                data: research,
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderRadius: 6,
                yAxisID: 'y',
              }
            ]
          });
        }
      } catch (err) {
        console.error("Timeline Sync Failed:", err);
      }
    };
    fetchChartData();
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12, weight: 'bold' } } },
    },
    scales: {
      y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Research Count' } },
      y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Actual Deaths' } },
      x: { grid: { display: false } }
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
      <header>
        <Badge variant="hcc">TEMPORAL FINDING 01</Badge>
        <h2 className="font-serif font-black text-[#1E3A8A] mt-4 mb-4" style={{ fontSize: T.h1 }}>
          The Temporal Lag: Reactive Research
        </h2>
        <p className="text-[#64748B] max-w-3xl leading-relaxed" style={{ fontSize: T.body }}>
          An empirical analysis of the delay between real-world mortality spikes and clinical trial initiations. 
          Evidence suggests that current MASLD/MASH research is predominantly **reactive** rather than predictive.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Mortality Growth" value="193.9%" sub="MASLD/MASH Deaths Increase" color="hcc" compact />
        <StatCard label="Avg. Response Lag" value="4.5y" sub="CDC Spike to Trial Peak" color="primary" compact />
        <StatCard label="Response Status" value="REACTIVE" sub="Non-Predictive Research" color="warning" compact />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6 bg-white border-l-8 border-[#1E3A8A]">
           <h3 className="text-xl font-black text-[#1E3A8A] mb-4">Key Insight</h3>
           <p className="text-[#475569] leading-relaxed text-md mb-6">
             MASLD/MASH mortality has surged by over **193.9%** across the 25-year CDC window. 
             Analysis of ClinicalTrials.gov (NCT) data shows a **multi-year lag** where trial 
             initiations trail mortality spikes significantly.
           </p>
           <ul className="space-y-4">
             {[
               "Significant lag in trial funding following epidemic curves.",
               "High research density during stable mortality periods.",
               "Delayed response to demographic shifts in mortality."
             ].map((text, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0 mt-1">✓</div>
                  <span className="text-slate-600 font-medium">{text}</span>
                </li>
             ))}
           </ul>
        </Card>

        <div className="space-y-8">
          <Card className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1E3A8A] mb-4">Live Mismatch Data</h4>
             <div className="h-[400px]">
                {chartData ? (
                  <Chart type='bar' data={chartData} options={chartOptions} />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                    Synchronizing timeline data...
                  </div>
                )}
             </div>
          </Card>
          
          <div className="p-8 bg-[#1E3A8A] text-white rounded-3xl shadow-xl">
             <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-300 mb-4">Finding Conclusion</h4>
             <p className="text-lg font-medium leading-relaxed italic">
               "Research is currently structured as a response function to past mortality figures, 
               failing to anticipate trending health crises in metabolic liver disease."
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}