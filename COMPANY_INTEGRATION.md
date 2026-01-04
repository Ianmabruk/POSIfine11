# Company Website Integration Guide

## Overview
This guide explains how to connect the POS system to your company website for centralized monitoring and management of all client businesses.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Company Website                      │
│                  (company.com/admin-portal)                  │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Super Admin Dashboard                       │    │
│  │  - View all registered businesses                   │    │
│  │  - Monitor sales across all clients                 │    │
│  │  - Enable/disable features per business             │    │
│  │  - View analytics & reports                         │    │
│  │  - Manage subscriptions                             │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓ API Calls
┌─────────────────────────────────────────────────────────────┐
│              Central API Server (Your Backend)               │
│                   (api.company.com)                          │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Database: All Businesses Data                      │    │
│  │  - business_id, email, name, plan, features         │    │
│  │  - sales, inventory, users, transactions            │    │
│  │  - analytics, logs, subscriptions                   │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓ API Calls
┌─────────────────────────────────────────────────────────────┐
│              Client POS Systems (Multiple)                   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Business A  │  │  Business B  │  │  Business C  │     │
│  │  Fish Shop   │  │  Restaurant  │  │  Retail      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### 1. Central Database Schema

Add these tables to your company database:

```sql
-- Businesses table
CREATE TABLE businesses (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    phone VARCHAR(50),
    plan VARCHAR(50), -- basic, ultra, premium
    price DECIMAL(10,2),
    status VARCHAR(50), -- active, suspended, trial
    features JSON, -- ["reminders", "credit", "fifo", "production"]
    logo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subscription_expires_at TIMESTAMP,
    last_active TIMESTAMP
);

-- Business analytics (aggregated daily)
CREATE TABLE business_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id VARCHAR(50),
    date DATE,
    total_sales DECIMAL(10,2),
    total_transactions INT,
    total_profit DECIMAL(10,2),
    active_users INT,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- Feature flags
CREATE TABLE feature_flags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id VARCHAR(50),
    feature_name VARCHAR(100),
    enabled BOOLEAN DEFAULT FALSE,
    enabled_at TIMESTAMP,
    enabled_by VARCHAR(255),
    FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- Subscription payments
CREATE TABLE subscription_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id VARCHAR(50),
    amount DECIMAL(10,2),
    plan VARCHAR(50),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    status VARCHAR(50), -- pending, completed, failed
    paid_at TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
);
```

### 2. API Endpoints for Company Website

Create these endpoints on your central API server:

```javascript
// Super Admin Authentication
POST /api/super-admin/login
Body: { email, password }
Response: { token, admin: {...} }

// Business Management
GET /api/super-admin/businesses
Response: { businesses: [...] }

GET /api/super-admin/businesses/:id
Response: { business: {...}, stats: {...} }

PUT /api/super-admin/businesses/:id/features
Body: { features: ["reminders", "credit"] }
Response: { success: true }

PUT /api/super-admin/businesses/:id/status
Body: { status: "active" | "suspended" }
Response: { success: true }

// Analytics & Monitoring
GET /api/super-admin/analytics/overview
Response: {
    totalBusinesses: 150,
    activeBusinesses: 142,
    totalRevenue: 240000,
    monthlyRecurring: 180000
}

GET /api/super-admin/analytics/business/:id
Query: ?from=2024-01-01&to=2024-01-31
Response: {
    sales: [...],
    transactions: [...],
    users: [...],
    inventory: [...]
}

// Feature Management
POST /api/super-admin/features/enable
Body: { businessId, feature: "reminders" }
Response: { success: true }

POST /api/super-admin/features/disable
Body: { businessId, feature: "credit" }
Response: { success: true }

// Subscription Management
GET /api/super-admin/subscriptions
Response: { subscriptions: [...] }

POST /api/super-admin/subscriptions/:id/renew
Response: { success: true }
```

### 3. Client POS Integration

Update the POS system to sync with your central server:

```javascript
// Add to src/services/api.js

const CENTRAL_API = 'https://api.yourcompany.com';

export const syncToCentral = {
  // Register business on first signup
  registerBusiness: async (businessData) => {
    const response = await fetch(`${CENTRAL_API}/api/businesses/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(businessData)
    });
    return response.json();
  },

  // Sync sales data (every hour or on sale)
  syncSales: async (businessId, salesData) => {
    const response = await fetch(`${CENTRAL_API}/api/businesses/${businessId}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(salesData)
    });
    return response.json();
  },

  // Check feature access
  checkFeature: async (businessId, feature) => {
    const response = await fetch(`${CENTRAL_API}/api/businesses/${businessId}/features/${feature}`);
    return response.json();
  },

  // Heartbeat (every 5 minutes)
  sendHeartbeat: async (businessId) => {
    const response = await fetch(`${CENTRAL_API}/api/businesses/${businessId}/heartbeat`, {
      method: 'POST'
    });
    return response.json();
  }
};
```

### 4. Company Website Dashboard

Create a Super Admin dashboard on your company website:

**Pages Needed:**

1. **Dashboard Overview** (`/admin-portal`)
   - Total businesses
   - Active subscriptions
   - Monthly revenue
   - Recent signups
   - System health

2. **Businesses List** (`/admin-portal/businesses`)
   - Search and filter
   - Business name, email, plan, status
   - Quick actions: View, Edit, Suspend

3. **Business Details** (`/admin-portal/businesses/:id`)
   - Business info
   - Sales analytics
   - User list
   - Inventory summary
   - Transaction history
   - Feature toggles

4. **Analytics** (`/admin-portal/analytics`)
   - Revenue charts
   - Business growth
   - Feature usage
   - Popular plans

5. **Feature Management** (`/admin-portal/features`)
   - Enable/disable features per business
   - Feature usage statistics
   - Custom feature pricing

6. **Subscriptions** (`/admin-portal/subscriptions`)
   - Active subscriptions
   - Expiring soon
   - Payment history
   - Renewal management

### 5. Real-Time Monitoring

Implement WebSocket for real-time updates:

```javascript
// On your central server
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws, req) => {
  const businessId = req.url.split('?businessId=')[1];
  
  // Send real-time updates
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    // Broadcast to super admin dashboard
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'business_update',
          businessId,
          data
        }));
      }
    });
  });
});
```

### 6. Security Considerations

**Authentication:**
- Super admin uses separate authentication
- JWT tokens with short expiration
- Role-based access control (RBAC)

**Data Privacy:**
- Encrypt sensitive data
- Business data isolation
- Audit logs for all actions

**API Security:**
- Rate limiting
- API key authentication
- HTTPS only
- CORS configuration

### 7. Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Your Company Website (Vercel/Netlify)                  │
│  - Super Admin Dashboard                                │
│  - Marketing pages                                      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Central API Server (AWS/DigitalOcean)                  │
│  - Node.js/Express or Python/Flask                      │
│  - PostgreSQL/MySQL Database                            │
│  - Redis for caching                                    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Client POS Systems (Netlify)                           │
│  - Individual business deployments                      │
│  - Sync data to central server                          │
└─────────────────────────────────────────────────────────┘
```

### 8. Integration Code Example

**In POS System (src/App.jsx):**

```javascript
import { useEffect } from 'react';
import { syncToCentral } from './services/api';

function App() {
  useEffect(() => {
    // Register business on first load
    const businessId = localStorage.getItem('businessId');
    if (!businessId) {
      syncToCentral.registerBusiness({
        email: user.email,
        name: user.name,
        plan: user.plan
      }).then(data => {
        localStorage.setItem('businessId', data.businessId);
      });
    }

    // Send heartbeat every 5 minutes
    const heartbeat = setInterval(() => {
      syncToCentral.sendHeartbeat(businessId);
    }, 5 * 60 * 1000);

    return () => clearInterval(heartbeat);
  }, []);

  return <YourApp />;
}
```

**On Sale Completion:**

```javascript
const handleCheckout = async () => {
  // ... existing checkout code
  
  // Sync to central server
  const businessId = localStorage.getItem('businessId');
  await syncToCentral.syncSales(businessId, {
    total: total,
    items: cart,
    timestamp: new Date().toISOString()
  });
};
```

### 9. Feature Flag Implementation

**In POS System:**

```javascript
// src/hooks/useFeature.js
import { useState, useEffect } from 'react';
import { syncToCentral } from '../services/api';

export function useFeature(featureName) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const businessId = localStorage.getItem('businessId');
    syncToCentral.checkFeature(businessId, featureName)
      .then(data => {
        setEnabled(data.enabled);
        setLoading(false);
      });
  }, [featureName]);

  return { enabled, loading };
}

// Usage in components
function ReminderSystem() {
  const { enabled, loading } = useFeature('reminders');
  
  if (loading) return <div>Loading...</div>;
  if (!enabled) return <div>Feature not available</div>;
  
  return <ReminderManager />;
}
```

### 10. Benefits of This Integration

✅ **Centralized Control**
- Manage all businesses from one dashboard
- Enable/disable features remotely
- Monitor system health

✅ **Revenue Tracking**
- Real-time subscription revenue
- Payment tracking
- Churn analysis

✅ **Customer Support**
- Access client data for support
- View transaction history
- Debug issues remotely

✅ **Feature Rollout**
- Test features with specific businesses
- Gradual rollout
- A/B testing

✅ **Analytics**
- Cross-business insights
- Feature usage statistics
- Performance metrics

## Next Steps

1. **Set up central database** (PostgreSQL recommended)
2. **Create central API server** (Node.js/Express or Python/Flask)
3. **Build super admin dashboard** (React/Next.js)
4. **Implement sync in POS system**
5. **Test with pilot businesses**
6. **Deploy and monitor**

## Cost Estimate

- **Central Server**: $20-50/month (DigitalOcean/AWS)
- **Database**: $15-30/month (Managed PostgreSQL)
- **Domain & SSL**: $15/year
- **Monitoring Tools**: $0-20/month (optional)

**Total**: ~$50-100/month for infrastructure

## Support

For implementation help, contact your development team or reach out for consultation.
