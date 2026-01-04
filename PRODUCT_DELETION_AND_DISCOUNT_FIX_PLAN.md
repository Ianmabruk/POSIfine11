# Product Deletion and Discount Display Fix Plan

## Issues Identified

### 1. Product Deletion Issue
- Products marked for deletion (with `pendingDelete: true`) are not filtered out from the UI
- The `loadProducts` function doesn't exclude deleted products
- Cashier POS also shows products that should be deleted
- Backend deletion may fail, but UI doesn't reflect the local deletion state

### 2. Discount Display Issue
- Cashier dashboard shows hardcoded/static discounts instead of real discounts from admin
- The `DiscountSelector` component exists but isn't properly integrated
- Admin-created discounts don't appear in the cashier dashboard
- Discount data isn't being fetched and displayed dynamically

## Information Gathered

### Current Product Deletion Flow:
1. User clicks delete button → `handleDelete` function called
2. Calls `productsApi.delete(id)` 
3. API tries to delete from backend, if fails → marks as `pendingDelete: true`
4. Local state updates to filter out the product
5. BUT: `loadProducts` doesn't filter out `pendingDelete: true` products on refresh

### Current Discount Display:
1. Hardcoded discounts: "Customer Loyalty Discount 5%", "Bulk Purchase Discount 10%"
2. Static discount rate of 15% applied to all carts
3. `DiscountSelector` component exists but not used in POS
4. Admin dashboard has discount management but not connected to cashier

## Detailed Code Update Plan

### File 1: `/src/services/api.js`
**Changes needed:**
- Fix `products.delete` function to properly handle local deletion state
- Ensure deleted products are properly marked and filtered

### File 2: `/src/pages/admin/Inventory.jsx`
**Changes needed:**
- Update `loadProducts` to filter out `pendingDelete: true` products
- Improve deletion feedback and state management

### File 3: `/src/pages/cashier/CashierPOS.jsx`
**Changes needed:**
- Filter out deleted products from `productList`
- Replace hardcoded discounts with dynamic discounts from backend
- Integrate proper discount fetching and display
- Update discount display area to show real admin-created discounts

### File 4: `/src/components/DiscountSelector.jsx`
**Changes needed:**
- Update to work with the current API structure
- Ensure proper integration with the POS system

## Dependent Files to be Edited

1. `/src/services/api.js` - Core API deletion logic
2. `/src/pages/admin/Inventory.jsx` - Admin product management
3. `/src/pages/cashier/CashierPOS.jsx` - Cashier interface and discount display
4. `/src/components/DiscountSelector.jsx` - Discount component integration

## Followup Steps

1. **Testing**: Verify product deletion works in both admin and cashier dashboards
2. **Testing**: Verify discounts created in admin dashboard appear in cashier dashboard
3. **Data Verification**: Check that localStorage properly stores deleted products with flags
4. **Integration Testing**: Ensure discount requests and approvals work end-to-end

## Implementation Priority

1. **High Priority**: Fix product deletion filtering in both dashboards
2. **High Priority**: Replace hardcoded discounts with dynamic backend discounts
3. **Medium Priority**: Improve error handling and user feedback
4. **Low Priority**: Add additional discount features and validation

## Success Criteria

1. ✅ Products deleted in admin dashboard disappear immediately from both dashboards
2. ✅ Products deleted in cashier dashboard disappear immediately from both dashboards
3. ✅ Discounts created by admin appear in cashier dashboard within seconds
4. ✅ DiscountSelector component works properly with real discount data
5. ✅ No hardcoded discounts remain in the cashier interface
