# Advanced Features Roadmap

## Phase 1: Core Business Logic (Priority)
1. ✅ Price Adjustments (Increase Only)
2. ✅ Service Fees
3. ✅ Discount Management
4. ✅ Product Photos

## Phase 2: Customer Management
5. ✅ Reminder System
6. ✅ Credit Request System

## Phase 3: Security & UX
7. ✅ Auto Screen Lock (45s)
8. ✅ Profile Pictures
9. ✅ Logo Upload

## Phase 4: Advanced Inventory
10. ✅ FIFO Stock Management (Old + New)
11. ✅ Production Tracking
12. ✅ Auto Product Codes & Barcodes

## Phase 5: Multi-Tenant & Integration
13. ✅ Business Registration per Email
14. ✅ Admin Portal for Feature Management
15. ✅ Company Website Integration

## Implementation Strategy

### Database Schema Updates
```json
{
  "users": {
    "profilePicture": "base64 or URL",
    "pin": "4-digit unlock PIN",
    "businessId": "unique business identifier"
  },
  "businesses": {
    "id": "unique ID",
    "email": "owner email",
    "name": "business name",
    "logo": "base64 or URL",
    "features": ["reminders", "credit", "fifo", "production"],
    "createdAt": "timestamp"
  },
  "products": {
    "photo": "base64 or URL",
    "code": "auto-generated (P001, T001)",
    "barcode": "generated barcode",
    "category": "category name",
    "priceHistory": [
      {"oldPrice": 100, "newPrice": 120, "changedBy": "userId", "timestamp": ""}
    ]
  },
  "stockBatches": {
    "id": "batch ID",
    "productId": "product ID",
    "type": "old/new",
    "buyingPrice": 100,
    "sellingPrice": 150,
    "quantity": 50,
    "remaining": 30,
    "createdAt": "timestamp"
  },
  "reminders": {
    "id": "reminder ID",
    "customerName": "John Doe",
    "productId": "product ID",
    "frequency": "weekly",
    "days": ["Monday", "Thursday"],
    "nextDate": "2024-01-15",
    "status": "pending/fulfilled",
    "createdBy": "admin userId"
  },
  "serviceFees": {
    "id": "fee ID",
    "name": "Delivery Fee",
    "amount": 50,
    "description": "Home delivery",
    "active": true
  },
  "discounts": {
    "id": "discount ID",
    "name": "Weekend Sale",
    "percentage": 10,
    "validFrom": "2024-01-01",
    "validTo": "2024-01-31",
    "active": true
  },
  "creditRequests": {
    "id": "request ID",
    "cashierId": "cashier userId",
    "customerName": "Jane Doe",
    "productId": "product ID",
    "amount": 500,
    "status": "pending/approved/rejected",
    "requestedAt": "timestamp",
    "approvedAt": "timestamp",
    "approvedBy": "admin userId"
  },
  "production": {
    "id": "production ID",
    "sourceProductId": "Tilapia ID",
    "sourceBatchId": "batch ID",
    "quantityUsed": 24,
    "outputProducts": [
      {"productId": "Fish Fingers ID", "quantity": 20, "batchId": "new batch"}
    ],
    "waste": 4,
    "producedBy": "userId",
    "producedAt": "timestamp"
  }
}
```

### API Endpoints Needed

#### Reminders
- POST /api/reminders - Create reminder
- GET /api/reminders - Get all reminders
- GET /api/reminders/today - Get today's reminders
- PUT /api/reminders/:id - Update reminder status
- DELETE /api/reminders/:id - Delete reminder

#### Service Fees
- POST /api/service-fees - Create fee
- GET /api/service-fees - Get all fees
- PUT /api/service-fees/:id - Update fee
- DELETE /api/service-fees/:id - Delete fee

#### Discounts
- POST /api/discounts - Create discount
- GET /api/discounts - Get all discounts
- GET /api/discounts/active - Get active discounts
- PUT /api/discounts/:id - Update discount
- DELETE /api/discounts/:id - Delete discount

#### Credit Requests
- POST /api/credit-requests - Create request
- GET /api/credit-requests - Get all requests
- PUT /api/credit-requests/:id/approve - Approve request
- PUT /api/credit-requests/:id/reject - Reject request

#### Stock Batches
- POST /api/stock-batches - Create batch
- GET /api/stock-batches/:productId - Get product batches
- PUT /api/stock-batches/:id - Update batch

#### Production
- POST /api/production - Record production
- GET /api/production - Get production history
- GET /api/production/:id - Get production details

#### Businesses (Multi-tenant)
- POST /api/businesses/register - Register business
- GET /api/businesses/:id - Get business details
- PUT /api/businesses/:id/features - Update features
- PUT /api/businesses/:id/logo - Upload logo

### Frontend Components Needed

#### Admin Components
- ReminderManager.jsx
- ServiceFeeManager.jsx
- DiscountManager.jsx
- CreditApproval.jsx
- StockBatchManager.jsx
- ProductionTracker.jsx
- LogoUpload.jsx
- BarcodeGenerator.jsx

#### Cashier Components
- ReminderPopup.jsx
- ServiceFeeSelector.jsx
- DiscountApplier.jsx
- CreditRequestForm.jsx
- ProductPhotoUpload.jsx

#### Shared Components
- ScreenLock.jsx
- ProfilePictureUpload.jsx
- PriceAdjustment.jsx
- InactivityDetector.jsx

### Implementation Priority

**Week 1: Core Features**
1. Price increase only validation
2. Service fees system
3. Discount management
4. Product photos

**Week 2: Customer Features**
5. Reminder system
6. Credit requests

**Week 3: Security & UX**
7. Screen lock
8. Profile pictures
9. Logo upload

**Week 4: Advanced Inventory**
10. FIFO stock batches
11. Production tracking
12. Barcode generation

**Week 5: Multi-tenant**
13. Business registration
14. Feature flags
15. Admin portal integration

## Notes
- All features will be mobile responsive
- Use localStorage for offline capability
- Implement proper error handling
- Add loading states and animations
- Follow existing design system
