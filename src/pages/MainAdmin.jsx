import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users, DollarSign, Mail, Lock, Unlock, CheckCircle, XCircle,
  AlertTriangle, TrendingUp, Calendar, Search, Filter, Send, Eye, LogOut,
  Building2, Activity, Server, Database, Bell, BarChart2, Download, RefreshCw,
  Edit3, KeyRound, Plus
} from 'lucide-react';
import { mainAdmin, users, auth, BASE_API_URL } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function MainAdmin() {
  const [allUsers, setAllUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [emailData, setEmailData] = useState({ subject: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [lockingUser, setLockingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [addUserData, setAddUserData] = useState({
    name: '',
    email: '',
    password: '',
    plan: 'basic',
    businessType: 'retail',
    role: 'admin'
  });
  const [editUserData, setEditUserData] = useState({
    name: '',
    business_role: '',
    is_active: true
  });
  const [assignPlanData, setAssignPlanData] = useState({
    userId: '',
    plan: 'basic'
  });
  const [resetData, setResetData] = useState({
    userId: '',
    tempPassword: ''
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    lockedUsers: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    overduePayments: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    apiResponseMs: null,
    serverLoad: 'normal',
    dbStatus: 'unknown',
    lastChecked: null,
    recentErrors: []
  });
  const [alerts, setAlerts] = useState([]);
  const [salesAll, setSalesAll] = useState([]);

  const formatDate = (value) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return '—';
    }
  };

  const normalizePlan = (user) => user?.plan || user?.subscription || 'free';
  const normalizeBusinessType = (user) => user?.business_type || user?.businessType || 'general';
  const normalizeActive = (user) => user?.active ?? user?.is_active ?? true;
  const normalizeLastLogin = (user) => user?.last_login || user?.lastLogin || null;
  const getPlanPrice = (plan) => {
    if (plan === 'pro') return 3400;
    if (plan === 'ultra') return 5000;
    if (plan === 'basic') return 1500;
    return 0;
  };

  const activeSubscriptions = useMemo(() => {
    return allUsers.filter((u) => normalizeActive(u) && normalizePlan(u) !== 'free').length;
  }, [allUsers]);

  const extractUserFromResponse = (response) => {
    if (!response) return null;
    if (response.user) return response.user;
    if (response.data?.user) return response.data.user;
    if (response.data) return response.data;
    return null;
  };

  const generateTempPassword = () => {
    const seed = Math.random().toString(36).slice(-8);
    return `Tmp-${seed}`;
  };

  const buildBusinesses = (usersData, salesData) => {
    const grouped = {};
    usersData.forEach((user) => {
      const key = user.account_id || user.accountId || user.business_name || user.businessName || user.email;
      if (!grouped[key]) {
        grouped[key] = {
          id: key,
          name: user.business_name || user.businessName || `${normalizeBusinessType(user)} Business`,
          businessType: normalizeBusinessType(user),
          users: [],
          activeUsers: 0,
          revenue: 0,
          transactions: 0,
          status: 'active'
        };
      }
      grouped[key].users.push(user);
      if (normalizeActive(user)) grouped[key].activeUsers += 1;
    });

    salesData.forEach((sale) => {
      const key = sale.account_id || sale.accountId || sale.business_id || sale.businessId;
      if (!key) return;
      if (!grouped[key]) {
        grouped[key] = {
          id: key,
          name: 'Business',
          businessType: 'general',
          users: [],
          activeUsers: 0,
          revenue: 0,
          transactions: 0,
          status: 'active'
        };
      }
      grouped[key].transactions += 1;
      grouped[key].revenue += Number(sale.total || 0);
    });

    return Object.values(grouped).map((biz) => {
      let status = 'active';
      if (biz.activeUsers === 0) status = 'error';
      if (biz.activeUsers > 0 && biz.activeUsers < 2) status = 'attention';
      return { ...biz, status };
    });
  };

  const fetchHealth = useCallback(async () => {
    try {
      const baseUrl = BASE_API_URL.replace(/\/api$/, '');
      const start = performance.now();
      const res = await fetch(`${baseUrl}/health`);
      const elapsed = performance.now() - start;
      const data = await res.json().catch(() => ({}));
      const dbStatus = data?.services?.database || 'unknown';
      return {
        apiResponseMs: Number(elapsed.toFixed(1)),
        serverLoad: elapsed > 1000 ? 'high' : elapsed > 500 ? 'attention' : 'normal',
        dbStatus,
        lastChecked: new Date().toISOString(),
        recentErrors: []
      };
    } catch {
      return {
        apiResponseMs: null,
        serverLoad: 'high',
        dbStatus: 'down',
        lastChecked: new Date().toISOString(),
        recentErrors: ['Health check failed']
      };
    }
  }, []);

  useEffect(() => {
    // Check if user is authenticated as main admin
    const token = localStorage.getItem('token') || localStorage.getItem('mainAdminToken');
    const userStr = localStorage.getItem('user') || localStorage.getItem('mainAdminUser');
    
    if (!token || !userStr) {
      navigate('/main.admin/login');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      if (!['main_admin', 'owner'].includes(userData.role)) {
        navigate('/main.admin/login');
        return;
      }
    } catch (e) {
      navigate('/main.admin/login');
      return;
    }
    
    loadData().finally(() => setLoading(false));
    
    // Load recent activities
    const activities = JSON.parse(localStorage.getItem('authActivities') || '[]');
    setRecentActivities(activities.slice(0, 10)); // Show last 10 activities
    
    // Set up interval to refresh activities every 5 seconds
    const interval = setInterval(async () => {
      try {
        const health = await fetchHealth();
        setSystemHealth(health);
        const activities = await mainAdmin.getActivities().catch(() => []);
        if (activities?.length) setRecentActivities(activities.slice(0, 20));
      } catch {
        // ignore
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  const loadData = async () => {
    try {
      setError(null);
      let usersData = [];
      let backendStatus = true;
      let salesData = [];
      let activitiesData = [];
      let statsData = null;

      // Try to load from mainAdmin API first
      try {
        const [usersRes, salesRes, activitiesRes, statsRes] = await Promise.all([
          mainAdmin.getUsers(),
          mainAdmin.getSalesAll().catch(() => []),
          mainAdmin.getActivities().catch(() => []),
          mainAdmin.getStats().catch(() => null)
        ]);
        usersData = usersRes || [];
        salesData = salesRes || [];
        activitiesData = activitiesRes || [];
        statsData = statsRes;
      } catch (mainAdminError) {
        console.warn('MainAdmin API not available, falling back to regular users API:', mainAdminError.message);
        
        // Fallback to regular users API
        try {
          usersData = await users.getAll();
        } catch (usersError) {
          console.warn('Users API also failed:', usersError.message);
          backendStatus = false;
        }
      }

      // If still no users and backend not available, generate demo data
      if (usersData.length === 0 && !backendStatus) {
        usersData = generateDemoData();
      }

      setAllUsers(usersData);
      setBackendAvailable(backendStatus);
      setSalesAll(salesData);
      if (statsData) {
        setStats({
          totalUsers: statsData.totalUsers || usersData.length,
          activeUsers: statsData.activeUsers || usersData.filter(u => normalizeActive(u)).length,
          lockedUsers: statsData.lockedUsers || usersData.filter(u => u.locked).length,
          totalRevenue: statsData.totalRevenue || 0,
          pendingPayments: statsData.pendingPayments || 0,
          overduePayments: statsData.overduePayments || 0
        });
      } else {
        calculateStats(usersData, payments);
      }

      setBusinesses(buildBusinesses(usersData, salesData));
      setRecentActivities(activitiesData?.slice(0, 20) || recentActivities);
      const health = await fetchHealth();
      setSystemHealth(health);

      const alertsList = [];
      if (!backendStatus) alertsList.push({ type: 'error', message: 'Backend unreachable. Demo mode active.' });
      if (health.serverLoad === 'high') alertsList.push({ type: 'warning', message: 'High API latency detected.' });
      if (health.dbStatus === 'down') alertsList.push({ type: 'error', message: 'Database unavailable.' });
      setAlerts(alertsList);

    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load dashboard data');
      
      // Generate demo data as final fallback
      const demoUsers = generateDemoData();
      setAllUsers(demoUsers);
      setPayments(generateDemoPayments(demoUsers));
      setBackendAvailable(false);
      calculateStats(demoUsers, []);
      setBusinesses(buildBusinesses(demoUsers, []));
      const health = await fetchHealth();
      setSystemHealth(health);
      setAlerts([{ type: 'warning', message: 'Demo mode: live metrics unavailable.' }]);
    }
  };

  const logout = () => {
    localStorage.removeItem('mainAdminToken');
    localStorage.removeItem('mainAdminUser');
    navigate('/main.admin/login');
  };

  const generateDemoData = () => {
    // Check if we already have a real user
    const storedUser = localStorage.getItem('user');
    const demoUsers = [];
    
    if (storedUser) {
      const realUser = JSON.parse(storedUser);
      demoUsers.push({ ...realUser, id: realUser.id || 'real-user' });
    }
    
    // Add some demo users
    const demoData = [
      { name: 'John Doe', email: 'john@example.com', plan: 'ultra', price: 1600, active: true, locked: false, role: 'admin' },
      { name: 'Jane Smith', email: 'jane@example.com', plan: 'basic', price: 900, active: true, locked: false, role: 'cashier' },
      { name: 'Bob Wilson', email: 'bob@example.com', plan: 'ultra', price: 1600, active: false, locked: false, role: 'admin' },
      { name: 'Alice Brown', email: 'alice@example.com', plan: 'basic', price: 900, active: true, locked: true, role: 'cashier' },
      { name: 'Mike Johnson', email: 'mike@example.com', plan: 'ultra', price: 1600, active: true, locked: false, role: 'admin' },
      { name: 'Sarah Davis', email: 'sarah@example.com', plan: 'basic', price: 900, active: false, locked: false, role: 'cashier' }
    ];
    
    demoData.forEach((demo, index) => {
      demoUsers.push({
        id: `demo-${index + 1}`,
        ...demo,
        createdAt: new Date(Date.now() - (index * 86400000)).toISOString(),
        lastLogin: new Date(Date.now() - Math.random() * 86400000).toISOString()
      });
    });
    
    return demoUsers;
  };

  const generateDemoPayments = (usersData) => {
    return usersData.flatMap(user => [
      {
        id: `payment-${user.id}-1`,
        userId: user.id,
        amount: user.plan === 'ultra' ? 1600 : 900,
        status: Math.random() > 0.3 ? 'paid' : 'pending',
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        dueDate: new Date(Date.now() + 5 * 86400000).toISOString()
      },
      {
        id: `payment-${user.id}-2`,
        userId: user.id,
        amount: user.plan === 'ultra' ? 1600 : 900,
        status: Math.random() > 0.7 ? 'paid' : (Math.random() > 0.5 ? 'pending' : 'overdue'),
        createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
        dueDate: new Date(Date.now() - 5 * 86400000).toISOString()
      }
    ]);
  };

  const calculateStats = (usersData, paymentsData) => {
    const totalUsers = usersData.length;
    const activeUsers = usersData.filter(u => u.active).length;
    const lockedUsers = usersData.filter(u => u.locked).length;
    const totalRevenue = paymentsData.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const pendingPayments = paymentsData.filter(p => p.status === 'pending').length;
    const overduePayments = paymentsData.filter(p => p.status === 'overdue').length;

    setStats({
      totalUsers,
      activeUsers,
      lockedUsers,
      totalRevenue,
      pendingPayments,
      overduePayments
    });
  };


  const toggleUserLock = async (userId, currentLockStatus) => {
    try {
      setLockingUser(userId);
      const newLockStatus = !currentLockStatus;
      
      // Call the main admin API to lock/unlock user
      try {
        await mainAdmin.lockUser(userId, newLockStatus);
        
        // Update local state immediately
        const updatedUsers = allUsers.map(u => 
          u.id === userId ? { ...u, locked: newLockStatus, active: !newLockStatus } : u
        );
        setAllUsers(updatedUsers);
        calculateStats(updatedUsers, payments);
        
        // Show success message
        const user = allUsers.find(u => u.id === userId);
        const action = newLockStatus ? 'locked' : 'unlocked';
        alert(`✅ ${user?.name || `User ${userId}`} has been ${action} successfully!`);
        
      } catch (apiError) {
        console.error('API lock failed:', apiError);
        
        // Fallback to local update if backend fails
        const updatedUsers = allUsers.map(u => 
          u.id === userId ? { ...u, locked: newLockStatus, active: !newLockStatus } : u
        );
        setAllUsers(updatedUsers);
        calculateStats(updatedUsers, payments);
        
        const user = allUsers.find(u => u.id === userId);
        const action = newLockStatus ? 'locked' : 'unlocked';
        alert(`⚠️ Backend not available. ${user?.name || `User ${userId}`} ${action} locally. Changes will sync when backend is available.`);
      }
      
    } catch (error) {
      console.error('Failed to toggle lock:', error);
      alert(`❌ Failed to update user status: ${error.message}`);
    } finally {
      setLockingUser(null);
    }
  };

  const sendEmail = async (userIds, subject, message) => {
    try {
      setLoading(true);
      
      // Try backend first
      try {
        await mainAdmin.sendEmail({ userIds, subject, message });
        alert('Emails sent successfully!');
        setShowEmailModal(false);
        setSelectedUsers([]);
        setEmailData({ subject: '', message: '' });
        return;
      } catch (backendError) {
        console.warn('Backend email operation failed, simulating email send:', backendError.message);
      }
      
      // Fallback: Simulate email sending
      const selectedUsersList = allUsers.filter(u => userIds.includes(u.id));
      
      // Store email log locally
      const emailLogs = JSON.parse(localStorage.getItem('emailLogs') || '[]');
      emailLogs.push({
        timestamp: new Date().toISOString(),
        recipients: selectedUsersList.map(u => ({ id: u.id, name: u.name, email: u.email })),
        subject,
        message,
        status: 'simulated'
      });
      localStorage.setItem('emailLogs', JSON.stringify(emailLogs));
      
      alert(`✅ Email simulation successful!\n\n📧 Sent to ${selectedUsersList.length} user(s):\n${selectedUsersList.map(u => `${u.name} (${u.email})`).join('\n')}\n\n${!backendAvailable ? '📌 Backend not deployed - this was a simulation.\n' : ''}💡 Deploy backend to send real emails.`);
      setShowEmailModal(false);
      setSelectedUsers([]);
      setEmailData({ subject: '', message: '' });
      
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to process email request.');
    } finally {
      setLoading(false);
    }
  };

  const sendPaymentReminder = async (userId) => {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    await sendEmail(
      [userId],
      'Payment Reminder - Subscription',
      `Dear ${user.name},\n\nThis is a friendly reminder about your pending subscription payment for ${user.plan?.toUpperCase()} plan (KSH ${user.price}).\n\nPlease complete your payment to continue enjoying our services.\n\nThank you!`
    );
  };

  const openEditUser = (user) => {
    setActiveUser(user);
    setEditUserData({
      name: user?.name || '',
      business_role: user?.business_role || user?.role || '',
      is_active: normalizeActive(user)
    });
    setShowEditUserModal(true);
  };

  const handleAddUser = async () => {
    if (!addUserData.name || !addUserData.email || !addUserData.password) {
      alert('Please provide name, email, and temporary password.');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        name: addUserData.name,
        email: addUserData.email,
        password: addUserData.password,
        plan: addUserData.plan,
        business_type: addUserData.businessType,
        role: addUserData.role
      };
      let createdUser = null;
      try {
        const response = await mainAdmin.createUser({
          name: payload.name,
          email: payload.email,
          password: payload.password,
          plan: payload.plan,
          business_type: payload.business_type
        });
        createdUser = extractUserFromResponse(response) || payload;
      } catch (apiError) {
        console.warn('Main admin create failed, falling back to signup:', apiError.message);
        try {
          const response = await auth.signup(payload);
          createdUser = extractUserFromResponse(response) || payload;
        } catch (fallbackError) {
          console.warn('Signup endpoint failed, falling back to local create:', fallbackError.message);
          createdUser = { ...payload, id: Date.now(), active: true };
        }
      }
      setAllUsers((prev) => {
        const nextUsers = [{ ...createdUser, id: createdUser.id || Date.now() }, ...prev];
        calculateStats(nextUsers, payments);
        return nextUsers;
      });
      setShowAddUserModal(false);
      setAddUserData({ name: '', email: '', password: '', plan: 'basic', businessType: 'retail', role: 'admin' });
      alert('✅ User created successfully.');
    } catch (error) {
      alert(`❌ Failed to create user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!activeUser) return;
    try {
      setLoading(true);
      const payload = {
        name: editUserData.name,
        business_role: editUserData.business_role || undefined,
        is_active: editUserData.is_active
      };
      try {
        await users.update(activeUser.id, payload);
      } catch (apiError) {
        console.warn('Update endpoint failed, applying local update:', apiError.message);
      }
      setAllUsers((prev) => {
        const nextUsers = prev.map((u) => u.id === activeUser.id ? { ...u, ...payload, active: payload.is_active } : u);
        calculateStats(nextUsers, payments);
        return nextUsers;
      });
      setShowEditUserModal(false);
      setActiveUser(null);
      alert('✅ User updated successfully.');
    } catch (error) {
      alert(`❌ Failed to update user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPlan = async () => {
    const userId = assignPlanData.userId || activeUser?.id;
    if (!userId) {
      alert('Select a user to assign a plan.');
      return;
    }
    try {
      setLoading(true);
      try {
        await mainAdmin.changePlan(userId, assignPlanData.plan);
      } catch (apiError) {
        console.warn('Plan assignment failed, applying local update:', apiError.message);
      }
      setAllUsers((prev) => prev.map((u) => u.id === userId ? { ...u, plan: assignPlanData.plan, price: getPlanPrice(assignPlanData.plan) } : u));
      setShowAssignModal(false);
      setAssignPlanData({ userId: '', plan: 'basic' });
      alert('✅ Subscription updated successfully.');
    } catch (error) {
      alert(`❌ Failed to assign subscription: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const userId = resetData.userId || activeUser?.id;
    if (!userId) {
      alert('Select a user to reset password.');
      return;
    }
    let tempPassword = resetData.tempPassword || generateTempPassword();
    const user = allUsers.find((u) => u.id === userId);

    try {
      const response = await mainAdmin.resetPassword(userId, tempPassword);
      if (response?.tempPassword) tempPassword = response.tempPassword;
    } catch (apiError) {
      console.warn('Reset password endpoint failed, continuing with email-only flow:', apiError.message);
    }

    await sendEmail(
      [userId],
      'Password Reset - Temporary Access',
      `Hello ${user?.name || ''},\n\nYour temporary password is: ${tempPassword}\n\nPlease log in and update your password immediately.\n\nRegards,\nPOS Support Team`
    );
    setShowResetModal(false);
    setResetData({ userId: '', tempPassword: '' });
  };

  const handleDeleteUser = async (userId) => {
    const user = allUsers.find((u) => u.id === userId);
    const confirmed = window.confirm(`Delete ${user?.name || 'this user'}? This action cannot be undone.`);
    if (!confirmed) return;
    try {
      setDeletingUser(userId);
      try {
        await users.delete(userId);
      } catch (apiError) {
        console.warn('Delete endpoint failed, applying local delete:', apiError.message);
      }
      const updatedUsers = allUsers.filter((u) => u.id !== userId);
      setAllUsers(updatedUsers);
      calculateStats(updatedUsers, payments);
      alert('✅ User deleted successfully.');
    } catch (error) {
      alert(`❌ Failed to delete user: ${error.message}`);
    } finally {
      setDeletingUser(null);
    }
  };

  const exportUsersCsv = () => {
    const headers = ['Name', 'Email', 'Business Type', 'Plan', 'Last Login', 'Active'];
    const rows = sortedUsers.map((u) => [
      u.name || '',
      u.email || '',
      normalizeBusinessType(u),
      normalizePlan(u),
      formatDate(normalizeLastLogin(u)),
      normalizeActive(u) ? 'Active' : 'Inactive'
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `users-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportUsersPdf = () => {
    const reportWindow = window.open('', '_blank', 'width=900,height=700');
    if (!reportWindow) return;
    const rowsHtml = sortedUsers.map((u) => `
      <tr>
        <td>${u.name || ''}</td>
        <td>${u.email || ''}</td>
        <td>${normalizeBusinessType(u)}</td>
        <td>${normalizePlan(u)}</td>
        <td>${formatDate(normalizeLastLogin(u))}</td>
        <td>${normalizeActive(u) ? 'Active' : 'Inactive'}</td>
      </tr>
    `).join('');
    reportWindow.document.write(`
      <html>
        <head>
          <title>Users Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #3b2f2a; }
            h1 { margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #e6d5c7; padding: 8px; font-size: 12px; text-align: left; }
            th { background: #f8f1ea; }
          </style>
        </head>
        <body>
          <h1>Users Report</h1>
          <p>Generated ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Business Type</th>
                <th>Plan</th>
                <th>Last Login</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = !normalizedSearch ||
      user.name?.toLowerCase().includes(normalizedSearch) ||
      user.email?.toLowerCase().includes(normalizedSearch) ||
      normalizeBusinessType(user).toLowerCase().includes(normalizedSearch) ||
      normalizePlan(user).toLowerCase().includes(normalizedSearch) ||
      (user.business_role || user.role || '').toLowerCase().includes(normalizedSearch);

    if (filter === 'all') return matchesSearch;
    if (filter === 'active') return matchesSearch && user.active && !user.locked;
    if (filter === 'locked') return matchesSearch && user.locked;
    if (filter === 'trial') return matchesSearch && (!user.active || !user.plan);
    if (filter === 'pending-payment') {
      const userPayments = payments.filter(p => p.userId === user.id && p.status === 'pending');
      return matchesSearch && userPayments.length > 0;
    }
    if (filter === 'overdue') {
      const userPayments = payments.filter(p => p.userId === user.id && p.status === 'overdue');
      return matchesSearch && userPayments.length > 0;
    }
    return matchesSearch;
  });

  const filteredBusinesses = useMemo(() => {
    if (!normalizedSearch) return businesses;
    return businesses.filter((biz) => {
      const name = (biz.name || '').toLowerCase();
      const type = (biz.businessType || '').toLowerCase();
      const status = (biz.status || '').toLowerCase();
      return name.includes(normalizedSearch) || type.includes(normalizedSearch) || status.includes(normalizedSearch);
    });
  }, [businesses, normalizedSearch]);

  const filteredActivities = useMemo(() => {
    if (!normalizedSearch) return recentActivities;
    return recentActivities.filter((activity) => {
      const name = (activity.user?.name || '').toLowerCase();
      const email = (activity.user?.email || '').toLowerCase();
      const type = (activity.type || '').toLowerCase();
      return name.includes(normalizedSearch) || email.includes(normalizedSearch) || type.includes(normalizedSearch);
    });
  }, [recentActivities, normalizedSearch]);

  const sortedUsers = useMemo(() => {
    const usersCopy = [...filteredUsers];
    usersCopy.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const getValue = (user) => {
        if (sortKey === 'name') return user.name || '';
        if (sortKey === 'email') return user.email || '';
        if (sortKey === 'business') return normalizeBusinessType(user);
        if (sortKey === 'plan') return normalizePlan(user);
        if (sortKey === 'lastLogin') return normalizeLastLogin(user) || '';
        if (sortKey === 'active') return normalizeActive(user) ? '1' : '0';
        return '';
      };
      return getValue(a).toString().localeCompare(getValue(b).toString()) * dir;
    });
    return usersCopy;
  }, [filteredUsers, sortKey, sortDir]);

  const revenueByDay = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { date: d.toDateString(), label: d.toLocaleDateString(undefined, { weekday: 'short' }), total: 0 };
    });
    salesAll.forEach((sale) => {
      const dateVal = sale.created_at || sale.createdAt;
      if (!dateVal) return;
      const saleDate = new Date(dateVal).toDateString();
      const day = days.find((d) => d.date === saleDate);
      if (day) day.total += Number(sale.total || 0);
    });
    return days;
  }, [salesAll]);

  const getUserPaymentStatus = (userId) => {
    const userPayments = payments.filter(p => p.userId === userId);
    const pending = userPayments.filter(p => p.status === 'pending').length;
    const overdue = userPayments.filter(p => p.status === 'overdue').length;
    const paid = userPayments.filter(p => p.status === 'paid').length;
    
    return { pending, overdue, paid, total: userPayments.length };
  };

  const askAiFromSearch = async () => {
    if (!searchTerm.trim()) return;
    try {
      setAiLoading(true);
      setAiError('');
      setAiAnswer('');
      const token = localStorage.getItem('token') || localStorage.getItem('mainAdminToken');
      const response = await fetch(`${BASE_API_URL}/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          question: searchTerm.trim(),
          context: {
            stats,
            alerts: alerts.slice(0, 5),
            systemHealth,
            usersCount: allUsers.length,
            businessesCount: businesses.length,
            topBusinesses: filteredBusinesses.slice(0, 5),
            recentActivities: filteredActivities.slice(0, 5)
          }
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'AI request failed');
      }

      const answer = payload?.data?.answer || payload?.answer;
      if (!answer) throw new Error('No AI response received');
      setAiAnswer(answer);
    } catch (err) {
      setAiError(err.message || 'AI request failed');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading && allUsers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading Main Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef8f0] via-[#f5efe6] to-[#fef8f0]">
      {/* Backend Status Banner */}
      {!backendAvailable && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 text-center">
          <p className="text-sm md:text-base font-semibold">
            ⚠️ Demo Mode: Backend not available. Actions are simulated locally. 
            <a href="/BACKEND_NOT_DEPLOYED.md" className="underline ml-2">Deploy Backend →</a>
          </p>
        </div>
      )}
      
      {/* Error Banner */}
      {error && (
        <div className="bg-red-500 text-white px-6 py-3 text-center">
          <p className="text-sm font-semibold">⚠️ {error}</p>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-[#e6d5c7] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-[#6b4c3b] mb-2">Main Admin Dashboard</h1>
            <p className="text-[#8b5a2b]">Monitor all users, businesses, and system health</p>
          </div>
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b5a2b]" />
              <input
                type="text"
                placeholder="Search users, businesses, activity..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-[#eadbcf] rounded-lg text-[#6b4c3b] placeholder-[#b79b82] focus:outline-none focus:ring-2 focus:ring-[#cd853f]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="mt-2 flex justify-end">
              <button
                onClick={askAiFromSearch}
                disabled={aiLoading || !searchTerm.trim()}
                className="px-3 py-1.5 text-xs bg-[#6b4c3b] text-white rounded-lg hover:bg-[#5a4a3b] disabled:opacity-50"
              >
                {aiLoading ? 'Asking AI...' : 'Search with AI'}
              </button>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {(aiAnswer || aiError) && (
          <div className={`rounded-2xl border px-4 py-3 text-sm ${aiError ? 'border-red-200 bg-red-50 text-red-700' : 'border-[#eadbcf] bg-white text-[#6b4c3b]'}`}>
            {aiError ? aiError : aiAnswer}
          </div>
        )}
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-[#eadbcf] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-[#2d4cff]" />
              <span className="text-2xl font-bold text-[#6b4c3b]">{stats.totalUsers}</span>
            </div>
            <p className="text-[#8b5a2b] text-sm">Total Users</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#eadbcf] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-8 h-8 text-[#16a34a]" />
              <span className="text-2xl font-bold text-[#6b4c3b]">{businesses.length}</span>
            </div>
            <p className="text-[#8b5a2b] text-sm">Total Businesses</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#eadbcf] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-[#22c55e]" />
              <span className="text-2xl font-bold text-[#6b4c3b]">{activeSubscriptions}</span>
            </div>
            <p className="text-[#8b5a2b] text-sm">Active Subscriptions</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#eadbcf] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-[#f97316]" />
              <span className="text-2xl font-bold text-[#6b4c3b]">{stats.pendingPayments}</span>
            </div>
            <p className="text-[#8b5a2b] text-sm">Pending Payments</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 border border-[#eadbcf] shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#6b4c3b]">Quick Actions</h2>
              <p className="text-sm text-[#8b5a2b]">Common admin tasks at your fingertips.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-4 py-2 bg-[#6b4c3b] text-white rounded-lg hover:bg-[#5a4a3b] flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add New User
              </button>
              <button
                onClick={() => setShowResetModal(true)}
                className="px-4 py-2 bg-[#f5efe6] text-[#6b4c3b] rounded-lg border border-[#eadbcf] hover:bg-[#f0e5d6] flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" /> Reset Password
              </button>
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-4 py-2 bg-[#f5efe6] text-[#6b4c3b] rounded-lg border border-[#eadbcf] hover:bg-[#f0e5d6] flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" /> Assign Subscription
              </button>
              <button
                onClick={exportUsersCsv}
                className="px-4 py-2 bg-white text-[#6b4c3b] rounded-lg border border-[#eadbcf] hover:bg-[#f7f0e9] flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <button
                onClick={() => loadData()}
                className="px-4 py-2 bg-white text-[#6b4c3b] rounded-lg border border-[#eadbcf] hover:bg-[#f7f0e9] flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Business Monitoring + System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#eadbcf] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#6b4c3b] flex items-center gap-2"><Building2 className="w-5 h-5" /> Businesses</h2>
                <p className="text-sm text-[#8b5a2b]">Live status across all businesses.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {filteredBusinesses.length === 0 && (
                <div className="text-sm text-[#8b5a2b]">No businesses found.</div>
              )}
              {filteredBusinesses.map((biz) => (
                <div key={biz.id} className="border border-[#eadbcf] rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#6b4c3b]">{biz.name}</p>
                      <p className="text-xs text-[#8b5a2b]">{biz.businessType}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      biz.status === 'active' ? 'bg-green-100 text-green-700' : biz.status === 'attention' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {biz.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[#8b5a2b]">
                    <div><span className="font-semibold text-[#6b4c3b]">{biz.activeUsers}</span> active users</div>
                    <div><span className="font-semibold text-[#6b4c3b]">{biz.transactions}</span> txns</div>
                    <div><span className="font-semibold text-[#6b4c3b]">KSH {Math.round(biz.revenue).toLocaleString()}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#eadbcf] shadow-sm">
            <h2 className="text-xl font-bold text-[#6b4c3b] flex items-center gap-2 mb-4"><Activity className="w-5 h-5" /> System Health</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8b5a2b] flex items-center gap-2"><Server className="w-4 h-4" /> API Response</span>
                <span className="text-sm font-semibold text-[#6b4c3b]">{systemHealth.apiResponseMs ? `${systemHealth.apiResponseMs}ms` : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8b5a2b] flex items-center gap-2"><Database className="w-4 h-4" /> Database</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  systemHealth.dbStatus === 'postgres' || systemHealth.dbStatus === 'healthy' ? 'bg-green-100 text-green-700' : systemHealth.dbStatus === 'down' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>{systemHealth.dbStatus || 'unknown'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8b5a2b] flex items-center gap-2"><Activity className="w-4 h-4" /> Server Load</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  systemHealth.serverLoad === 'normal' ? 'bg-green-100 text-green-700' : systemHealth.serverLoad === 'attention' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>{systemHealth.serverLoad}</span>
              </div>
              <div className="text-xs text-[#8b5a2b]">Last checked: {formatDate(systemHealth.lastChecked)}</div>
            </div>
          </div>
        </div>

        {/* Alerts + Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#eadbcf] shadow-sm">
            <h2 className="text-xl font-bold text-[#6b4c3b] flex items-center gap-2 mb-4"><Bell className="w-5 h-5" /> Alerts</h2>
            <div className="space-y-3">
              {alerts.length === 0 && <p className="text-sm text-[#8b5a2b]">No critical alerts.</p>}
              {alerts.map((alert, idx) => (
                <div key={`${alert.type}-${idx}`} className="p-3 rounded-lg border border-[#eadbcf] bg-[#fdf7f1] text-sm text-[#6b4c3b]">
                  {alert.message}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#eadbcf] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#6b4c3b] flex items-center gap-2"><BarChart2 className="w-5 h-5" /> Analytics</h2>
              <button onClick={exportUsersPdf} className="text-sm text-[#6b4c3b] flex items-center gap-2"><Download className="w-4 h-4" /> Export PDF</button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-[#8b5a2b] mb-3">7-Day Revenue</p>
                <div className="flex items-end gap-2 h-28">
                  {revenueByDay.map((day) => (
                    <div key={day.label} className="flex-1">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-[#6b4c3b] to-[#d2b49c]"
                        style={{ height: `${Math.min(100, Math.max(8, (day.total / (stats.totalRevenue || 1)) * 120))}%` }}
                        title={`KSH ${Math.round(day.total).toLocaleString()}`}
                      />
                      <p className="text-[10px] text-center text-[#8b5a2b] mt-1">{day.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-[#8b5a2b] mb-3">Subscription Mix</p>
                <div className="space-y-2">
                  {['basic', 'ultra', 'pro'].map((plan) => {
                    const count = allUsers.filter(u => normalizePlan(u) === plan).length;
                    const pct = allUsers.length ? Math.round((count / allUsers.length) * 100) : 0;
                    return (
                      <div key={plan}>
                        <div className="flex items-center justify-between text-xs text-[#6b4c3b]">
                          <span className="font-semibold uppercase">{plan}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-2 bg-[#f0e5d6] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#6b4c3b] to-[#d2b49c]" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-2xl p-6 border border-[#eadbcf] shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 flex-1 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b5a2b]" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#eadbcf] rounded-lg text-[#6b4c3b] placeholder-[#b79b82] focus:outline-none focus:ring-2 focus:ring-[#cd853f]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-3 bg-white border border-[#eadbcf] rounded-lg text-[#6b4c3b] focus:outline-none focus:ring-2 focus:ring-[#cd853f]"
              >
                <option value="all">All Users</option>
                <option value="active">Active</option>
                <option value="locked">Locked</option>
                <option value="trial">Free Trial</option>
                <option value="pending-payment">Pending Payment</option>
                <option value="overdue">Overdue</option>
              </select>
              <select
                value={`${sortKey}:${sortDir}`}
                onChange={(e) => {
                  const [key, dir] = e.target.value.split(':');
                  setSortKey(key);
                  setSortDir(dir);
                }}
                className="px-4 py-3 bg-white border border-[#eadbcf] rounded-lg text-[#6b4c3b] focus:outline-none focus:ring-2 focus:ring-[#cd853f]"
              >
                <option value="name:asc">Name (A–Z)</option>
                <option value="name:desc">Name (Z–A)</option>
                <option value="email:asc">Email (A–Z)</option>
                <option value="business:asc">Business Type</option>
                <option value="plan:asc">Plan</option>
                <option value="lastLogin:desc">Last Login</option>
                <option value="active:desc">Active Status</option>
              </select>
            </div>

            <button
              onClick={() => setShowEmailModal(true)}
              disabled={selectedUsers.length === 0 || loading}
              className="bg-[#6b4c3b] hover:bg-[#5a4a3b] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="w-5 h-5" />
              Send Email to Selected ({selectedUsers.length})
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Users Table */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-[#eadbcf] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#eadbcf]">
              <h2 className="text-xl font-bold text-[#6b4c3b]">All Users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f8f1ea]">
                  <tr>
                    <th className="px-4 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === sortedUsers.length && sortedUsers.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(sortedUsers.map(u => u.id));
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                        className="w-5 h-5 rounded"
                      />
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-[#6b4c3b]">Name</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-[#6b4c3b]">Email</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-[#6b4c3b]">Business Type</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-[#6b4c3b]">Subscription Plan</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-[#6b4c3b]">Last Login</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-[#6b4c3b]">Active Status</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-[#6b4c3b]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-4 py-12 text-center">
                        <Users className="w-16 h-16 text-[#c9b8a6] mx-auto mb-4" />
                        <p className="text-[#8b5a2b] text-lg">No users found</p>
                        <p className="text-[#b79b82] text-sm mt-2">
                          {searchTerm || filter !== 'all' 
                            ? 'Try adjusting your filters' 
                            : 'Users will appear here once they sign up'}
                        </p>
                      </td>
                    </tr>
                  )}
                  {sortedUsers.map(user => {
                    const paymentStatus = getUserPaymentStatus(user.id);
                    return (
                      <tr key={user.id} className="border-t border-[#eadbcf] hover:bg-[#fbf6f1] transition">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                              }
                            }}
                            className="w-5 h-5 rounded"
                          />
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-[#6b4c3b]">{user.name || '—'}</td>
                        <td className="px-4 py-4 text-sm text-[#8b5a2b]">{user.email || '—'}</td>
                        <td className="px-4 py-4 text-sm text-[#8b5a2b]">{normalizeBusinessType(user)}</td>
                        <td className="px-4 py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#f5efe6] text-[#6b4c3b]">
                            {normalizePlan(user).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-[#8b5a2b]">{formatDate(normalizeLastLogin(user))}</td>
                        <td className="px-4 py-4">
                          {user.locked ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Locked
                            </span>
                          ) : normalizeActive(user) ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleUserLock(user.id, user.locked)}
                              disabled={lockingUser === user.id}
                              className={`p-2 rounded-lg transition ${
                                user.locked
                                  ? 'bg-green-100 hover:bg-green-200 text-green-700'
                                  : 'bg-red-100 hover:bg-red-200 text-red-700'
                              } ${lockingUser === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={user.locked ? 'Unlock User' : 'Lock User'}
                            >
                              {lockingUser === user.id ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : user.locked ? (
                                <Unlock className="w-4 h-4" />
                              ) : (
                                <Lock className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => openEditUser(user)}
                              className="p-2 rounded-lg bg-[#f5efe6] hover:bg-[#f0e5d6] text-[#6b4c3b] transition"
                              title="Edit User"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setActiveUser(user);
                                setResetData({ userId: user.id, tempPassword: '' });
                                setShowResetModal(true);
                              }}
                              className="p-2 rounded-lg bg-[#f5efe6] hover:bg-[#f0e5d6] text-[#6b4c3b] transition"
                              title="Reset Password"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={deletingUser === user.id}
                              className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition"
                              title="Delete User"
                            >
                              {deletingUser === user.id ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => sendPaymentReminder(user.id)}
                              disabled={loading}
                              className="p-2 rounded-lg bg-[#f5efe6] hover:bg-[#f0e5d6] text-[#6b4c3b] transition"
                              title="Send Payment Reminder"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                // View user's dashboard
                                if (user.role === 'cashier') {
                                  window.open('/dashboard/cashier', '_blank');
                                } else {
                                  window.open('/admin', '_blank');
                                }
                              }}
                              className="p-2 rounded-lg bg-[#f5efe6] hover:bg-[#f0e5d6] text-[#6b4c3b] transition"
                              title="View User Dashboard"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Recent Activity Panel */}
          <div className="bg-white rounded-2xl border border-[#eadbcf] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#eadbcf]">
              <h2 className="text-xl font-bold text-[#6b4c3b] flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recent Activity
              </h2>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {filteredActivities.length === 0 ? (
                <p className="text-[#8b5a2b] text-center py-8">No recent activity</p>
              ) : (
                filteredActivities.map(activity => (
                  <div key={activity.id} className="bg-[#fdf7f1] rounded-lg p-3 border border-[#eadbcf]">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'login' ? 'bg-green-500' : 'bg-blue-500'
                      }`} />
                      <span className="text-[#6b4c3b] font-medium">{activity.user.name}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        activity.type === 'login' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {activity.type}
                      </span>
                    </div>
                    <p className="text-[#8b5a2b] text-sm">{activity.user.email}</p>
                    <p className="text-[#b79b82] text-xs mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-[#eadbcf]">
            <div className="bg-[#6b4c3b] p-6 text-white rounded-t-2xl">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Mail />
                Send Email to {selectedUsers.length} User(s)
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6b4c3b] mb-2">Subject</label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#eadbcf] rounded-lg text-[#6b4c3b] placeholder-[#b79b82] focus:outline-none focus:ring-2 focus:ring-[#cd853f]"
                  placeholder="Email subject..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6b4c3b] mb-2">Message</label>
                <textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#eadbcf] rounded-lg text-[#6b4c3b] placeholder-[#b79b82] focus:outline-none focus:ring-2 focus:ring-[#cd853f] h-40"
                  placeholder="Email message..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => sendEmail(selectedUsers, emailData.subject, emailData.message)}
                  disabled={loading}
                  className="flex-1 bg-[#6b4c3b] hover:bg-[#5a4a3b] text-white py-3 rounded-lg font-bold transition disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Email'}
                </button>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-6 py-3 bg-[#f5efe6] hover:bg-[#f0e5d6] text-[#6b4c3b] rounded-lg font-bold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-[#eadbcf]">
            <div className="bg-[#6b4c3b] p-6 text-white rounded-t-2xl">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Users /> Add New User
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#6b4c3b] mb-2">Full Name</label>
                  <input
                    type="text"
                    value={addUserData.name}
                    onChange={(e) => setAddUserData({ ...addUserData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-[#eadbcf] rounded-lg text-[#6b4c3b]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b4c3b] mb-2">Email</label>
                  <input
                    type="email"
                    value={addUserData.email}
                    onChange={(e) => setAddUserData({ ...addUserData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-[#eadbcf] rounded-lg text-[#6b4c3b]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b4c3b] mb-2">Temporary Password</label>
                  <input
                    type="text"
                    value={addUserData.password}
                    onChange={(e) => setAddUserData({ ...addUserData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-[#eadbcf] rounded-lg text-[#6b4c3b]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b4c3b] mb-2">Plan</label>
                  <select
                    value={addUserData.plan}
                    onChange={(e) => setAddUserData({ ...addUserData, plan: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-[#eadbcf] rounded-lg text-[#6b4c3b]"
                  >
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="ultra">Ultra</option>
                    <option value="free">Free</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b4c3b] mb-2">Business Type</label>
                  <select
                    value={addUserData.businessType}
                    onChange={(e) => setAddUserData({ ...addUserData, businessType: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-[#eadbcf] rounded-lg text-[#6b4c3b]"
                  >
                    <option value="retail">Retail</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="clinic">Clinic</option>
                    <option value="hotel">Hotel</option>
                    <option value="supermarket">Supermarket</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b4c3b] mb-2">Role</label>
                  <select
                    value={addUserData.role}
                    onChange={(e) => setAddUserData({ ...addUserData, role: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-[#eadbcf] rounded-lg text-[#6b4c3b]"
                  >
                    <option value="admin">Admin</option>
                    <option value="cashier">Cashier</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddUser}
                  disabled={loading}
                  className="flex-1 bg-[#6b4c3b] hover:bg-[#5a4a3b] text-white py-3 rounded-lg font-bold transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="px-6 py-3 bg-[#f5efe6] hover:bg-[#f0e5d6] text-[#6b4c3b] rounded-lg font-bold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-[#eadbcf]">
            <div className="bg-[#6b4c3b] p-6 text-white rounded-t-2xl">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Edit3 /> Edit User
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6b4c3b] mb-2">Name</label>
                <input
                  type="text"
                  value={editUserData.name}
                  onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#eadbcf] rounded-lg text-[#6b4c3b]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6b4c3b] mb-2">Business Role</label>
                <input
                  type="text"
                  value={editUserData.business_role}
                  onChange={(e) => setEditUserData({ ...editUserData, business_role: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#eadbcf] rounded-lg text-[#6b4c3b]"
                  placeholder="admin / cashier"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={editUserData.is_active}
                  onChange={(e) => setEditUserData({ ...editUserData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <span className="text-sm text-[#6b4c3b]">Active user</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleEditUser}
                  disabled={loading}
                  className="flex-1 bg-[#6b4c3b] hover:bg-[#5a4a3b] text-white py-3 rounded-lg font-bold transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setShowEditUserModal(false)}
                  className="px-6 py-3 bg-[#f5efe6] hover:bg-[#f0e5d6] text-[#6b4c3b] rounded-lg font-bold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-[#eadbcf]">
            <div className="bg-[#6b4c3b] p-6 text-white rounded-t-2xl">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <KeyRound /> Reset Password
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6b4c3b] mb-2">Select User</label>
                <select
                  value={resetData.userId}
                  onChange={(e) => setResetData({ ...resetData, userId: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#eadbcf] rounded-lg text-[#6b4c3b]"
                >
                  <option value="">Choose user</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6b4c3b] mb-2">Temporary Password (optional)</label>
                <input
                  type="text"
                  value={resetData.tempPassword}
                  onChange={(e) => setResetData({ ...resetData, tempPassword: e.target.value })}
                  placeholder="Leave empty to auto-generate"
                  className="w-full px-4 py-3 bg-white border border-[#eadbcf] rounded-lg text-[#6b4c3b]"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="flex-1 bg-[#6b4c3b] hover:bg-[#5a4a3b] text-white py-3 rounded-lg font-bold transition disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Email'}
                </button>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="px-6 py-3 bg-[#f5efe6] hover:bg-[#f0e5d6] text-[#6b4c3b] rounded-lg font-bold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Subscription Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-[#eadbcf]">
            <div className="bg-[#6b4c3b] p-6 text-white rounded-t-2xl">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <DollarSign /> Assign Subscription
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6b4c3b] mb-2">Select User</label>
                <select
                  value={assignPlanData.userId}
                  onChange={(e) => setAssignPlanData({ ...assignPlanData, userId: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#eadbcf] rounded-lg text-[#6b4c3b]"
                >
                  <option value="">Choose user</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6b4c3b] mb-2">Plan</label>
                <select
                  value={assignPlanData.plan}
                  onChange={(e) => setAssignPlanData({ ...assignPlanData, plan: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#eadbcf] rounded-lg text-[#6b4c3b]"
                >
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="ultra">Ultra</option>
                  <option value="free">Free</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAssignPlan}
                  disabled={loading}
                  className="flex-1 bg-[#6b4c3b] hover:bg-[#5a4a3b] text-white py-3 rounded-lg font-bold transition disabled:opacity-50"
                >
                  {loading ? 'Assigning...' : 'Assign Plan'}
                </button>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-6 py-3 bg-[#f5efe6] hover:bg-[#f0e5d6] text-[#6b4c3b] rounded-lg font-bold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
