# Troubleshooting Guide

## Common Errors and Solutions

### Error: "Something went wrong" on Admin Dashboard

**Possible Causes:**
1. Backend is not running
2. User authentication issue
3. Missing or corrupted data files
4. JavaScript error in components

**Solutions:**

#### Solution 1: Ensure Backend is Running
```bash
# Check if backend is running on port 5001
curl http://localhost:5001/api/stats

# If not running, start it:
cd my-react-app
python3 src/backend/app.py
```

#### Solution 2: Clear Browser Cache and Storage
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Clear all:
   - Local Storage
   - Session Storage
   - Cookies
4. Refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

#### Solution 3: Check Browser Console for Errors
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Common errors and fixes:

**Error: "Failed to fetch"**
- Backend is not running → Start backend
- Wrong API URL → Check `src/services/api.js`

**Error: "Cannot read property of undefined"**
- Data structure issue → Clear localStorage and re-login

**Error: "useInactivity is not defined"**
- Missing hook → Ensure `src/hooks/useInactivity.js` exists

#### Solution 4: Verify User Data
```javascript
// In browser console, run:
console.log(JSON.parse(localStorage.getItem('user')));
console.log(localStorage.getItem('token'));

// Should show user object with:
// - email
// - role: 'admin'
// - plan: 'ultra'
// - active: true
```

If user data is missing or incorrect:
```javascript
// Clear and re-login
localStorage.clear();
window.location.href = '/login';
```

#### Solution 5: Check Data Files
Ensure these files exist in `my-react-app/src/backend/data/`:
- `users.json`
- `products.json`
- `sales.json`
- `expenses.json`
- `reminders.json`

If missing, create empty arrays:
```bash
cd my-react-app/src/backend/data
echo '[]' > users.json
echo '[]' > products.json
echo '[]' > sales.json
echo '[]' > expenses.json
echo '[]' > reminders.json
```

#### Solution 6: Reinstall Dependencies
```bash
cd my-react-app

# Frontend
rm -rf node_modules package-lock.json
npm install

# Backend
pip3 uninstall flask flask-cors pyjwt -y
pip3 install flask flask-cors pyjwt
```

### Error: "Cannot access admin dashboard" / Redirected to Cashier

**Cause:** User doesn't have admin privileges

**Solution:**
```javascript
// In browser console:
const user = JSON.parse(localStorage.getItem('user'));
user.role = 'admin';
user.plan = 'ultra';
user.active = true;
localStorage.setItem('user', JSON.stringify(user));
window.location.reload();
```

### Error: Products not appearing in Inventory

**Cause:** Backend not saving data or API error

**Solution:**
1. Check backend console for errors
2. Verify `products.json` file exists
3. Check file permissions:
```bash
chmod 644 my-react-app/src/backend/data/*.json
```

### Error: Cashier can't log in

**Cause:** Password not saved or user not created

**Solution:**
1. Check `users.json` file:
```bash
cat my-react-app/src/backend/data/users.json
```

2. Verify user has:
   - email
   - password
   - role: 'cashier'
   - active: true

3. If user missing, create via Admin → Users → Add Cashier

### Error: Recipe creation fails

**Cause:** Ingredient names don't match inventory

**Solution:**
1. Ensure all ingredients exist in Inventory as raw materials
2. Check spelling (case-insensitive but must match)
3. Example:
   - Inventory has: "Nile Perch"
   - Recipe should use: "Nile Perch" or "nile perch"

### Error: Stock not deducting after sale

**Cause:** Backend not processing sales correctly

**Solution:**
1. Check backend console for errors
2. Verify recipe structure in `products.json`:
```json
{
  "id": 1,
  "name": "Fish Fingers",
  "recipe": [
    {"productId": 2, "quantity": 0.02}
  ]
}
```

3. Ensure raw materials have sufficient stock

### Error: CORS errors in browser console

**Cause:** Backend CORS not configured properly

**Solution:**
1. Ensure flask-cors is installed:
```bash
pip3 install flask-cors
```

2. Check `app.py` has:
```python
from flask_cors import CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

3. Restart backend

### Error: Port already in use

**Frontend (5173):**
```bash
# Find and kill process
lsof -ti:5173 | xargs kill -9

# Or change port in vite.config.js
```

**Backend (5001):**
```bash
# Find and kill process
lsof -ti:5001 | xargs kill -9

# Or change port in app.py
```

## Debugging Steps

### Step 1: Check All Services Running
```bash
# Frontend should show:
✓ Local: http://localhost:5173/

# Backend should show:
* Running on http://127.0.0.1:5001
```

### Step 2: Test API Endpoints
```bash
# Test backend is responding
curl http://localhost:5001/api/stats

# Should return JSON with stats
```

### Step 3: Check Browser Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Look for failed requests (red)
5. Click on failed request to see error details

### Step 4: Check Console Logs
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors or warnings
4. Note the file and line number

### Step 5: Verify Data Integrity
```bash
# Check all data files are valid JSON
cd my-react-app/src/backend/data
for file in *.json; do
  echo "Checking $file..."
  python3 -m json.tool "$file" > /dev/null && echo "✓ Valid" || echo "✗ Invalid"
done
```

## Getting More Help

If none of these solutions work:

1. **Check browser console** for specific error messages
2. **Check backend terminal** for Python errors
3. **Enable development mode** to see detailed errors:
   - Error details appear in the error boundary
4. **Create a minimal test case**:
   - Fresh login
   - Single operation
   - Note exact steps to reproduce

## Prevention Tips

1. **Always run backend before frontend**
2. **Don't edit JSON files manually** (use the UI)
3. **Keep browser console open** during development
4. **Clear cache** after major updates
5. **Backup data files** regularly:
```bash
cp -r my-react-app/src/backend/data my-react-app/src/backend/data.backup
```

## Quick Reset (Nuclear Option)

If everything is broken and you want to start fresh:

```bash
# Stop all services
# Kill frontend and backend processes

# Clear all data
cd my-react-app/src/backend/data
rm *.json
echo '[]' > users.json
echo '[]' > products.json
echo '[]' > sales.json
echo '[]' > expenses.json
echo '[]' > reminders.json

# Clear browser data
# In browser: Clear all site data for localhost

# Restart services
npm run dev  # Terminal 1
python3 src/backend/app.py  # Terminal 2

# Sign up again (first user becomes admin)
```