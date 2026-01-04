# Integration Guide - Product Photos & Additional Features

## Product Photo Integration

### In Inventory Page (Admin)

Add this to your product form modal:

```jsx
// In the Add/Edit Product Modal
<div>
  <label className="block text-sm font-medium mb-2">Product Photo</label>
  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewProduct({ ...newProduct, photo: reader.result });
        };
        reader.readAsDataURL(file);
      }
    }}
    className="input"
  />
  {newProduct.photo && (
    <img src={newProduct.photo} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
  )}
</div>

<div>
  <label className="block text-sm font-medium mb-2">Product Notes/Features</label>
  <textarea
    className="input"
    rows="3"
    value={newProduct.notes || ''}
    onChange={(e) => setNewProduct({ ...newProduct, notes: e.target.value })}
    placeholder="e.g., fresh, medium size, organic..."
  />
</div>
```

### In CashierPOS (Display Photos)

Update the product card to show photos:

```jsx
<button
  key={product.id}
  onClick={() => addToCart(product)}
  className="card text-left hover:shadow-xl transition-all transform hover:scale-105"
>
  {product.photo && (
    <img 
      src={product.photo} 
      alt={product.name} 
      className="w-full h-32 object-cover rounded-lg mb-2"
    />
  )}
  <h3 className="font-semibold mb-2">{product.name}</h3>
  {product.notes && (
    <p className="text-xs text-gray-500 mb-2">{product.notes}</p>
  )}
  <p className="text-xl font-bold text-green-600">
    KSH {product.price?.toLocaleString()}
  </p>
</button>
```

---

## Discount Integration in CashierPOS

Add discount selector to cart:

```jsx
import DiscountSelector from '../../components/DiscountSelector';

// In your cart section, before checkout
{cart.length > 0 && (
  <div className="mb-4">
    <DiscountSelector 
      originalPrice={subtotal}
      onApply={(discountData) => {
        // Apply discount to cart
        setAppliedDiscount(discountData);
      }}
    />
  </div>
)}
```

---

## Service Fee Integration in CashierPOS

Add service fee selector:

```jsx
import ServiceFeeSelector from '../../components/ServiceFeeSelector';

// In your cart section
{cart.length > 0 && (
  <ServiceFeeSelector 
    onApply={(fees) => {
      setAppliedFees(fees);
    }}
  />
)}

// Update total calculation
const feesTotal = appliedFees.reduce((sum, fee) => sum + fee.amount, 0);
const discountAmount = appliedDiscount ? appliedDiscount.discountAmount : 0;
const finalTotal = subtotal - discountAmount + feesTotal;
```

---

## Credit Request Integration in CashierPOS

Add credit request button to product cards:

```jsx
import CreditRequestForm from '../../components/CreditRequestForm';

const [showCreditForm, setShowCreditForm] = useState(false);
const [selectedProduct, setSelectedProduct] = useState(null);

// Add button to product card
<button
  onClick={(e) => {
    e.stopPropagation();
    setSelectedProduct(product);
    setShowCreditForm(true);
  }}
  className="mt-2 w-full bg-orange-500 text-white py-1 rounded text-sm"
>
  Request Credit
</button>

// Add modal
{showCreditForm && selectedProduct && (
  <CreditRequestForm
    product={selectedProduct}
    onClose={() => setShowCreditForm(false)}
    onSubmit={(request) => {
      alert('Credit request submitted! Waiting for admin approval.');
    }}
  />
)}
```

---

## Price Adjustment Integration in Inventory

Add to product edit section:

```jsx
import PriceAdjustment from '../../components/PriceAdjustment';

// In edit modal or product details
<PriceAdjustment
  product={editingProduct}
  user={user}
  onUpdate={async (updatedProduct) => {
    await productsApi.update(updatedProduct.id, updatedProduct);
    loadProducts();
  }}
/>
```

---

## Screen Lock Integration

Already integrated in AdminDashboard. To add to CashierPOS:

```jsx
import ScreenLock from '../../components/ScreenLock';
import useInactivity from '../../hooks/useInactivity';

function CashierPOS() {
  const [isLocked, unlock] = useInactivity(45000); // 45 seconds
  const [appSettings, setAppSettings] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsApi.get();
      setAppSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  return (
    <>
      {/* Your existing POS UI */}
      
      {/* Screen Lock */}
      {isLocked && (
        <ScreenLock onUnlock={unlock} logo={appSettings.logo} />
      )}
    </>
  );
}
```

---

## Reminder Modal Integration

Already integrated in AdminDashboard. To add to CashierPOS:

```jsx
import ReminderModal from '../../components/ReminderModal';

function CashierPOS() {
  const [showReminderModal, setShowReminderModal] = useState(false);

  useEffect(() => {
    // Show reminder modal on login
    setShowReminderModal(true);
  }, []);

  return (
    <>
      {/* Your existing POS UI */}
      
      {/* Reminder Modal */}
      {showReminderModal && (
        <ReminderModal onClose={() => setShowReminderModal(false)} />
      )}
    </>
  );
}
```

---

## FIFO Batch Management

### Creating New Batch (Admin)

```jsx
import { batches as batchesApi } from '../../services/api';

const createBatch = async (productId, data) => {
  await batchesApi.create({
    productId,
    buyingPrice: data.buyingPrice,
    sellingPrice: data.sellingPrice,
    quantity: data.quantity,
    type: 'new' // or 'old'
  });
};
```

### Viewing Batches

```jsx
const [batches, setBatches] = useState([]);

useEffect(() => {
  loadBatches();
}, [selectedProduct]);

const loadBatches = async () => {
  const data = await batchesApi.getAll(selectedProduct.id);
  setBatches(data);
};

// Display batches
{batches.map(batch => (
  <div key={batch.id} className="card">
    <p>Batch: {batch.batchCode}</p>
    <p>Type: {batch.type}</p>
    <p>Buying: KSH {batch.buyingPrice}</p>
    <p>Selling: KSH {batch.sellingPrice}</p>
    <p>Remaining: {batch.remaining}/{batch.quantity}</p>
  </div>
))}
```

---

## Production Tracking

```jsx
import { production as productionApi } from '../../services/api';

const recordProduction = async () => {
  await productionApi.create({
    sourceProductId: wholefish.id,
    targetProductId: fishfingers.id,
    quantityUsed: 10,
    quantityProduced: 50,
    waste: 1.5
  });
};
```

---

## Auto-Generated Product Codes

```jsx
import { categories as categoriesApi } from '../../services/api';

const generateCode = async (category, prefix) => {
  const result = await categoriesApi.generateCode({
    category,
    prefix
  });
  return result.code; // e.g., "P001"
};

// Usage in product form
const handleCategoryChange = async (category) => {
  const code = await generateCode(category, 'P');
  setNewProduct({ ...newProduct, code, category });
};
```

---

## Profile Picture Display

Update user display sections:

```jsx
// In header or user menu
{user?.profilePicture ? (
  <img 
    src={user.profilePicture} 
    alt={user.name} 
    className="w-10 h-10 rounded-full object-cover"
  />
) : (
  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
    {user?.name?.charAt(0).toUpperCase()}
  </div>
)}
```

---

## Receipt with Service Fees and Discounts

```jsx
const generateReceipt = () => {
  return {
    items: cart,
    subtotal,
    discount: appliedDiscount,
    serviceFees: appliedFees,
    total: finalTotal,
    paymentMethod,
    cashier: user.name,
    cashierPhoto: user.profilePicture,
    timestamp: new Date().toISOString()
  };
};
```

---

## Testing Checklist

- [ ] Upload logo in Settings
- [ ] Upload profile picture in Settings
- [ ] Create reminders and see them on login
- [ ] Try to decrease product price (should fail)
- [ ] Increase product price (should log)
- [ ] Create service fees
- [ ] Create discounts
- [ ] Apply discounts in POS
- [ ] Apply service fees in POS
- [ ] Request credit as cashier
- [ ] Approve/reject credit as admin
- [ ] Upload product photos
- [ ] View product photos in POS
- [ ] Test screen lock (wait 45 seconds)
- [ ] Create batches for FIFO
- [ ] Record production
- [ ] Generate product codes

---

All features are now ready to use! The system maintains your existing UI while seamlessly integrating all new functionality.