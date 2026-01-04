# Demo Mode - How It Works

## 🎮 Your App is Running in Demo Mode

Since your Flask backend isn't deployed yet, the app is running in **client-side demo mode**.

---

## ✅ What Works (Demo Mode)

### Authentication
- ✅ **Signup** - Creates user in browser localStorage
- ✅ **Login** - Checks localStorage for credentials
- ✅ **Logout** - Clears localStorage

### Subscription
- ✅ **Plan Selection** - Updates user plan locally
- ✅ **Dashboard Access** - Routes to correct dashboard
- ✅ **Plan Changes** - Updates localStorage

### Main Admin Dashboard
- ✅ **View Users** - Shows demo users + your account
- ✅ **Lock/Unlock Users** - Updates locally
- ✅ **Send Emails** - Simulates email sending (logs to localStorage)
- ✅ **Search & Filter** - Works on local data
- ✅ **Statistics** - Calculated from local data

### Regular Dashboards
- ✅ **Admin Dashboard** - All UI features work
- ✅ **Cashier POS** - All UI features work
- ✅ **Navigation** - All routes work
- ✅ **Page Refresh** - Data persists in browser

---

## ⚠️ Limitations (Demo Mode)

### Data Persistence
- ❌ **Browser Only** - Data stored in localStorage
- ❌ **No Sync** - Can't access from different device/browser
- ❌ **Cache Clear** - Clearing browser data = losing all data
- ❌ **No Backup** - No server-side storage

### Features
- ❌ **Real Emails** - Emails are simulated, not actually sent
- ❌ **Real Payments** - No actual payment processing
- ❌ **Multi-User** - Can't have multiple users simultaneously
- ❌ **Real Security** - No server-side validation

### API Calls
- ❌ **Backend APIs** - All API calls are mocked
- ❌ **Database** - No real database operations
- ❌ **File Upload** - Images stored as Base64 in localStorage

---

## 🎯 Demo Features

### Main Admin Dashboard Shows:
1. **Your Real Account** (if you signed up)
2. **4 Demo Users:**
   - John Doe (Ultra, Active)
   - Jane Smith (Basic, Active)
   - Bob Wilson (Ultra, Inactive)
   - Alice Brown (Basic, Locked)

### You Can:
- Lock/unlock any user (updates locally)
- Send "emails" (simulated, logged)
- Search and filter users
- See statistics
- Test all UI features

---

## 🚀 Upgrade to Full Mode

To enable full functionality, deploy your Flask backend:

### Quick Deploy (Railway - Free)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy backend
cd my-react-app/src/backend
railway init
railway up

# Get URL
railway domain
```

### Update Frontend

In `src/services/api.js`:
```javascript
const API_URL = 'https://your-app.railway.app/api';
```

### Redeploy Frontend
```bash
cd my-react-app
npm run build
netlify deploy --prod
```

---

## 📊 Demo Data

### Current Demo Users:

| Name | Email | Plan | Price | Status |
|------|-------|------|-------|--------|
| John Doe | john@example.com | Ultra | KSH 1,600 | Active |
| Jane Smith | jane@example.com | Basic | KSH 900 | Active |
| Bob Wilson | bob@example.com | Ultra | KSH 1,600 | Inactive |
| Alice Brown | alice@example.com | Basic | KSH 900 | Locked |

### Your Account:
- Whatever you signed up with
- Stored in localStorage
- Persists across sessions (same browser)

---

## 🔍 How to Check Demo Mode

### Check Console:
```javascript
// Open browser console (F12)
console.log('Demo Mode:', import.meta.env.PROD);
console.log('User:', localStorage.getItem('user'));
console.log('Email Logs:', localStorage.getItem('emailLogs'));
```

### Check localStorage:
1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "Local Storage"
4. See stored data

---

## 💡 Tips for Demo Mode

### 1. Test All Features
- Try locking/unlocking users
- Send test emails
- Search and filter
- Test all dashboards

### 2. Check Email Logs
```javascript
// In browser console
const logs = JSON.parse(localStorage.getItem('emailLogs') || '[]');
console.table(logs);
```

### 3. Reset Demo Data
```javascript
// In browser console
localStorage.clear();
location.reload();
```

### 4. Add More Demo Users
Edit `generateDemoData()` in `MainAdmin.jsx`:
```javascript
const demoData = [
  { name: 'Your Name', email: 'your@email.com', plan: 'ultra', ... },
  // Add more users here
];
```

---

## 🐛 Troubleshooting Demo Mode

### Issue: No Users Showing

**Solution:**
```javascript
// Browser console
localStorage.clear();
location.reload();
// Sign up again
```

### Issue: Actions Not Working

**Solution:**
- Check browser console for errors
- Ensure JavaScript is enabled
- Try different browser
- Clear cache and reload

### Issue: Data Lost

**Solution:**
- Demo mode uses localStorage
- Clearing browser data = losing data
- Deploy backend for persistence

---

## ✅ Demo Mode Checklist

Test these features:

- [ ] Signup works
- [ ] Login works
- [ ] Subscription selection works
- [ ] Admin dashboard loads
- [ ] Main admin dashboard loads
- [ ] Can see demo users
- [ ] Can lock/unlock users
- [ ] Can send simulated emails
- [ ] Search works
- [ ] Filter works
- [ ] Statistics show correctly
- [ ] Page refresh works
- [ ] Navigation works

---

## 🎉 Ready for Production?

When you deploy the backend:

1. ✅ Real database
2. ✅ Real authentication
3. ✅ Real email sending
4. ✅ Multi-user support
5. ✅ Data persistence
6. ✅ Cross-device sync
7. ✅ Secure API calls
8. ✅ File uploads
9. ✅ Payment processing
10. ✅ Real-time updates

---

See `BACKEND_NOT_DEPLOYED.md` for deployment guide!