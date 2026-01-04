const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const createToken = (payload) => {
  return jwt.sign(payload, SECRET_KEY, { algorithm: 'HS256' });
};

const verifyToken = (token) => {
  return jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] });
};

let storage = { 
  users: [], 
  products: [], 
  sales: [], 
  expenses: [],
  reminders: [],
  serviceFees: [],
  discounts: [],
  creditRequests: [],
  timeEntries: [],
  settings: {
    lockTimeout: 45000,
    currency: 'KSH',
    companyName: 'Universal POS',
    taxRate: 0
  }
};

const tokenRequired = (handler) => async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token is missing' });
  try {
    req.user = verifyToken(token);
    return handler(req, res);
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Token is invalid' });
  }
};

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.query.path ? `/${req.query.path.join('/')}` : '/';
  const method = req.method;
  const body = req.body || {};

  try {
    // Auth endpoints (no token required)
    if (path === '/auth/signup' && method === 'POST') {
      if (storage.users.some(u => u.email === body.email)) {
        return res.status(400).json({ error: 'User already exists' });
      }
      
      const isFirstUser = storage.users.length === 0;
      
      const user = {
        id: storage.users.length + 1,
        email: body.email,
        password: body.password,
        name: body.name || '',
        role: isFirstUser ? 'admin' : 'cashier',
        plan: isFirstUser ? 'ultra' : null,
        price: isFirstUser ? 1600 : null,
        active: isFirstUser,
        permissions: isFirstUser ? {} : { 
          viewSales: true, 
          viewInventory: true, 
          viewExpenses: false, 
          manageProducts: false 
        },
        createdAt: new Date().toISOString()
      };
      storage.users.push(user);
      const token = createToken({ id: user.id, email: user.email, role: user.role });
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json({ token, user: userWithoutPassword });
    }

    if (path === '/auth/login' && method === 'POST') {
      const user = storage.users.find(u => u.email === body.email);
      if (!user) return res.status(401).json({ error: 'Email not found' });
      
      if (user.needsPasswordSetup && body.newPassword) {
        user.password = body.newPassword;
        user.needsPasswordSetup = false;
        const token = createToken({ id: user.id, email: user.email, role: user.role });
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json({ token, user: userWithoutPassword, firstLogin: true });
      }
      
      if (user.needsPasswordSetup) {
        return res.status(200).json({ needsPasswordSetup: true, userId: user.id, email: user.email, role: user.role });
      }
      
      if (user.password !== body.password) return res.status(401).json({ error: 'Invalid password' });
      const token = createToken({ id: user.id, email: user.email, role: user.role });
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json({ token, user: userWithoutPassword });
    }

    // All other endpoints require authentication
    return tokenRequired(async (req, res) => {
      // Users endpoints
      if (path === '/users' && method === 'GET') {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
        return res.status(200).json(storage.users.map(({ password, ...u }) => u));
      }

      if (path === '/users' && method === 'POST') {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
        const user = { 
          id: storage.users.length + 1, 
          ...body, 
          password: null, 
          needsPasswordSetup: true, 
          role: 'cashier', 
          plan: 'ultra', 
          price: 0, 
          active: true, 
          addedByAdmin: true,
          createdAt: new Date().toISOString() 
        };
        storage.users.push(user);
        const { password, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      }

      if (path.startsWith('/users/') && method === 'PUT') {
        const id = parseInt(path.split('/')[2]);
        const user = storage.users.find(u => u.id === id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        Object.assign(user, body);
        const token = createToken({ id: user.id, email: user.email, role: user.role });
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json({ token, user: userWithoutPassword });
      }

      if (path.startsWith('/users/') && method === 'DELETE') {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
        storage.users = storage.users.filter(u => u.id !== parseInt(path.split('/')[2]));
        return res.status(204).end();
      }


      // Products endpoints
      if (path === '/products' && method === 'GET') {
        return res.status(200).json(storage.products);
      }

      if (path === '/products' && method === 'POST') {
        const product = {
          id: storage.products.length + 1,
          ...body,
          createdAt: new Date().toISOString()
        };
        storage.products.push(product);
        return res.status(201).json(product);
      }

      if (path.startsWith('/products/') && method === 'PUT') {
        const id = parseInt(path.split('/')[2]);
        const product = storage.products.find(p => p.id === id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        Object.assign(product, body);
        return res.status(200).json(product);
      }

      if (path.startsWith('/products/') && method === 'DELETE') {
        const id = parseInt(path.split('/')[2]);
        const index = storage.products.findIndex(p => p.id === id);
        if (index === -1) return res.status(404).json({ error: 'Product not found' });
        storage.products.splice(index, 1);
        return res.status(204).end();
      }

      // Sales endpoints
      if (path === '/sales' && method === 'GET') {
        return res.status(200).json(storage.sales);
      }

      if (path === '/sales' && method === 'POST') {
        const sale = {
          id: storage.sales.length + 1,
          ...body,
          createdAt: new Date().toISOString()
        };
        storage.sales.push(sale);
        return res.status(201).json(sale);
      }

      // Expenses endpoints
      if (path === '/expenses' && method === 'GET') {
        return res.status(200).json(storage.expenses);
      }

      if (path === '/expenses' && method === 'POST') {
        const expense = {
          id: storage.expenses.length + 1,
          ...body,
          createdAt: new Date().toISOString()
        };
        storage.expenses.push(expense);
        return res.status(201).json(expense);
      }

      // Discounts endpoints
      if (path === '/discounts' && method === 'GET') {
        return res.status(200).json(storage.discounts);
      }

      if (path === '/discounts' && method === 'POST') {
        const discount = {
          id: storage.discounts.length + 1,
          ...body,
          createdAt: new Date().toISOString()
        };
        storage.discounts.push(discount);
        return res.status(201).json(discount);
      }

      if (path.startsWith('/discounts/') && method === 'PUT') {
        const id = parseInt(path.split('/')[2]);
        const discount = storage.discounts.find(d => d.id === id);
        if (!discount) return res.status(404).json({ error: 'Discount not found' });
        Object.assign(discount, body);
        return res.status(200).json(discount);
      }

      if (path.startsWith('/discounts/') && method === 'DELETE') {
        const id = parseInt(path.split('/')[2]);
        const index = storage.discounts.findIndex(d => d.id === id);
        if (index === -1) return res.status(404).json({ error: 'Discount not found' });
        storage.discounts.splice(index, 1);
        return res.status(204).end();
      }

      // Credit Requests endpoints
      if (path === '/credit-requests' && method === 'GET') {
        return res.status(200).json(storage.creditRequests);
      }

      if (path === '/credit-requests' && method === 'POST') {
        const creditRequest = {
          id: storage.creditRequests.length + 1,
          ...body,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        storage.creditRequests.push(creditRequest);
        return res.status(201).json(creditRequest);
      }

      if (path.startsWith('/credit-requests/') && method === 'PUT') {
        const id = parseInt(path.split('/')[2]);
        const creditRequest = storage.creditRequests.find(c => c.id === id);
        if (!creditRequest) return res.status(404).json({ error: 'Credit request not found' });
        Object.assign(creditRequest, body);
        return res.status(200).json(creditRequest);
      }

      // Service Fees endpoints
      if (path === '/service-fees' && method === 'GET') {
        return res.status(200).json(storage.serviceFees);
      }

      if (path === '/service-fees' && method === 'POST') {
        const serviceFee = {
          id: storage.serviceFees.length + 1,
          ...body,
          createdAt: new Date().toISOString()
        };
        storage.serviceFees.push(serviceFee);
        return res.status(201).json(serviceFee);
      }

      if (path.startsWith('/service-fees/') && method === 'PUT') {
        const id = parseInt(path.split('/')[2]);
        const serviceFee = storage.serviceFees.find(s => s.id === id);
        if (!serviceFee) return res.status(404).json({ error: 'Service fee not found' });
        Object.assign(serviceFee, body);
        return res.status(200).json(serviceFee);
      }

      if (path.startsWith('/service-fees/') && method === 'DELETE') {
        const id = parseInt(path.split('/')[2]);
        const index = storage.serviceFees.findIndex(s => s.id === id);
        if (index === -1) return res.status(404).json({ error: 'Service fee not found' });
        storage.serviceFees.splice(index, 1);
        return res.status(204).end();
      }

      // Reminders endpoints
      if (path === '/reminders' && method === 'GET') {
        return res.status(200).json(storage.reminders);
      }

      if (path === '/reminders' && method === 'POST') {
        const reminder = {
          id: storage.reminders.length + 1,
          ...body,
          createdAt: new Date().toISOString()
        };
        storage.reminders.push(reminder);
        return res.status(201).json(reminder);
      }

      if (path === '/reminders/today' && method === 'GET') {
        const today = new Date().toDateString();
        const todayReminders = storage.reminders.filter(r => 
          new Date(r.dueDate).toDateString() === today && !r.completed
        );
        return res.status(200).json(todayReminders);
      }

      if (path.startsWith('/reminders/') && method === 'PUT') {
        const id = parseInt(path.split('/')[2]);
        const reminder = storage.reminders.find(r => r.id === id);
        if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
        Object.assign(reminder, body);
        return res.status(200).json(reminder);
      }

      if (path.startsWith('/reminders/') && method === 'DELETE') {
        const id = parseInt(path.split('/')[2]);
        const index = storage.reminders.findIndex(r => r.id === id);
        if (index === -1) return res.status(404).json({ error: 'Reminder not found' });
        storage.reminders.splice(index, 1);
        return res.status(204).end();
      }

      // Stats endpoint
      if (path === '/stats' && method === 'GET') {
        const totalSales = storage.sales.reduce((sum, s) => sum + s.total, 0);
        const totalCOGS = storage.sales.reduce((sum, s) => sum + (s.cogs || 0), 0);
        const totalExpenses = storage.expenses.reduce((sum, e) => sum + e.amount, 0);
        return res.status(200).json({ 
          totalSales, 
          totalCOGS, 
          totalExpenses, 
          grossProfit: totalSales - totalCOGS, 
          netProfit: totalSales - totalCOGS - totalExpenses, 
          salesCount: storage.sales.length, 
          productCount: storage.products.length,
          dailySales: 0,
          weeklySales: 0
        });
      }

      // Settings endpoint
      if (path === '/settings' && method === 'GET') {
        return res.status(200).json(storage.settings);
      }

      if (path === '/settings' && method === 'POST') {
        storage.settings = { ...storage.settings, ...body };
        return res.status(200).json(storage.settings);
      }

      // Time entries endpoint (basic)
      if (path === '/time-entries' && method === 'GET') {
        return res.status(200).json(storage.timeEntries || []);
      }

      if (path === '/time-entries' && method === 'POST') {
        const timeEntry = {
          id: (storage.timeEntries?.length || 0) + 1,
          ...body,
          createdAt: new Date().toISOString()
        };
        if (!storage.timeEntries) storage.timeEntries = [];
        storage.timeEntries.push(timeEntry);
        return res.status(201).json(timeEntry);
      }

      // Categories endpoint
      if (path === '/categories' && method === 'GET') {
        return res.status(200).json([]);
      }

      // Batches endpoint
      if (path === '/batches' && method === 'GET') {
        return res.status(200).json([]);
      }

      if (path === '/batches' && method === 'POST') {
        return res.status(201).json({ id: 1, ...body });
      }

      // Production endpoint
      if (path === '/production' && method === 'GET') {
        return res.status(200).json([]);
      }

      if (path === '/production' && method === 'POST') {
        return res.status(201).json({ id: 1, ...body });
      }

      // Price history endpoint
      if (path === '/price-history' && method === 'GET') {
        return res.status(200).json([]);
      }

      if (path === '/price-history' && method === 'POST') {
        return res.status(201).json({ id: 1, ...body });
      }

      return res.status(404).json({ error: 'Not found' });
    })(req, res);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
};