// Local data storage utilities with fallback to JSON structure


// Default sample data for initialization
const DEFAULT_DATA = {
  products: [
    {
      id: 1,
      name: "Nile Perch",
      cost: 500,
      price: 800,
      quantity: 10,
      unit: "kg",
      category: "raw",
      recipe: null,
      image: "",
      visibleToCashier: true,
      expenseOnly: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "Cooking Oil",
      cost: 200,
      price: 300,
      quantity: 5,
      unit: "L",
      category: "raw",
      recipe: null,
      image: "",
      visibleToCashier: true,
      expenseOnly: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      name: "Fresh Tomatoes",
      cost: 150,
      price: 250,
      quantity: 20,
      unit: "kg",
      category: "raw",
      recipe: null,
      image: "",
      visibleToCashier: true,
      expenseOnly: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      name: "Onions",
      cost: 80,
      price: 120,
      quantity: 30,
      unit: "kg",
      category: "raw",
      recipe: null,
      image: "",
      visibleToCashier: true,
      expenseOnly: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 5,
      name: "Grilled Fish Meal",
      cost: 300,
      price: 600,
      quantity: 50,
      unit: "pcs",
      category: "finished",
      recipe: [
        { productId: 1, quantity: 0.5 },
        { productId: 3, quantity: 0.2 },
        { productId: 4, quantity: 0.1 }
      ],
      image: "",
      visibleToCashier: true,
      expenseOnly: false,
      createdAt: new Date().toISOString()
    }
  ],
  sales: [],
  expenses: [],
  users: [],
  reminders: [],
  stats: {
    totalSales: 0,
    totalExpenses: 0,
    profit: 0,
    grossProfit: 0,
    netProfit: 0,
    totalCOGS: 0,
    dailySales: 0,
    weeklySales: 0,
    productCount: 2
  },
  settings: {
    lockTimeout: 300000,
    currency: 'KSH',
    logo: '',
    companyName: '',
    address: ''
  },
  serviceFees: [],
  discounts: [],
  creditRequests: [],
  timeEntries: [],
  categories: [],
  batches: [],
  production: [],
  priceHistory: []
};

/**
 * Save data to localStorage with JSON fallback
 * @param {string} key - The storage key
 * @param {any} value - The data to store
 */
export const saveData = (key, value) => {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.warn(`Failed to save to localStorage for key "${key}":`, error);
    // Fallback to in-memory storage or file-based storage could be implemented here
    // For now, we'll just log the error
  }
};

/**
 * Load data from localStorage with fallback to default data
 * @param {string} key - The storage key
 * @returns {any} The stored data or default data
 */
export const loadData = (key) => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      // Initialize with default data if not exists
      const defaultValue = DEFAULT_DATA[key] || [];
      saveData(key, defaultValue);
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (error) {
    console.warn(`Failed to load from localStorage for key "${key}":`, error);
    // Return default data as fallback
    return DEFAULT_DATA[key] || [];
  }
};

/**
 * Reset data for a specific key to default values
 * @param {string} key - The storage key to reset
 */
export const resetData = (key) => {
  try {
    const defaultValue = DEFAULT_DATA[key] || [];
    saveData(key, defaultValue);
  } catch (error) {
    console.warn(`Failed to reset data for key "${key}":`, error);
  }
};


/**
 * Clear all stored data
 */
export const clearAllData = () => {
  try {
    Object.keys(DEFAULT_DATA).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('Failed to clear all data:', error);
  }
};

/**
 * Sync localStorage data across tabs/windows
 */
export const setupCrossTabSync = () => {
  const handleStorageChange = (e) => {
    if (e.key && Object.keys(DEFAULT_DATA).includes(e.key)) {
      console.log(`Data changed in another tab: ${e.key}`);
      // Trigger custom event for components to reload data
      window.dispatchEvent(new CustomEvent('localStorageDataChanged', {
        detail: { key: e.key }
      }));
    }
  };

  window.addEventListener('storage', handleStorageChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

/**
 * Get data with synchronization check
 * @param {string} key - The storage key
 * @returns {any} The stored data or default data
 */
export const getDataWithSync = (key) => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      const defaultValue = DEFAULT_DATA[key] || [];
      saveData(key, defaultValue);
      return defaultValue;
    }
    const data = JSON.parse(item);
    
    // For products, ensure all have proper visibility flags
    if (key === 'products' && Array.isArray(data)) {
      const normalizedProducts = data.map(product => ({
        ...product,
        visibleToCashier: product.visibleToCashier !== false && !product.expenseOnly,
        expenseOnly: product.expenseOnly || false,
        createdAt: product.createdAt || new Date().toISOString()
      }));
      return normalizedProducts;
    }
    
    return data;
  } catch (error) {
    console.warn(`Failed to load from localStorage for key "${key}":`, error);
    return DEFAULT_DATA[key] || [];
  }
};

/**
 * Force refresh data in localStorage to ensure consistency
 * @param {string} key - The storage key to refresh
 */
export const refreshData = (key) => {
  try {
    const currentData = loadData(key);
    saveData(key, currentData);
    console.log(`Data refreshed for key: ${key}`);
  } catch (error) {
    console.warn(`Failed to refresh data for key "${key}":`, error);
  }
};

/**
 * Initialize localStorage with proper data structure
 */
export const initializeStorage = () => {
  try {
    Object.keys(DEFAULT_DATA).forEach(key => {
      if (!localStorage.getItem(key)) {
        saveData(key, DEFAULT_DATA[key]);
        console.log(`Initialized localStorage with default data for key: ${key}`);
      }
    });
  } catch (error) {
    console.warn('Failed to initialize localStorage:', error);
  }
};
