# How to Use the Inventory System

## Quick Start Guide

### 1. Adding Raw Materials (Ingredients)

1. Go to **Admin Dashboard** → **Inventory**
2. Click **"Add Product"** button
3. Fill in the form:
   - **Product Name**: e.g., "Nile Perch"
   - **Price**: Selling price (if sold separately)
   - **Cost**: Purchase cost
   - **Quantity**: Amount in stock (e.g., 50)
   - **Unit**: Select unit (pcs, kg, g, L, ml)
   - **Category**: Select "Raw Material"
   - **Visible to Cashier**: Check if cashier can sell this directly
4. Click **"Add Product"**

### 2. Creating Recipes (Composite Products)

1. Go to **Admin Dashboard** → **Recipes/BOM**
2. Click **"Create Recipe"** button
3. Fill in the form:
   - **Product Name**: e.g., "Fish Fingers"
   - **Selling Price**: e.g., 150
   - **Image URL**: (optional) Link to product image
   - **Visible to Cashier**: Check this box

4. **Add Ingredients** (This is the new improved way!):
   - Click **"+ Add Ingredient"**
   - **Type the ingredient name** (e.g., "Nile Perch")
     - Autocomplete will suggest matching ingredients
     - You can type freely - no need to select from dropdown
   - **Enter quantity**: e.g., 0.02 (supports decimals!)
   - **Select unit**: kg, g, L, ml, pcs
   - Repeat for all ingredients

5. Review the **Estimated COGS** and **Profit Margin**
6. Click **"Create Recipe"**

**Example Recipe - Fish Fingers**:
```
Ingredient: Nile Perch     Qty: 0.02   Unit: kg
Ingredient: Cooking Oil    Qty: 0.01   Unit: L
Ingredient: Breadcrumbs    Qty: 0.004  Unit: kg
Ingredient: Salt           Qty: 0.002  Unit: kg
```

### 3. Adding Cashiers

1. Go to **Admin Dashboard** → **Users**
2. Click **"Add Cashier"** button
3. Fill in the form:
   - **Full Name**: e.g., "John Doe"
   - **Email**: e.g., "john@example.com"
   - **Password**: Create a secure password (min 6 characters)
   - **Permissions**: Check boxes for what they can access
4. Click **"Add Cashier"**
5. **IMPORTANT**: An alert will show the login credentials - save them!
6. Share the email and password with the cashier

### 4. Cashier Login

1. Cashier goes to the login page
2. Enters the **email** and **password** provided by admin
3. Clicks **"Login"**
4. Automatically redirected to **Cashier POS**

### 5. Making Sales (Cashier)

1. Cashier logs in to **Cashier POS**
2. Search or browse products
3. Click products to add to cart
4. Adjust quantities using +/- buttons
5. Select payment method (Cash/M-Pesa/Card)
6. Click **"Complete Sale"**
7. **Automatic Stock Deduction**:
   - For simple products: quantity reduced directly
   - For composite products: ingredients automatically deducted

### 6. Viewing Reports (Admin)

1. Go to **Admin Dashboard** → **Dashboard**
2. View:
   - Total Sales
   - Gross Profit
   - Net Profit
   - Product Count
   - Recent Sales
3. All data updates in real-time after each sale

## Important Tips

### Recipe Creation Tips
- ✅ **Type ingredient names freely** - no need to scroll through long dropdowns
- ✅ Use **autocomplete suggestions** to ensure correct spelling
- ✅ Enter **precise quantities** with decimals (e.g., 0.025)
- ✅ Choose correct **units** for each ingredient
- ⚠️ Ingredient names must match existing raw materials (case-insensitive)

### Stock Management Tips
- Always maintain sufficient raw material stock
- Check "Max Units" column in Inventory to see how many composite products you can make
- Low stock items show warning icon (⚠️)
- Expense-only items won't appear in Cashier POS

### User Management Tips
- Save cashier credentials immediately after creation
- You can edit permissions anytime in User Management
- Cashiers can only see products marked "Visible to Cashier"
- Admin has full access to all features

## Common Questions

**Q: Why can't I see my new product in Cashier POS?**
A: Check if "Visible to Cashier" is enabled and it's not marked as "Expense Only"

**Q: Why does my recipe creation fail?**
A: Make sure all ingredient names match existing raw materials in inventory

**Q: Can cashiers create recipes?**
A: No, only admins can create recipes and manage inventory

**Q: What happens when I sell a composite product?**
A: The system automatically deducts the required quantities from raw materials

**Q: Can I change a product price?**
A: Yes, but you can only increase prices, not decrease them (to maintain pricing integrity)

**Q: How do I delete a product?**
A: Click the trash icon in the Inventory page (admin only)

## Troubleshooting

### Cashier Can't Log In
1. Verify email and password are correct
2. Check if user exists in User Management
3. Ensure user is marked as "active"

### Product Not Appearing
1. Check if product was saved successfully
2. Verify "Visible to Cashier" setting
3. Refresh the page

### Recipe Creation Fails
1. Verify all ingredients exist in inventory
2. Check ingredient names match exactly (case-insensitive)
3. Ensure quantities are valid numbers

### Stock Not Deducting
1. Verify backend is running
2. Check browser console for errors
3. Ensure recipe ingredients are properly mapped

## Need Help?

Refer to `INVENTORY_FIXES_SUMMARY.md` for technical details about the system implementation.