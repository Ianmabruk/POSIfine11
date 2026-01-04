# Currency, Discount Display & Live View Implementation Plan

## Issues Identified:
1. **Currency Issue**: ProductCard.jsx shows `$` instead of `KSH` for prices
2. **Missing Discount Display**: No dedicated area in cashier dashboard to view active discounts
3. **Missing Live View**: Admin cannot see live activities of cashiers

## Implementation Plan:

### 1. Currency Fix (KSH Only)
- [ ] Update ProductCard.jsx to display prices in KSH format
- [ ] Ensure all price displays consistently use KSH
- [ ] Remove any remaining dollar symbols

### 2. Add Discount Display Area in Cashier Dashboard
- [ ] Create discount display section in CashierPOS.jsx
- [ ] Add discount information to cart sidebar
- [ ] Show active discounts prominently
- [ ] Include discount calculations in totals

### 3. Live View Feature for Admin
- [ ] Add "Live View" button in UserManagement.jsx for each cashier
- [ ] Create live monitoring component
- [ ] Implement real-time updates using WebSocket or polling
- [ ] Show current cashier activities (current sale, products being added, etc.)
- [ ] Add session tracking for active cashiers

### 4. Backend Support for Live View
- [ ] Add endpoint to track active cashier sessions
- [ ] Implement real-time activity broadcasting
- [ ] Store current cart/session state for live viewing

## Files to be Modified:
1. `/src/components/ProductCard.jsx` - Currency fix
2. `/src/pages/cashier/CashierPOS.jsx` - Add discount display
3. `/src/pages/admin/UserManagement.jsx` - Add live view feature
4. Backend API updates for live monitoring

## Expected Outcome:
- All prices display in KSH only
- Clear discount information in cashier dashboard
- Admin can monitor cashier activities in real-time
