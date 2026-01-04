// Test script for localStorage functionality
import { saveData, loadData, resetData } from './src/utils/localStorage.js';

// Test 1: Load default data
console.log('Test 1: Loading default data...');
const products = loadData('products');
console.log('Products loaded:', products.length, 'items');

// Test 2: Save new data
console.log('Test 2: Saving new product...');
const newProduct = {
  id: 3,
  name: 'Test Product',
  cost: 100,
  price: 150,
  quantity: 10,
  unit: 'pcs',
  category: 'raw',
  recipe: null,
  image: '',
  visibleToCashier: true,
  expenseOnly: false
};

saveData('products', [...products, newProduct]);
console.log('Product saved successfully');

// Test 3: Load saved data
console.log('Test 3: Loading saved data...');
const updatedProducts = loadData('products');
console.log('Updated products:', updatedProducts.length, 'items');
console.log('New product found:', updatedProducts.find(p => p.id === 3)?.name);

// Test 4: Reset data
console.log('Test 4: Resetting products data...');
resetData('products');
const resetProducts = loadData('products');
console.log('Products after reset:', resetProducts.length, 'items');

console.log('All localStorage tests completed successfully!');
