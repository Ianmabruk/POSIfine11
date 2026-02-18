import { useEffect, useState } from 'react';
import { MessageSquare, Send, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { adminSupport } from '../../services/api';

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

const categories = [
  { value: 'general', label: 'General' },
  { value: 'billing', label: 'Billing' },
  { value: 'technical', label: 'Technical' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'security', label: 'Security' }
];

export default function AdminSupportChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    subject: '',
    category: 'general',
    priority: 'normal',
    message: ''
  });

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await adminSupport.getMessages();
      setMessages(response?.messages || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load support messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      setError('Subject and message are required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const created = await adminSupport.sendMessage({
        subject: form.subject.trim(),
        message: form.message.trim(),
        category: form.category,
        priority: form.priority
      });
      setMessages((prev) => [created, ...prev]);
      setForm({ subject: '', category: 'general', priority: 'normal', message: '' });
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async (messageId) => {
    try {
      await adminSupport.closeMessage(messageId);
      setMessages((prev) => prev.map((msg) => (
        msg.id === messageId ? { ...msg, status: 'closed' } : msg
      )));
    } catch (err) {
      setError(err.message || 'Failed to close message');
    }
  };

  const statusStyles = (status) => {
    if (status === 'responded') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'closed') return 'bg-gray-100 text-gray-600 border-gray-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Support Console</h2>
            <p className="text-sm text-gray-500">Send issues directly to main.admin and track responses.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Short summary of the issue"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {priorities.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
              placeholder="Describe the issue, steps to reproduce, and expected behavior."
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? 'Sending...' : 'Send to main.admin'}
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Messages</h3>
            <button
              onClick={loadMessages}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading messages...</p>
          ) : messages.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-8">
              No messages yet. Send your first issue to main.admin.
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">{msg.subject}</h4>
                      <p className="text-sm text-gray-500">{new Date(msg.created_at || msg.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${statusStyles(msg.status)}`}>
                        {msg.status || 'open'}
                      </span>
                      {msg.status !== 'closed' && (
                        <button
                          onClick={() => handleClose(msg.id)}
                          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" /> Close
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{msg.message}</p>

                  {msg.response && (
                    <div className="mt-4 border-l-4 border-green-400 bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> main.admin response
                      </div>
                      <p className="text-sm text-green-700 mt-2 whitespace-pre-wrap">{msg.response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
