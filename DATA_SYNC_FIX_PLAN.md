# Data Synchronization Fix Plan

## Problem Analysis

### Current Issues Identified:
1. **API URL Mismatch**: Flask backend runs on port 5002 but API service may be trying different endpoints
2. **Product Visibility Logic**: Admin dashboard products not properly showing in cashier dashboard
3. **Data Synchronization**: No real-time sync between admin and cashier views
4. **Session Persistence**: Data not properly maintained across logout/login sessions
5. **Vercel Deployment**: Backend not deployed, causing app to run in "demo mode"

## Root Causes:

### 1. Backend Deployment Issue
- Flask backend (`/src/backend/app.py`) is not deployed to Vercel
- App currently runs in localStorage-only mode (demo mode)
- API requests fail and fall back to localStorage

### 2. API Configuration Mismatch
- `api.js` sets API_URL to `http://localhost:5002/api` for development
- Production uses `/api` but no backend is deployed
- Vercel configuration only handles frontend routing

### 3. Product Visibility Logic Flaws
- Admin creates products but `visibleToCashier` field not consistently set
- Cashier dashboard filters products by `visibleToCashier !== false`
- Products created in admin may not appear in cashier if visibility flag is missing

### 4. Data Sync Strategy
- Each dashboard loads data independently
- No real-time synchronization mechanism
- localStorage used as fallback but not synchronized properly

## Fix Strategy:

### Phase 1: Deploy Backend to Vercel
1. Deploy Flask backend as serverless functions
2. Update API routing to handle both frontend and backend
3. Configure proper environment variables

### Phase 2: Fix API Configuration
1. Standardize API URLs across all services
2. Implement proper error handling and fallbacks
3. Add real-time data synchronization

### Phase 3: Improve Product Visibility Logic
1. Fix admin dashboard to always set `visibleToCashier: true` by default
2. Ensure proper filtering in cashier dashboard
3. Add debugging for visibility issues

### Phase 4: Enhance Session Persistence
1. Improve localStorage synchronization
2. Add data validation and consistency checks
3. Implement proper session management

### Phase 5: Real-time Sync Implementation
1. Add WebSocket or polling for real-time updates
2. Implement proper cache invalidation
3. Add sync status indicators

## Implementation Steps:

### Step 1: Deploy Backend
- Configure Vercel for Python/Flask deployment
- Update vercel.json to handle API routes
- Set up proper environment variables

### Step 2: Fix API Service
- Correct API_URL configuration
- Implement proper error handling
- Add retry logic for failed requests

### Step 3: Fix Product Visibility
- Update admin inventory component
- Ensure all new products are visible to cashiers
- Add visibility debugging

### Step 4: Enhance Data Sync
- Improve localStorage sync logic
- Add data validation
- Implement proper caching

### Step 5: Testing & Validation
- Test admin → cashier product sync
- Test logout/login persistence
- Verify real-time updates

## Expected Outcomes:

1. ✅ Products added in admin dashboard immediately appear in cashier dashboard
2. ✅ Data persists across logout/login sessions for both dashboards
3. ✅ Real-time synchronization between admin and cashier views
4. ✅ Proper error handling and fallback mechanisms
5. ✅ Full Vercel deployment with both frontend and backend

## Success Metrics:

- Admin creates product → Product appears in cashier POS within 2 seconds
- Logout/Login cycle → All data maintained (products, sales, etc.)
- Real-time updates → Changes reflect immediately across all sessions
- Error handling → Graceful fallbacks when backend unavailable
