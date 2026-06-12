/* ============================================
   App Logic — Admin Panel Controller
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ---- DOM References ----
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Settings form
  const settingsForm = {
    shopName: document.getElementById('settingsShopName'),
    address: document.getElementById('settingsAddress'),
    phone: document.getElementById('settingsPhone'),
    whatsapp: document.getElementById('settingsWhatsapp'),
    email: document.getElementById('settingsEmail'),
    currency: document.getElementById('settingsCurrency'),
    saveBtn: document.getElementById('saveSettingsBtn'),
    resetBtn: document.getElementById('resetDataBtn'),
  };

  // Product form
  const productForm = {
    name: document.getElementById('newProductName'),
    wholesale: document.getElementById('newWholesalePrice'),
    retail: document.getElementById('newRetailPrice'),
    unit: document.getElementById('newProductUnit'),
    addBtn: document.getElementById('addProductBtn'),
  };

  // Display elements
  const productTableBody = document.getElementById('productTableBody');
  const totalProductsEl = document.getElementById('totalProducts');
  const avgWholesaleEl = document.getElementById('avgWholesale');
  const avgRetailEl = document.getElementById('avgRetail');
  const generateBtn = document.getElementById('generatePdfBtn');
  const previewContainer = document.getElementById('pdfPreview');

  // Edit modal
  const editModal = document.getElementById('editModal');
  let editingProductId = null;

  // ---- Tab Navigation ----
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      tabButtons.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // ---- Toast Notifications ----
  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || '✅'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ---- Load Settings Into Form ----
  function loadSettings() {
    const shop = dataManager.getShopSettings();
    settingsForm.shopName.value = shop.shopName;
    settingsForm.address.value = shop.address;
    settingsForm.phone.value = shop.phone;
    settingsForm.whatsapp.value = shop.whatsappNumber;
    settingsForm.email.value = shop.email;
    settingsForm.currency.value = shop.currency;
  }

  // ---- Save Settings ----
  settingsForm.saveBtn.addEventListener('click', () => {
    const updates = {
      shopName: settingsForm.shopName.value.trim(),
      address: settingsForm.address.value.trim(),
      phone: settingsForm.phone.value.trim(),
      whatsappNumber: settingsForm.whatsapp.value.trim(),
      email: settingsForm.email.value.trim(),
      currency: settingsForm.currency.value.trim(),
    };

    if (!updates.shopName) {
      showToast('Shop name is required', 'error');
      return;
    }
    if (!updates.whatsappNumber) {
      showToast('WhatsApp number is required for order submission', 'error');
      return;
    }

    dataManager.updateShopSettings(updates);
    showToast('Shop settings saved successfully!');
    updatePreview();
  });

  // ---- Reset Data ----
  settingsForm.resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset ALL data to defaults? This cannot be undone.')) {
      dataManager.resetAll();
      loadSettings();
      renderProducts();
      updateStats();
      updatePreview();
      showToast('All data has been reset to defaults', 'info');
    }
  });

  // ---- Render Products Table ----
  function renderProducts() {
    const products = dataManager.getProducts();
    
    if (products.length === 0) {
      productTableBody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <div class="icon">📦</div>
              <h3>No Products Yet</h3>
              <p>Add your first product using the form below.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const shop = dataManager.getShopSettings();
    productTableBody.innerHTML = products.map((product, index) => `
      <tr data-id="${product.id}">
        <td><span class="product-number">${index + 1}</span></td>
        <td><span class="product-name">${escapeHtml(product.name)}</span></td>
        <td><span class="product-price">${shop.currency} ${product.wholesalePrice.toLocaleString()}</span></td>
        <td><span class="product-price retail">${shop.currency} ${product.retailPrice.toLocaleString()}</span></td>
        <td><span class="product-unit">${escapeHtml(product.unit)}</span></td>
        <td>
          <div class="product-actions">
            <button class="btn btn-outline btn-icon" onclick="moveProduct(${product.id}, 'up')" title="Move Up">↑</button>
            <button class="btn btn-outline btn-icon" onclick="moveProduct(${product.id}, 'down')" title="Move Down">↓</button>
            <button class="btn btn-primary btn-icon" onclick="editProduct(${product.id})" title="Edit">✏️</button>
            <button class="btn btn-danger btn-icon" onclick="deleteProduct(${product.id})" title="Delete">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // ---- Update Stats ----
  function updateStats() {
    const products = dataManager.getProducts();
    const count = products.length;
    const shop = dataManager.getShopSettings();

    totalProductsEl.textContent = count;

    if (count > 0) {
      const avgW = Math.round(products.reduce((sum, p) => sum + p.wholesalePrice, 0) / count);
      const avgR = Math.round(products.reduce((sum, p) => sum + p.retailPrice, 0) / count);
      avgWholesaleEl.textContent = `${shop.currency} ${avgW.toLocaleString()}`;
      avgRetailEl.textContent = `${shop.currency} ${avgR.toLocaleString()}`;
    } else {
      avgWholesaleEl.textContent = `${shop.currency} 0`;
      avgRetailEl.textContent = `${shop.currency} 0`;
    }
  }

  // ---- Add Product ----
  productForm.addBtn.addEventListener('click', () => {
    const name = productForm.name.value.trim();
    const wholesale = parseFloat(productForm.wholesale.value);
    const retail = parseFloat(productForm.retail.value);
    const unit = productForm.unit.value.trim() || 'Pcs';

    if (!name) {
      showToast('Product name is required', 'error');
      productForm.name.focus();
      return;
    }
    if (isNaN(wholesale) || wholesale < 0) {
      showToast('Please enter a valid wholesale price', 'error');
      productForm.wholesale.focus();
      return;
    }
    if (isNaN(retail) || retail < 0) {
      showToast('Please enter a valid retail price', 'error');
      productForm.retail.focus();
      return;
    }

    dataManager.addProduct(name, wholesale, retail, unit);
    
    // Clear form
    productForm.name.value = '';
    productForm.wholesale.value = '';
    productForm.retail.value = '';
    productForm.unit.value = '';
    productForm.name.focus();

    renderProducts();
    updateStats();
    updatePreview();
    showToast(`"${name}" added successfully!`);
  });

  // Allow Enter key to add product
  [productForm.name, productForm.wholesale, productForm.retail, productForm.unit].forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        productForm.addBtn.click();
      }
    });
  });

  // ---- Edit Product (Global Function) ----
  window.editProduct = function (id) {
    const product = dataManager.getProduct(id);
    if (!product) return;

    editingProductId = id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editWholesalePrice').value = product.wholesalePrice;
    document.getElementById('editRetailPrice').value = product.retailPrice;
    document.getElementById('editProductUnit').value = product.unit;

    editModal.classList.remove('hidden');
  };

  // Save Edit
  document.getElementById('saveEditBtn').addEventListener('click', () => {
    if (editingProductId === null) return;

    const updates = {
      name: document.getElementById('editProductName').value.trim(),
      wholesalePrice: parseFloat(document.getElementById('editWholesalePrice').value),
      retailPrice: parseFloat(document.getElementById('editRetailPrice').value),
      unit: document.getElementById('editProductUnit').value.trim(),
    };

    if (!updates.name) {
      showToast('Product name is required', 'error');
      return;
    }

    dataManager.updateProduct(editingProductId, updates);
    editModal.classList.add('hidden');
    editingProductId = null;

    renderProducts();
    updateStats();
    updatePreview();
    showToast('Product updated successfully!');
  });

  // Cancel Edit
  document.getElementById('cancelEditBtn').addEventListener('click', () => {
    editModal.classList.add('hidden');
    editingProductId = null;
  });

  // Close modal on overlay click
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
      editModal.classList.add('hidden');
      editingProductId = null;
    }
  });

  // ---- Delete Product (Global Function) ----
  window.deleteProduct = function (id) {
    const product = dataManager.getProduct(id);
    if (!product) return;

    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      dataManager.deleteProduct(id);
      renderProducts();
      updateStats();
      updatePreview();
      showToast(`"${product.name}" deleted`, 'info');
    }
  };

  // ---- Move Product (Global Function) ----
  window.moveProduct = function (id, direction) {
    dataManager.moveProduct(id, direction);
    renderProducts();
    updatePreview();
  };

  // ---- Update PDF Preview ----
  function updatePreview() {
    const shop = dataManager.getShopSettings();
    const products = dataManager.getProducts();

    const previewRows = products.slice(0, 8).map((p, i) => `
      <tr>
        <td style="color:#94a3b8;font-size:0.65rem;width:5%;">${i + 1}</td>
        <td style="font-weight:600;font-size:0.7rem;width:35%;">${escapeHtml(p.name)}</td>
        <td style="color:#16a34a;font-weight:700;font-size:0.75rem;width:15%;">${shop.currency} ${p.wholesalePrice.toLocaleString()}</td>
        <td style="color:#94a3b8;font-size:0.65rem;text-decoration:line-through;width:15%;">${shop.currency} ${p.retailPrice.toLocaleString()}</td>
        <td style="color:#94a3b8;font-size:0.65rem;width:10%;">${escapeHtml(p.unit)}</td>
        <td style="width:20%;text-align:center;">
          <div style="display:inline-flex;align-items:center;gap:3px;justify-content:center;vertical-align:middle;">
            <span style="border:1px solid #6366f1;background:#f1f5f9;color:#6366f1;width:16px;height:16px;display:flex;align-items:center;justify-content:center;border-radius:2px;font-size:10px;font-weight:bold;cursor:default;user-select:none;">-</span>
            <span style="border:1px solid #6366f1;background:#fff;width:26px;height:16px;display:inline-flex;align-items:center;justify-content:center;border-radius:2px;font-size:9px;font-weight:600;color:#1a1a2e;user-select:none;">0</span>
            <span style="border:1px solid #6366f1;background:#f1f5f9;color:#6366f1;width:16px;height:16px;display:flex;align-items:center;justify-content:center;border-radius:2px;font-size:10px;font-weight:bold;cursor:default;user-select:none;">+</span>
          </div>
        </td>
      </tr>
    `).join('');

    const moreText = products.length > 8
      ? `<p style="text-align:center;color:#94a3b8;font-size:0.65rem;padding:8px 0;">... and ${products.length - 8} more products</p>`
      : '';

    previewContainer.innerHTML = `
      <div class="pdf-preview">
        <div class="pdf-preview-header">
          <h2>${escapeHtml(shop.shopName)}</h2>
          <p>Product Catalog & Order Form</p>
        </div>
        <table class="pdf-preview-table">
          <thead>
            <tr>
              <th style="width:5%;">#</th>
              <th style="width:35%;">Product</th>
              <th style="width:15%;">Wholesale</th>
              <th style="width:15%;">Retail</th>
              <th style="width:10%;">Unit</th>
              <th style="width:20%;">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${previewRows || '<tr><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">No products added</td></tr>'}
          </tbody>
        </table>
        ${moreText}
        
        <div style="margin: 12px 0 8px; text-align: left;">
          <label style="font-size: 0.65rem; font-weight: 700; color: #1a1a2e; display: block; margin-bottom: 2px;">Special Instructions / Order Notes (Optional):</label>
          <textarea style="width: 100%; height: 35px; border: 1px solid #6366f1; border-radius: 4px; background: #fff; font-size: 0.65rem; padding: 6px; box-sizing: border-box; resize: none; color: #64748b;" placeholder="e.g. Please deliver after 5 PM..." disabled></textarea>
        </div>

        <div style="text-align:center;padding:8px 0;">
          <div style="display:inline-block;background:#25D366;border:1px solid #128C7E;color:#fff;padding:8px 20px;border-radius:6px;font-size:0.75rem;font-weight:700;box-shadow: 0 2px 6px rgba(37,211,102,0.25);">
            Send Order via WhatsApp
          </div>
        </div>
        <div class="pdf-preview-footer">
          <p>📍 ${escapeHtml(shop.address)} | 📞 ${escapeHtml(shop.phone)}</p>
          <p style="margin-top:8px;font-size:0.65rem;font-weight:600;color:#a855f7;">Designed & Maintained by Shayan | 03082135452</p>
        </div>
      </div>
    `;
  }

  // ---- Generate Web Catalog ----
  generateBtn.addEventListener('click', async () => {
    const shop = dataManager.getShopSettings();
    const products = dataManager.getProducts();

    if (products.length === 0) {
      showToast('Please add at least one product before generating the Web Catalog', 'error');
      return;
    }

    if (!shop.whatsappNumber) {
      showToast('Please set your WhatsApp number in Settings first', 'error');
      return;
    }

    // Show loading state
    const originalText = generateBtn.innerHTML;
    generateBtn.innerHTML = '<span class="spinner"></span> Exporting HTML...';
    generateBtn.disabled = true;

    try {
      // Small timeout to allow UI to update to loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const htmlString = generateWebCatalog(shop, products);
      const safeShopName = shop.shopName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      const filename = `${safeShopName}_Catalog.html`;
      
      downloadHTML(htmlString, filename);
      showToast(`Web catalog exported successfully! (${products.length} products)`);
    } catch (error) {
      console.error('HTML generation failed:', error);
      showToast('Failed to generate Web Catalog. See console for details.', 'error');
    } finally {
      generateBtn.innerHTML = originalText;
      generateBtn.disabled = false;
    }
  });

  // ---- Helper: Download HTML ----
  function downloadHTML(htmlString, filename) {
    const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'catalog.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ---- Helper: Escape HTML ----
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Make escapeHtml available globally for inline handlers
  window.escapeHtml = escapeHtml;

  // ---- HTML Catalog Import Logic ----
  const importHtmlFileInput = document.getElementById('importHtmlFile');
  if (importHtmlFileInput) {
    importHtmlFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const htmlContent = event.target.result;
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlContent, 'text/html');

          let newShopData = null;
          let newProducts = [];

          // Pass 1: Try to find embedded JSON data (New Catalogs)
          const embeddedScript = doc.getElementById('catalogData');
          if (embeddedScript) {
            const data = JSON.parse(embeddedScript.textContent);
            newShopData = data.shopData;
            newProducts = data.products;
          } 
          // Pass 2: Fallback to DOM Parsing (Legacy Catalogs)
          else {
            newShopData = dataManager.getShopSettings(); // Keep existing as base
            const headerH1 = doc.querySelector('.header h1');
            if (headerH1) {
              newShopData.shopName = headerH1.textContent.trim();
            }
            
            const productCards = doc.querySelectorAll('.product-card');
            productCards.forEach((card, index) => {
              const name = card.querySelector('.product-name')?.textContent.trim();
              
              let wholesalePrice = 0;
              let retailPrice = 0;
              
              const priceEls = card.querySelectorAll('.price');
              priceEls.forEach(el => {
                const numStr = el.textContent.replace(/[^0-9.]/g, '');
                if (!numStr) return;
                const num = parseFloat(numStr);
                
                // Determine which price it is based on class
                if (el.className.includes('wholesale')) {
                  wholesalePrice = num;
                } else if (el.className.includes('retail')) {
                  retailPrice = num;
                }
              });

              let unitText = card.querySelector('.product-unit')?.textContent.trim() || '';
              if (unitText.toLowerCase().startsWith('unit: ')) {
                unitText = unitText.substring(6).trim();
              }

              if (name) {
                newProducts.push({
                  id: Date.now() + index, // Generate new IDs
                  name,
                  wholesalePrice: isNaN(wholesalePrice) ? 0 : wholesalePrice,
                  retailPrice: isNaN(retailPrice) ? 0 : retailPrice,
                  unit: unitText
                });
              }
            });
          }

          // Save extracted data
          if (newShopData) dataManager.updateShopSettings(newShopData);
          if (newProducts.length > 0) {
             dataManager.setProducts(newProducts);
          } else if (!embeddedScript) {
             throw new Error("No products found in legacy HTML.");
          }

          showToast(`Successfully imported ${newProducts.length} products!`);
          
          // Refresh UI
          loadSettings();
          renderProducts();
          updateStats();
          updatePreview();
          
        } catch (error) {
          console.error("Import failed:", error);
          showToast("Failed to parse the catalog file.", "error");
        }
        
        importHtmlFileInput.value = ""; // Reset
      };
      reader.readAsText(file);
    });
  }

  // ---- Initialize ----
  loadSettings();
  renderProducts();
  updateStats();
  updatePreview();
});
