y# Product Images & Package Authentication Fix Plan

## Issues Identified

### 1. Product Images Not Displaying in Cashier Dashboard
- **Problem**: Images are saved when adding products in admin panel, but don't display in cashier POS
- **Root Cause**: Missing image rendering in CashierPOS.jsx product cards
- **Location**: `src/pages/cashier/CashierPOS.jsx` - Products Grid section

### 2. Package Authentication System Needs Restructuring
- **Current Flow Issues**:
  - 900 package (Basic): Users get cashier role immediately
  - 1600 package (Ultra): Users get admin role immediately
- **Required Flow**:
  - 900 package (Basic): Standalone cashier package (no admin required)
  - 1600 package (Ultra): Admin must be created first, then cashiers can be added

## Solution Plan

### Phase 1: Fix Product Images Display
1. **Update CashierPOS.jsx**: Add image rendering to product cards
2. **Update Inventory.jsx**: Add image column to admin products table
3. **Update Add/Edit Product Forms**: Ensure image field is properly handled
4. **Test**: Verify images display correctly in both admin and cashier views

### Phase 2: Restructure Package Authentication
1. **Update Subscription.jsx**: Modify plan flows
   - Basic (900): Direct to cashier setup
   - Ultra (1600): Direct to admin setup, then allow cashier creation
2. **Update Auth.jsx**: Handle new authentication flows
3. **Update AuthContext.jsx**: Ensure proper role assignment logic
4. **Update UserManagement.jsx**: Ensure ultra package users can add cashiers
5. **Create New Flow**:
   - Basic Package: Standalone cashier access
   - Ultra Package: Admin creates account → Admin can add cashiers → Cashiers log in with credentials

### Phase 3: Testing & Verification
1. Test image display in both admin and cashier dashboards
2. Test 900 package flow (cashier only)
3. Test 1600 package flow (admin first, then cashiers)
4. Verify authentication works for both flows
5. Ensure proper navigation and permissions

## Implementation Steps

### Step 1: Fix Product Images
- Add image display components to CashierPOS
- Add image column to admin inventory table
- Ensure image upload/preview works correctly

### Step 2: Update Package Flows
- Modify subscription page logic
- Update authentication context
- Update user management permissions

### Step 3: Test Both Issues
- Verify images work
- Verify package flows work correctly

## Expected Outcome
1. ✅ Product images display correctly in cashier dashboard
2. ✅ Basic package (900) works as standalone cashier system
3. ✅ Ultra package (1600) requires admin setup before cashiers
4. ✅ Smooth authentication flow for both package types
5. ✅ Clear separation between package capabilities

## Files to Modify
- `src/pages/cashier/CashierPOS.jsx` - Add image display
- `src/pages/admin/Inventory.jsx` - Add image column
- `src/pages/Subscription.jsx` - Update package flows
- `src/pages/Auth.jsx` - Handle new authentication flows
- `src/context/AuthContext.jsx` - Update role assignment
- `src/pages/admin/UserManagement.jsx` - Ensure permissions work

## Testing Requirements
1. Add product with image in admin
2. Verify image displays in cashier POS
3. Test Basic package signup flow
4. Test Ultra package signup flow
5. Test admin adding cashiers for Ultra package
6. Test cashier login for both packages
