import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { Card, Badge } from './Cards';
import { C, T } from '../theme/tokens';

// Register Chart.js components once
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController
);

export default function TemporalPage() {
  // --- ONLY ONE DECLARATION OF STATE ---
  const [data, setData] = useState({ 
    labels: ["2020", "2021", "2022", "2023", "2024"], 
    cdc: [1000, 1200, 1500, 1800, 2100], 
    research: [50, 80, 120, 110, 200] 
  });
  const [loading, setLoading] = useState(false); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        // const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
        const API_BASE = import.meta.env.VITE_API_BASE || '';

        // 1. Update the URL to match the FastAPI route we built
        const response = await axios.get(`${API_BASE}/api/analytics/temporal-mismatch`);
        
        const rawData = response.data;

        if (rawData && rawData.length > 0) {
          // 2. Transform the list of objects into three separate arrays
          const labels = rawData.map(item => item.year.toString());
          const cdc = rawData.map(item => item.deaths);
          const research = rawData.map(item => item.research);

          setData({ labels, cdc, research });
        }
      } catch (err) {
        console.error("Timeline Sync Failed:", err);
      }
    };
    fetchData();
  }, []);

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        type: 'line',
        label: 'CDC Mortality (Deaths)',
        data: data.cdc,
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
        data: data.research,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderRadius: 6,
        yAxisID: 'y',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { 
        position: 'top', 
        labels: { font: { size: 14, weight: 'bold' }, color: C.text } 
      },
    },
    scales: {
      y: { 
        type: 'linear', display: true, position: 'left', 
        title: { display: true, text: 'Research Count' }
      },
      y1: { 
        type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false },
        title: { display: true, text: 'Actual Deaths' }
      },
      x: { grid: { display: false } }
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 p-6">
      <header>
        <Badge variant="primary">LIVE DATABASE SYNC</Badge>
        <h2 className="font-serif font-black text-[#1E3A8A] mt-4 mb-4" style={{ fontSize: T.h1 }}>
          Temporal Mismatch Analysis
        </h2>
      </header>

      <Card className="p-10 bg-white rounded-xl shadow-sm border">
        <div className="h-[500px]">
          <Chart type='bar' data={chartData} options={options} />
        </div>
      </Card>
    </div>
  );
}