# Installation Guide

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- **Python** 3.11 or higher
- **pip** (Python package manager)

Check your versions:
```bash
node --version
npm --version
python --version  # or python3 --version
pip --version     # or pip3 --version
```

## Installation Steps

### Step 1: Navigate to Project Directory

```bash
cd my-react-app
```

### Step 2: Install Frontend Dependencies

Install all React and Vite dependencies:

```bash
npm install
```

This will install:
- `react` (^18.3.1)
- `react-dom` (^18.3.1)
- `react-router-dom` (^6.30.2)
- `lucide-react` (^0.460.0) - Icon library
- `jsonwebtoken` (^9.0.3) - JWT handling
- `@vitejs/plugin-react` (^4.2.1)
- `vite` (^7.2.7)
- `tailwindcss` (^3.4.0)
- `postcss` (^8.4.32)
- `autoprefixer` (^10.4.16)
- `eslint` (^8.55.0)

### Step 3: Install Backend Dependencies

Install Python packages for Flask backend:

```bash
pip install flask flask-cors pyjwt
```

Or if using Python 3:
```bash
pip3 install flask flask-cors pyjwt
```

Or using pipenv (recommended):
```bash
pipenv install flask flask-cors pyjwt
```

**Backend Dependencies:**
- `flask` - Web framework
- `flask-cors` - CORS handling
- `pyjwt` - JWT token generation and validation

### Step 4: Verify Installation

Check if all packages are installed:

**Frontend:**
```bash
npm list --depth=0
```

**Backend:**
```bash
pip list | grep -E "Flask|flask-cors|PyJWT"
```

Or with pip3:
```bash
pip3 list | grep -E "Flask|flask-cors|PyJWT"
```

## Running the Application

### Option 1: Run Both Services Separately

**Terminal 1 - Frontend (Vite Dev Server):**
```bash
npm run dev
```
Frontend will run on: `http://localhost:5173`

**Terminal 2 - Backend (Flask API):**
```bash
npm run backend
```
Or directly:
```bash
python src/backend/app.py
```
Or with Python 3:
```bash
python3 src/backend/app.py
```
Backend will run on: `http://localhost:5001`

### Option 2: Using Pipenv (Recommended)

If using pipenv:

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
pipenv run python src/backend/app.py
```

## Quick Installation Commands (Copy & Paste)

### For Linux/Mac:

```bash
# Navigate to project
cd my-react-app

# Install frontend dependencies
npm install

# Install backend dependencies
pip3 install flask flask-cors pyjwt

# Run frontend (in one terminal)
npm run dev

# Run backend (in another terminal)
python3 src/backend/app.py
```

### For Windows:

```bash
# Navigate to project
cd my-react-app

# Install frontend dependencies
npm install

# Install backend dependencies
pip install flask flask-cors pyjwt

# Run frontend (in one terminal)
npm run dev

# Run backend (in another terminal)
python src/backend/app.py
```

## Troubleshooting

### Issue: "node: command not found"
**Solution:** Install Node.js from https://nodejs.org/

### Issue: "python: command not found"
**Solution:** 
- On Linux/Mac: Try `python3` instead of `python`
- On Windows: Install Python from https://python.org/

### Issue: "pip: command not found"
**Solution:** 
- On Linux/Mac: Try `pip3` instead of `pip`
- On Windows: Reinstall Python with "Add to PATH" option checked

### Issue: Port 5173 or 5001 already in use
**Solution:** 
- Kill the process using that port
- Or change the port in vite.config.js (frontend) or app.py (backend)

### Issue: CORS errors
**Solution:** 
- Ensure backend is running on port 5001
- Check that flask-cors is installed
- Clear browser cache

### Issue: "Module not found" errors
**Solution:** 
- Delete `node_modules` folder and run `npm install` again
- For Python: Ensure you're in the correct virtual environment

## Environment Variables (Optional)

Create a `.env` file in `my-react-app/` directory:

```env
# Backend
JWT_SECRET=your-secret-key-change-in-production
FLASK_ENV=development

# Frontend
VITE_API_URL=http://localhost:5001/api
```

## Production Build

To build for production:

```bash
npm run build
```

This creates optimized files in the `dist/` folder.

To preview production build:
```bash
npm run preview
```

## Next Steps

After installation:
1. Open browser to `http://localhost:5173`
2. Sign up for an account (first user becomes admin)
3. Start using the POS system!

For usage instructions, see `HOW_TO_USE.md`
For technical details, see `INVENTORY_FIXES_SUMMARY.md`