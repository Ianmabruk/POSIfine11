import React, { useEffect, useState } from 'react';
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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
        <p className="text-gray-600 font-medium">🤖 Generating AI forecast...</p>
        <p className="text-sm text-gray-500 mt-1">Analyzing sales patterns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-orange-900 mb-1">AI Forecast Unavailable</h3>
            <p className="text-sm text-orange-700 mb-3">{error}</p>
            <button 
              onClick={fetchForecast} 
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-medium"
            >
              🔄 Retry
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
    <div className="ai-charts-container">
      <div className="ai-charts-header">
        <h3>📈 AI Sales Forecast</h3>
        <button onClick={fetchForecast} className="refresh-btn" title="Refresh forecast">
          🔄
        </button>
      </div>

      {warning && (
        <div className="mb-3 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded px-3 py-2">
          {warning}
        </div>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(value) => `$${value.toFixed(2)}`}
            labelStyle={{ color: '#333' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#2196F3"
            strokeWidth={2}
            name="Revenue"
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="profit"
            stroke="#4CAF50"
            strokeWidth={2}
            name="Profit"
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="ai-charts-summary">
        <div className="summary-card">
          <span className="summary-label">Projected Revenue</span>
          <span className="summary-value revenue">
            ${data[data.length - 1]?.revenue.toFixed(2)}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Projected Profit</span>
          <span className="summary-value profit">
            ${data[data.length - 1]?.profit.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
