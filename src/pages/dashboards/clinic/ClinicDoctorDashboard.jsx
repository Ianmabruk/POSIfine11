import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Activity, Users, MessageSquare, ClipboardList, Send } from 'lucide-react';
import api from '../../../services/api';

export default function ClinicDoctorDashboard() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    loadMessages();
    loadPatients();
  }, []);

  const loadMessages = async () => {
    try {
      const response = await api.get('/messages/inbox');
      setMessages(response.messages || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadPatients = async () => {
    // TODO: Load patients from API
    setPatients([
      { id: 1, name: 'Patient A', status: 'Waiting', room: '101' },
      { id: 2, name: 'Patient B', status: 'In Progress', room: '102' },
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">👨‍⚕️ Doctor Dashboard</h1>
              <p className="text-blue-100 mt-1">Welcome, Dr. {user?.name}</p>
            </div>
            <button
              onClick={() => setShowSendMessage(true)}
              className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100"
            >
              <Send className="w-5 h-5 mr-2" />
              Send Message
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Patients Today</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{patients.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread Messages</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{unreadCount}</p>
              </div>
              <MessageSquare className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Prescriptions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
              </div>
              <ClipboardList className="w-10 h-10 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <MessageSquare className="w-6 h-6 mr-2 text-blue-600" />
            Messages
          </h2>
          {messages.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No messages</p>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{msg.fromUserName}</span>
                      <span className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{msg.content}</p>
                    <div className="flex items-center mt-2">
                      <span className="text-xs text-blue-600">From: {msg.fromRole}</span>
                      {msg.status === 'sent' && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">New</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Patients Queue */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Activity className="w-6 h-6 mr-2 text-blue-600" />
            Patient Queue
          </h2>
          {patients.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No patients in queue</p>
          ) : (
            <div className="space-y-3">
              {patients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{patient.name}</p>
                    <p className="text-sm text-gray-600">Room: {patient.room}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      patient.status === 'Waiting' ? 'bg-yellow-100 text-yellow-800' :
                      patient.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {patient.status}
                    </span>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Send Message Modal */}
      {showSendMessage && (
        <SendMessageModal onClose={() => setShowSendMessage(false)} />
      )}
    </div>
  );
}

// Send Message Modal
function SendMessageModal({ onClose }) {
  const [availableRoles, setAvailableRoles] = useState([]);
  const [formData, setFormData] = useState({
    toRole: '',
    content: '',
    priority: 'normal'
  });

  useEffect(() => {
    loadAvailableRoles();
  }, []);

  const loadAvailableRoles = async () => {
    try {
      const response = await api.get('/messages/available-roles');
      setAvailableRoles(response.roles || []);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/messages/send', formData);
      alert('Message sent!');
      onClose();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Send Message</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To (Role)</label>
            <select
              value={formData.toRole}
              onChange={(e) => setFormData({ ...formData, toRole: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select role...</option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Type your message..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
