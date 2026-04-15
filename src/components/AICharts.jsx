import React, { useEffect, useState } from 'react';
import { AlertTriangle, BrainCircuit, RefreshCw, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

/**
 * AI-powered sales forecast chart component
 * Displays predicted revenue and profit trends
 */
export default function AICharts({ periods = 4 }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);

  useEffect(() => {
    fetchForecast();
  }, [periods]);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      setError(null);
      setWarning(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to view AI forecasts');
      }

      const response = await axios.get(
        `${API_BASE}/api/ai/forecast?periods=${periods}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Handle both success response formats
      const forecastData = response.data?.data || response.data;
      
      // Check if we have valid forecast data
      if (!forecastData || !forecastData.labels || !forecastData.revenue) {
        throw new Error('Invalid forecast data received');
      }
      
      // Transform data for Recharts
      const chartData = forecastData.labels.map((label, i) => ({
        name: label,
        revenue: forecastData.revenue[i] || 0,
        profit: forecastData.profit[i] || 0
      }));

      setData(chartData);
      if (forecastData.note) {
        setWarning(forecastData.note);
      }
    } catch (err) {
      console.error('Forecast fetch error:', err);
      
      // Provide helpful error messages
      let errorMessage = 'Failed to load forecast';
      
      if (err.response?.status === 401) {
        errorMessage = 'Please login to view AI forecasts';
      } else if (err.response?.status === 403) {
        errorMessage = err.response?.data?.message || 'AI features require Pro plan';
      } else if (err.response?.status === 500) {
        errorMessage = 'AI service temporarily unavailable. Using fallback mode.';
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setData([]);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white/80 py-12">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <BrainCircuit className="w-7 h-7 animate-pulse" />
        </div>
        <p className="text-slate-700 font-semibold">Generating forecast</p>
        <p className="text-sm text-slate-500 mt-1">Analyzing recent sales, cost, and margin trends.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-orange-900 mb-1">AI Forecast Unavailable</h3>
            <p className="text-sm text-orange-700 mb-3">{error}</p>
            <button 
              onClick={fetchForecast} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="ai-charts-empty">
        <p>No forecast data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Projected Revenue vs Profit</h3>
          <p className="text-sm text-slate-500">Forecast horizon: next {periods} periods.</p>
        </div>
        <button
          onClick={fetchForecast}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          title="Refresh forecast"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {warning && (
        <div className="mb-3 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
          {warning}
        </div>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip
            formatter={(value) => `KSH ${value.toLocaleString()}`}
            labelStyle={{ color: '#333' }}
            contentStyle={{ borderRadius: '16px', borderColor: '#cbd5e1' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#0f766e"
            strokeWidth={3}
            name="Revenue"
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="profit"
            stroke="#2563eb"
            strokeWidth={3}
            name="Profit"
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Projected Revenue</span>
          <div className="mt-2 flex items-center gap-2 text-2xl font-bold text-emerald-800">
            <TrendingUp className="w-5 h-5" />
            KSH {data[data.length - 1]?.revenue.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Projected Profit</span>
          <div className="mt-2 flex items-center gap-2 text-2xl font-bold text-blue-800">
            KSH {data[data.length - 1]?.profit.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
