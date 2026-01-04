# Critical Fix Plan: API Endpoints & Discount System

## Problem Analysis
1. **"Failed to fetch" Error**: Vercel API function is incomplete, missing `/products` endpoint
2. **Missing Discount System**: Cashier dashboard needs proper discount management
3. **Incomplete API Coverage**: Most endpoints are not implemented in the Vercel function

## Plan Overview

### Phase 1: Complete Vercel API Function
- Add all missing endpoints: `/products`, `/sales`, `/expenses`, `/reminders`, `/service-fees`, `/discounts`, `/credit-requests`, `/time-entries`, `/categories`, `/batches`, `/production`, `/price-history`
- Implement proper CRUD operations for each endpoint
- Add proper error handling and CORS configuration
- Ensure data persistence using in-memory storage (suitable for Vercel serverless)

### Phase 2: Enhanced Discount System for Cashier
- Add discount request functionality to cashier dashboard
- Create discount approval/rejection system
- Display available discounts in real-time
- Allow cashiers to request discounts with reason
- Show current discount requests status

### Phase 3: Testing & Verification
- Test product creation, editing, and deletion
- Verify discount request flow
- Ensure all API endpoints work correctly
- Test cashier dashboard functionality

## Implementation Steps

### Step 1: Complete Vercel API Function
- Update `/api/[...path].js` with all missing endpoints
- Implement proper authentication middleware
- Add comprehensive error handling
- Ensure CORS is properly configured

### Step 2: Enhance Cashier Dashboard
- Add discount request modal and functionality
- Integrate with discount API endpoints
- Display current discount requests
- Add real-time discount status updates

### Step 3: Test All Functionality
- Verify product management works
- Test discount request flow
- Ensure no "Failed to fetch" errors
- Validate all API endpoints respond correctly

## Expected Outcome
- ✅ Product creation, editing, and deletion works without errors
- ✅ Cashier dashboard has working discount request system
- ✅ All API endpoints respond correctly
- ✅ No more "Failed to fetch" errors
- ✅ Complete discount management system
