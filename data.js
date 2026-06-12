/* ============================================
   Data Management — localStorage CRUD
   ============================================ */

const STORAGE_KEY = 'pdfCatalog_data';

// Default shop configuration
const DEFAULT_SHOP_DATA = {
  shopName: 'My Retail Shop',
  address: 'Shop #1, Main Market, City',
  phone: '+92 300 1234567',
  whatsappNumber: '923001234567',
  email: 'shop@example.com',
  currency: 'Rs.',
  developerName: 'Shayan',
};

// Default sample products
const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Basmati Rice (5kg)', wholesalePrice: 850, retailPrice: 950, unit: 'Bag' },
  { id: 2, name: 'Sugar (1kg)', wholesalePrice: 140, retailPrice: 160, unit: 'Kg' },
  { id: 3, name: 'Cooking Oil (5L)', wholesalePrice: 2200, retailPrice: 2500, unit: 'Bottle' },
  { id: 4, name: 'Wheat Flour (10kg)', wholesalePrice: 680, retailPrice: 780, unit: 'Bag' },
  { id: 5, name: 'Tea (200g)', wholesalePrice: 350, retailPrice: 400, unit: 'Pack' },
  { id: 6, name: 'Milk Powder (900g)', wholesalePrice: 1800, retailPrice: 2050, unit: 'Pack' },
  { id: 7, name: 'Ghee (1kg)', wholesalePrice: 750, retailPrice: 880, unit: 'Pack' },
  { id: 8, name: 'Lentils/Daal (1kg)', wholesalePrice: 280, retailPrice: 340, unit: 'Kg' },
  { id: 9, name: 'Soap Bar (Pack of 4)', wholesalePrice: 220, retailPrice: 270, unit: 'Pack' },
  { id: 10, name: 'Washing Powder (1kg)', wholesalePrice: 300, retailPrice: 360, unit: 'Pack' },
];

/**
 * ShopDataManager — Handles all data operations with localStorage persistence
 */
class ShopDataManager {
  constructor() {
    this.data = this._load();
  }

  // ---- Private ----

  /** Load data from localStorage or initialize defaults */
  _load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to pick up any new fields
        return {
          shop: { ...DEFAULT_SHOP_DATA, ...parsed.shop },
          products: parsed.products || [...DEFAULT_PRODUCTS],
          nextId: parsed.nextId || DEFAULT_PRODUCTS.length + 1,
        };
      }
    } catch (e) {
      console.warn('Failed to load data from localStorage:', e);
    }
    // First load — use defaults
    return {
      shop: { ...DEFAULT_SHOP_DATA },
      products: [...DEFAULT_PRODUCTS],
      nextId: DEFAULT_PRODUCTS.length + 1,
    };
  }

  /** Save current data to localStorage */
  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save data to localStorage:', e);
    }
  }

  // ---- Shop Settings ----

  /** Get all shop settings */
  getShopSettings() {
    return { ...this.data.shop };
  }

  /** Update shop settings (partial update) */
  updateShopSettings(updates) {
    this.data.shop = { ...this.data.shop, ...updates };
    this._save();
    return this.getShopSettings();
  }

  // ---- Products ----

  /** Get all products */
  getProducts() {
    return [...this.data.products];
  }

  /** Get a single product by ID */
  getProduct(id) {
    return this.data.products.find((p) => p.id === id) || null;
  }

  /** Add a new product */
  addProduct(name, wholesalePrice, retailPrice, unit = 'Pcs') {
    const product = {
      id: this.data.nextId++,
      name: name.trim(),
      wholesalePrice: parseFloat(wholesalePrice) || 0,
      retailPrice: parseFloat(retailPrice) || 0,
      unit: unit.trim() || 'Pcs',
    };
    this.data.products.push(product);
    this._save();
    return product;
  }

  /** Update an existing product */
  updateProduct(id, updates) {
    const index = this.data.products.findIndex((p) => p.id === id);
    if (index === -1) return null;

    // Sanitize numeric fields
    if (updates.wholesalePrice !== undefined) {
      updates.wholesalePrice = parseFloat(updates.wholesalePrice) || 0;
    }
    if (updates.retailPrice !== undefined) {
      updates.retailPrice = parseFloat(updates.retailPrice) || 0;
    }
    if (updates.name !== undefined) {
      updates.name = updates.name.trim();
    }
    if (updates.unit !== undefined) {
      updates.unit = updates.unit.trim();
    }

    this.data.products[index] = { ...this.data.products[index], ...updates };
    this._save();
    return { ...this.data.products[index] };
  }

  /** Delete a product by ID */
  deleteProduct(id) {
    const index = this.data.products.findIndex((p) => p.id === id);
    if (index === -1) return false;
    this.data.products.splice(index, 1);
    this._save();
    return true;
  }

  /** Move a product up or down in the list */
  moveProduct(id, direction) {
    const index = this.data.products.findIndex((p) => p.id === id);
    if (index === -1) return false;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= this.data.products.length) return false;

    // Swap
    [this.data.products[index], this.data.products[newIndex]] =
      [this.data.products[newIndex], this.data.products[index]];
    this._save();
    return true;
  }

  /** Get total product count */
  getProductCount() {
    return this.data.products.length;
  }

  /** Set all products at once (useful for import) */
  setProducts(products) {
    this.data.products = [...products];
    // Update nextId to avoid conflicts
    const maxId = products.reduce((max, p) => (p.id > max ? p.id : max), 0);
    this.data.nextId = Math.max(this.data.nextId, maxId + 1);
    this._save();
  }

  /** Reset all data to defaults */
  resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = {
      shop: { ...DEFAULT_SHOP_DATA },
      products: [...DEFAULT_PRODUCTS],
      nextId: DEFAULT_PRODUCTS.length + 1,
    };
    this._save();
  }

  /** Export data as JSON string */
  exportData() {
    return JSON.stringify(this.data, null, 2);
  }

  /** Import data from JSON string */
  importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.shop && parsed.products) {
        this.data = parsed;
        this._save();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }
}

// Export a singleton instance
const dataManager = new ShopDataManager();
