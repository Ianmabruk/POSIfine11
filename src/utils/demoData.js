// Demo data for offline/fallback mode
export const demoProducts = [
  {
    id: 1,
    name: 'Coffee Beans',
    price: 1200,
    quantity: 50,
    unit: 'kg',
    category: 'beverages',
    code: 'CB001'
  },
  {
    id: 2,
    name: 'Sugar',
    price: 150,
    quantity: 100,
    unit: 'kg',
    category: 'ingredients',
    code: 'SG001'
  },
  {
    id: 3,
    name: 'Milk',
    price: 80,
    quantity: 25,
    unit: 'L',
    category: 'dairy',
    code: 'MK001'
  }
];

export const demoSales = [
  {
    id: 1,
    total: 2500,
    paymentMethod: 'cash',
    items: [{ productId: 1, quantity: 2, price: 1200 }],
    createdAt: new Date().toISOString()
  }
];

export const demoStats = {
  dailySales: 2500,
  weeklySales: 15000,
  totalSales: 50000
};