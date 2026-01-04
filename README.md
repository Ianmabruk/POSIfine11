<<<<<<< HEAD
# posifine11
=======
# 🏪 Universal POS System

A complete Point of Sale system with admin and cashier roles, built with React, Flask, and Tailwind CSS.

## ✅ Currently Running

Both servers are currently running:
- **Frontend**: http://localhost:3004 (or check terminal for actual port)
- **Backend**: http://localhost:5001

## 🚀 Quick Start

### Option 1: Use the Start Script (Easiest)

```bash
cd my-react-app
./start-all.sh
```

This will start both frontend and backend servers automatically.

### Option 2: Manual Start (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd my-react-app/src/backend
python3 app.py
```

**Terminal 2 - Frontend:**
```bash
cd my-react-app
npm run dev
```

## 📦 Installation

If you need to install dependencies:

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
pip install -r requirements.txt
```

## 🌐 Access the Application

1. Open your browser to the frontend URL (shown in terminal)
2. **Sign up** for a new account (first user becomes admin)
3. **Select a plan**:
   - **Basic** (KSH 900) - Cashier access
   - **Ultra** (KSH 1,600) - Admin access
4. Access your dashboard based on your role

## 👥 User Roles

### Admin (Ultra Package)
- Full dashboard with analytics
- Inventory management
- Recipe/BOM builder
- User management
- Expense tracking
- Sales reports
- Time tracking
- Reminders
- Service fees
- Discounts
- Credit requests

### Cashier (Basic Package)
- POS interface
- Process sales
- View inventory (limited)
- Basic permissions

## 🛑 Stopping the Servers

If using `start-all.sh`: Press `Ctrl+C`

If running manually: Press `Ctrl+C` in each terminal window

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5001 (backend)
lsof -ti:5001 | xargs kill -9

# Kill process on port 3004 (frontend)
lsof -ti:3004 | xargs kill -9
```

### Blank Screen / React Not Loading

1. Make sure both servers are running
2. Clear browser cache and localStorage
3. Check browser console (F12) for errors
4. Restart the dev server: `npm run dev`

### Backend Not Connecting

1. Verify Flask is installed: `pip list | grep Flask`
2. Check backend is running: `curl http://localhost:5001/api/stats`
3. Install requirements: `pip install -r requirements.txt`

## 🌍 Deployment

### Deploy to Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

4. **Set Environment Variable:**
   - Go to https://app.netlify.com
   - Select your site
   - Site settings → Environment variables
   - Add: `JWT_SECRET` (generate using `node generate-secret.cjs`)

See [DEPLOY.md](./DEPLOY.md) for detailed deployment instructions.

## 📁 Project Structure

```
my-react-app/
├── src/
│   ├── backend/          # Flask backend API
│   │   └── app.py
│   ├── components/       # React components
│   ├── context/          # React context (Auth)
│   ├── pages/           # Page components
│   │   ├── admin/       # Admin dashboard pages
│   │   └── cashier/     # Cashier POS pages
│   ├── services/        # API service layer
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── netlify/
│   └── functions/       # Netlify serverless functions
├── public/              # Static assets
├── start-all.sh         # Startup script
└── package.json
```

## 🔑 Key Features

- ✅ Role-based authentication
- ✅ Admin dashboard with analytics
- ✅ Cashier POS interface
- ✅ Inventory management
- ✅ Recipe/BOM builder with auto COGS
- ✅ Automatic stock deduction
- ✅ User management
- ✅ Expense tracking
- ✅ Time tracking
- ✅ Reminders system
- ✅ Service fees
- ✅ Discounts
- ✅ Credit requests
- ✅ Screen lock on inactivity
- ✅ Modern gradient UI

## 📚 Documentation

- [HOW_TO_RUN.md](./HOW_TO_RUN.md) - Detailed running instructions
- [DEPLOY.md](./DEPLOY.md) - Deployment guide
- [BACKEND_AUTH_FIX.md](./BACKEND_AUTH_FIX.md) - Authentication fix details
- [TODO.md](./TODO.md) - Feature checklist

## 🐛 Known Issues

All major issues have been fixed:
- ✅ Admin dashboard blank screen - FIXED
- ✅ Backend authentication 401 errors - FIXED
- ✅ Token format mismatch - FIXED
- ✅ Syntax error in App.jsx - FIXED

## 💡 Tips

- First user to sign up automatically gets admin access
- Admin can add cashiers from the Users page
- Cashiers need to set their password on first login
- Use the screen lock feature for security
- Set up reminders for important tasks

---

**Need help?** Check the documentation files or the browser console for errors.
>>>>>>> 8d97750 (Initial commit)
