import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw, Trophy, TrendingUp, TrendingDown, Users, Award, AlertTriangle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

/**
 * Staff Performance Scores Component
 * Displays AI-generated employee performance ratings with proper Tailwind UI
 */
export default function StaffScores() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('score');

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE}/api/ai/staff-score`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = response.data.data;
      setScores(data.scores || []);
    } catch (err) {
      console.error('Staff scores fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load staff scores');
    } finally {
      setLoading(false);
    }
  };

  const getSortedScores = () => {
    const sorted = [...scores];
    if (sortBy === 'score') {
      sorted.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score) => {
    if (score >= 90) return 'bg-emerald-50 border-emerald-200';
    if (score >= 75) return 'bg-blue-50 border-blue-200';
    if (score >= 60) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreBarColor = (score) => {
    if (score >= 90) return 'bg-gradient-to-r from-emerald-400 to-emerald-600';
    if (score >= 75) return 'bg-gradient-to-r from-blue-400 to-blue-600';
    if (score >= 60) return 'bg-gradient-to-r from-orange-400 to-orange-500';
    return 'bg-gradient-to-r from-red-400 to-red-500';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Average';
    return 'Needs Improvement';
  };

  const getRankIcon = (idx) => {
    if (idx === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (idx === 1) return <Award className="w-5 h-5 text-gray-400" />;
    if (idx === 2) return <Award className="w-5 h-5 text-orange-400" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-400">#{idx + 1}</span>;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-gray-600 font-medium">Analyzing staff performance...</p>
        <p className="text-sm text-gray-400 mt-1">Evaluating sales, hours, and consistency</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-700 font-medium">{error}</p>
        <button onClick={fetchScores} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium">
          Retry
        </button>
      </div>
    );
  }

  if (!scores.length) {
    return (
      <div className="text-center py-12">
        <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No employee data available for scoring</p>
        <p className="text-sm text-gray-400 mt-1">Scores are based on sales performance and time tracking</p>
      </div>
    );
  }

  const sortedScores = getSortedScores();
  const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  const topPerformer = sortedScores[0];
  const lowestPerformer = sortedScores[sortedScores.length - 1];
  const excellentCount = scores.filter(s => s.score >= 90).length;
  const needsImprovementCount = scores.filter(s => s.score < 60).length;

  return (
    <div className="space-y-5">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-gray-500 font-medium">{scores.length} employees scored</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchScores} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 transition"
            title="Refresh scores"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600"
          >
            <option value="score">Sort by Score</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-xs text-blue-100 font-medium">Team Average</p>
          <p className="text-2xl font-bold mt-1">{avgScore.toFixed(1)}</p>
          <p className="text-xs text-blue-200 mt-0.5">out of 100</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl p-4 text-white">
          <p className="text-xs text-yellow-100 font-medium">Top Performer</p>
          <p className="text-lg font-bold mt-1 truncate">{topPerformer?.name}</p>
          <p className="text-xs text-yellow-200 mt-0.5">Score: {topPerformer?.score}/100</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-emerald-200" />
            <p className="text-xs text-emerald-100 font-medium">Excellent</p>
          </div>
          <p className="text-2xl font-bold mt-1">{excellentCount}</p>
          <p className="text-xs text-emerald-200 mt-0.5">staff scoring 90+</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-1">
            <TrendingDown className="w-4 h-4 text-red-200" />
            <p className="text-xs text-red-100 font-medium">Needs Attention</p>
          </div>
          <p className="text-2xl font-bold mt-1">{needsImprovementCount}</p>
          <p className="text-xs text-red-200 mt-0.5">staff scoring below 60</p>
        </div>
      </div>

      {/* Staff List */}
      <div className="space-y-3">
        {sortedScores.map((staff, idx) => (
          <div 
            key={idx} 
            className={`rounded-xl border p-4 transition-all hover:shadow-md ${getScoreBg(staff.score)}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {getRankIcon(idx)}
                <div>
                  <h4 className="font-semibold text-gray-900">{staff.name}</h4>
                  <span className={`text-xs font-medium ${getScoreColor(staff.score)}`}>
                    {getScoreLabel(staff.score)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${getScoreColor(staff.score)}`}>
                  {staff.score}
                </span>
                <span className="text-sm text-gray-400">/100</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-700 ${getScoreBarColor(staff.score)}`}
                style={{ width: `${staff.score}%` }}
              />
            </div>

            {/* AI Reasoning */}
            {staff.reason && (
              <div className="flex items-start gap-2 text-sm text-gray-600 bg-white/60 rounded-lg px-3 py-2">
                <span className="text-base mt-0.5">💡</span>
                <p className="leading-relaxed">{staff.reason}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center pt-2">
        <p className="text-xs text-gray-400">
          Scores are calculated by AI based on sales volume, hours worked, and consistency. Updated in real-time.
        </p>
      </div>
    </div>
  );
}
