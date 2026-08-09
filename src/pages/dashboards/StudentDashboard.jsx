import { useState, useEffect } from 'react';
import { BookOpen, DollarSign, Clock, Bell, FileText, Award, ChevronRight, LogIn, LogOut } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'results', label: 'Exam Results', icon: Award },
  { id: 'assignments', label: 'Assignments', icon: FileText },
  { id: 'fees', label: 'Fees & Payments', icon: DollarSign },
  { id: 'clockin', label: 'Attendance', icon: Clock },
  { id: 'notices', label: 'Notices', icon: Bell },
];

export default function StudentDashboard({ studentId: propStudentId }) {
  const { user } = useAuth();
  const studentId = propStudentId || user?.student_id || user?.id;

  const [activeTab, setActiveTab] = useState('overview');
  const [student, setStudent] = useState(null);
  const [fees, setFees] = useState([]);
  const [results, setResults] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notices, setNotices] = useState([]);
  const [clockEntries, setClockEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Load student info
      const students = await api.get('/students');
      const me = Array.isArray(students) ? students.find(s => s.id === studentId) : null;
      setStudent(me || user);

      const [feesData, resultsData, assignmentsData, noticesData, clockData] = await Promise.allSettled([
        api.get(`/students/${studentId}/fees`),
        api.get(`/students/${studentId}/results`),
        api.get(`/assignments${me?.class_name ? `?class=${encodeURIComponent(me.class_name)}` : ''}`),
        api.get('/school-notices'),
        api.get('/time-entries'),
      ]);

      setFees(feesData.status === 'fulfilled' && Array.isArray(feesData.value) ? feesData.value : []);
      setResults(resultsData.status === 'fulfilled' && Array.isArray(resultsData.value) ? resultsData.value : []);
      setAssignments(assignmentsData.status === 'fulfilled' && Array.isArray(assignmentsData.value) ? assignmentsData.value : []);
      setNotices(noticesData.status === 'fulfilled' && Array.isArray(noticesData.value) ? noticesData.value : []);
      setClockEntries(clockData.status === 'fulfilled' && Array.isArray(clockData.value) ? clockData.value : []);
    } catch (e) {
      setError(e.message || 'Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const totalDue = fees.reduce((s, f) => s + Number(f.amount_due || 0), 0);
  const totalPaid = fees.reduce((s, f) => s + Number(f.amount_paid || 0), 0);
  const balance = totalDue - totalPaid;

  const avgScore = results.length
    ? (results.reduce((s, r) => s + Number(r.score || 0) / Number(r.max_score || 100) * 100, 0) / results.length).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
              {(student?.name || user?.name || 'S')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{student?.name || user?.name || 'Student'}</h1>
              {student?.admission_number && (
                <p className="text-blue-200 text-sm">Adm: {student.admission_number}</p>
              )}
              {student?.class_name && (
                <p className="text-blue-200 text-sm">Class: {student.class_name}</p>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{avgScore ? `${avgScore}%` : '--'}</p>
              <p className="text-xs text-blue-200 mt-1">Avg Score</p>
            </div>
            <div className={`rounded-xl p-4 text-center ${balance > 0 ? 'bg-red-500/30' : 'bg-green-500/20'}`}>
              <p className="text-2xl font-bold">KSH {balance.toLocaleString()}</p>
              <p className="text-xs text-blue-200 mt-1">Fee Balance</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{assignments.filter(a => new Date(a.due_date) >= new Date()).length}</p>
              <p className="text-xs text-blue-200 mt-1">Pending Tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Dashboard</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Recent results */}
              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-500" /> Recent Results
                </h3>
                {results.slice(0, 3).map((r, i) => (
                  <div key={i} className="flex justify-between py-2 border-b last:border-0 text-sm">
                    <span className="text-gray-700">{r.subject}</span>
                    <span className={`font-bold ${Number(r.score) / Number(r.max_score || 100) >= 0.5 ? 'text-green-600' : 'text-red-600'}`}>
                      {r.score}/{r.max_score || 100}
                    </span>
                  </div>
                ))}
                {results.length === 0 && <p className="text-gray-400 text-sm">No results yet</p>}
              </div>

              {/* Upcoming assignments */}
              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" /> Upcoming Assignments
                </h3>
                {assignments
                  .filter(a => !a.due_date || new Date(a.due_date) >= new Date())
                  .slice(0, 3)
                  .map((a, i) => (
                    <div key={i} className="py-2 border-b last:border-0 text-sm">
                      <p className="font-medium text-gray-800">{a.title}</p>
                      <p className="text-gray-500">{a.subject} {a.due_date ? `· Due ${new Date(a.due_date).toLocaleDateString()}` : ''}</p>
                    </div>
                  ))}
                {assignments.length === 0 && <p className="text-gray-400 text-sm">No assignments</p>}
              </div>

              {/* Fees summary */}
              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" /> Fees Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Total Billed</span><span className="font-medium">KSH {totalDue.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Total Paid</span><span className="font-medium text-green-600">KSH {totalPaid.toLocaleString()}</span></div>
                  <div className="flex justify-between border-t pt-2"><span className="font-semibold">Balance Due</span><span className={`font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>KSH {balance.toLocaleString()}</span></div>
                </div>
              </div>

              {/* Latest notice */}
              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-purple-500" /> School Notices
                </h3>
                {notices.slice(0, 2).map((n, i) => (
                  <div key={i} className="py-2 border-b last:border-0 text-sm">
                    <p className="font-medium text-gray-800">{n.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{n.body?.slice(0, 80)}{n.body?.length > 80 ? '…' : ''}</p>
                  </div>
                ))}
                {notices.length === 0 && <p className="text-gray-400 text-sm">No notices</p>}
              </div>
            </div>
          </div>
        )}

        {/* EXAM RESULTS */}
        {activeTab === 'results' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Exam Results</h2>
            {results.length === 0 ? (
              <p className="text-gray-500">No exam results recorded yet.</p>
            ) : (
              <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
                <>
                  <div className="md:hidden space-y-3 p-4">
                    {results.map((r, i) => {
                      const pct = Number(r.max_score || 100) > 0 ? (Number(r.score) / Number(r.max_score)) * 100 : 0;
                      const grade = r.grade || (pct >= 70 ? 'A' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'E');
                      const gradeColor = pct >= 70 ? 'bg-green-100 text-green-700' : pct >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
                      return (
                        <div key={i} className="bg-white rounded-xl shadow p-4 space-y-2 border border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{r.subject}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${gradeColor}`}>{grade}</span>
                          </div>
                          <div className="text-xs text-gray-500">{r.exam_type || 'Exam'} · {r.term || '--'} {r.year || ''}</div>
                          <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                            <span className="text-gray-600">Score</span>
                            <span className={`font-bold ${pct >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                              {r.score}/{r.max_score || 100} ({pct.toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="hidden md:block">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Subject</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Term</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Score</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r, i) => {
                          const pct = Number(r.max_score || 100) > 0 ? (Number(r.score) / Number(r.max_score)) * 100 : 0;
                          return (
                            <tr key={i} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-800">{r.subject}</td>
                              <td className="px-4 py-3 text-gray-600">{r.exam_type || 'Exam'}</td>
                              <td className="px-4 py-3 text-gray-600">{r.term || '--'} {r.year || ''}</td>
                              <td className="px-4 py-3 text-right">
                                <span className={`font-bold ${pct >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                                  {r.score}/{r.max_score || 100}
                                </span>
                                <span className="text-gray-400 text-xs ml-1">({pct.toFixed(0)}%)</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${pct >= 70 ? 'bg-green-100 text-green-700' : pct >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                  {r.grade || (pct >= 70 ? 'A' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'E')}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              </div>
            )}
          </div>
        )}

        {/* ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignments</h2>
            {assignments.length === 0 ? (
              <p className="text-gray-500">No assignments posted yet.</p>
            ) : (
              <div className="space-y-3">
                {assignments.map((a, i) => {
                  const overdue = a.due_date && new Date(a.due_date) < new Date();
                  return (
                    <div key={i} className="bg-white rounded-xl border p-5 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">{a.title}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{a.subject} · {a.class_name}</p>
                          {a.description && <p className="text-sm text-gray-600 mt-2">{a.description}</p>}
                        </div>
                        {a.due_date && (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${overdue ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {overdue ? 'Overdue' : 'Due'} {new Date(a.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* FEES */}
        {activeTab === 'fees' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Fees & Payments</h2>
            {/* Balance card */}
            <div className={`rounded-xl p-6 mb-6 ${balance > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">Outstanding Balance</p>
                  <p className={`text-3xl font-bold mt-1 ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    KSH {balance.toLocaleString()}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p>Billed: <span className="font-medium">KSH {totalDue.toLocaleString()}</span></p>
                  <p>Paid: <span className="font-medium text-green-600">KSH {totalPaid.toLocaleString()}</span></p>
                </div>
              </div>
            </div>
            {fees.length === 0 ? (
              <p className="text-gray-500">No fee records found.</p>
            ) : (
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <>
                  <div className="md:hidden space-y-3 p-4">
                    {fees.map((f, i) => {
                      const bal = Number(f.amount_due || 0) - Number(f.amount_paid || 0);
                      return (
                        <div key={i} className="bg-white rounded-xl shadow p-4 space-y-2 border border-gray-100">
                          <div className="font-medium text-gray-900">{f.term || '--'} {f.year || ''}</div>
                          <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                            <span className="text-gray-600">Billed</span>
                            <span className="text-gray-900">KSH {Number(f.amount_due).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Paid</span>
                            <span className="text-green-600 font-medium">KSH {Number(f.amount_paid).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Balance</span>
                            <span className={`font-bold ${bal > 0 ? 'text-red-600' : 'text-green-600'}`}>KSH {bal.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                            <span className="text-gray-600">Method</span>
                            <span className="text-gray-900 capitalize">{f.payment_method || '--'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="hidden md:block">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Term</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Billed</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Paid</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Balance</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fees.map((f, i) => {
                          const bal = Number(f.amount_due || 0) - Number(f.amount_paid || 0);
                          return (
                            <tr key={i} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium">{f.term || '--'} {f.year || ''}</td>
                              <td className="px-4 py-3 text-right">KSH {Number(f.amount_due).toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-green-600">KSH {Number(f.amount_paid).toLocaleString()}</td>
                              <td className={`px-4 py-3 text-right font-bold ${bal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                KSH {bal.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-gray-500 capitalize">{f.payment_method || '--'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              </div>
            )}
          </div>
        )}

        {/* ATTENDANCE / CLOCK IN-OUT */}
        {activeTab === 'clockin' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance Records</h2>
            {clockEntries.length === 0 ? (
              <p className="text-gray-500">No attendance records found.</p>
            ) : (
              <div className="space-y-2">
                {clockEntries.slice(0, 30).map((entry, i) => (
                  <div key={i} className="bg-white rounded-lg border p-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      {entry.type === 'clock_in' || entry.clock_in ? (
                        <LogIn className="w-4 h-4 text-green-500" />
                      ) : (
                        <LogOut className="w-4 h-4 text-orange-500" />
                      )}
                      <div>
                        <p className="font-medium text-gray-800">
                          {entry.type === 'clock_in' || entry.clock_in ? 'Clock In' : 'Clock Out'}
                        </p>
                        <p className="text-gray-500 text-xs">{entry.date || entry.created_at?.slice(0, 10)}</p>
                      </div>
                    </div>
                    <span className="text-gray-600 font-mono">
                      {entry.time || (entry.clock_in ? new Date(entry.clock_in).toLocaleTimeString() : '') || '--'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NOTICES */}
        {activeTab === 'notices' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">School Notices</h2>
            {notices.length === 0 ? (
              <p className="text-gray-500">No notices yet.</p>
            ) : (
              <div className="space-y-3">
                {notices.map((n, i) => (
                  <div key={i} className="bg-white rounded-xl border p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-800">{n.title}</h3>
                      <span className="text-xs text-gray-400">{n.created_at?.slice(0, 10)}</span>
                    </div>
                    {n.body && <p className="text-sm text-gray-600 mt-2">{n.body}</p>}
                    {n.audience && n.audience !== 'all' && (
                      <span className="mt-2 inline-block text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{n.audience}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
