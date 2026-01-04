# Vercel Deployment Fix Plan

## Issues Identified
1. **Product Deletion Error**: "Failed to delete product: Failed to execute 'json' on 'Response': Unexpected end of JSON input"
2. **Discount Request Location**: Need to identify where customers/staff can request discounts

## Issue Analysis

### 1. Product Deletion Problem
- **Root Cause**: The API.js already handles 204 No Content responses correctly, but there may be inconsistencies in error handling
- **Location**: The error occurs in Inventory.jsx `handleDelete` function and potentially in CashierPOS.jsx stock management
- **Current API Fix**: The request function in api.js already returns `{ success: true, message: 'Operation completed successfully' }` for 204 responses

### 2. Discount Request Feature Location
- **Found in**: CashierPOS.jsx - "Request Additional Discount" button in the cart area
- **Access**: Available to cashier users during POS transactions
- **Functionality**: Opens modal to request percentage or fixed amount discounts with reasoning

## Solution Plan

### Step 1: Fix Product Deletion
1. **Inventory.jsx**: Improve error handling in `handleDelete` function
2. **CashierPOS.jsx**: Fix product deletion in stock management view
3. **Add better error messages**: Distinguish between network errors and backend errors

### Step 2: Enhance Discount Request Visibility
1. **Add visual indicators**: Make discount request button more prominent
2. **Add instructions**: Clear guidance on how to access discount requests
3. **Improve modal**: Better UX for discount request form

### Step 3: Test and Verify
1. Test product deletion in both admin inventory and cashier stock management
2. Verify discount request flow works correctly
3. Ensure error messages are user-friendly

## Files to Modify
- `/src/pages/admin/Inventory.jsx` - Fix delete error handling
- `/src/pages/cashier/CashierPOS.jsx` - Fix stock deletion and enhance discount requests
- `/src/components/DiscountSelector.jsx` - Minor improvements if needed

## Expected Outcome
- Product deletion works without JSON parsing errors
- Clear, actionable error messages when deletion fails
- Discount request feature is easily accessible and user-friendly
- Better overall user experience for both admin and cashier interfaces
