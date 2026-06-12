/**
 * Generates an interactive Web Catalog (HTML string)
 */
function generateWebCatalog(shopData, products) {
  // Build the product rows
  const productRowsHTML = products.map((p, i) => {
    return `
      <div class="product-card" id="product-${i}">
        <div class="product-info">
          <div class="product-name">${escapeHtml(p.name)}</div>
          <div class="product-prices">
            <span class="price wholesale-main">${escapeHtml(shopData.currency)} ${p.wholesalePrice.toLocaleString()}</span>
            <span class="price retail-crossed">${escapeHtml(shopData.currency)} ${p.retailPrice.toLocaleString()}</span>
          </div>
          <div class="product-unit">Unit: ${escapeHtml(p.unit)}</div>
        </div>
        <div class="qty-control">
          <button type="button" class="qty-btn" onclick="updateQty(${i}, -1)">-</button>
          <input type="number" id="qty_${i}" class="qty-input" value="0" min="0" onchange="calculateTotal()" />
          <button type="button" class="qty-btn" onclick="updateQty(${i}, 1)">+</button>
        </div>
      </div>
    `;
  }).join('');

  // Serialize the product data for the embedded JS
  const productsJSON = JSON.stringify(products.map((p, i) => ({
    idx: i,
    name: p.name,
    price: p.wholesalePrice,
    priceStr: `${shopData.currency} ${p.wholesalePrice.toLocaleString()}`
  })));

  // Generate the complete HTML string
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(shopData.shopName)} - Order Catalog</title>
  <style>
    :root {
      --primary: #0f172a; /* Sleek Dark Indigo/Slate for premium feel */
      --primary-light: #334155;
      --bg: #f3f4f6; /* Soft elegant gray background */
      --card-bg: #ffffff; /* Pure white cards */
      --text: #111827; /* Near black for high contrast */
      --text-muted: #6b7280; /* Soft gray for secondary text */
      --border: #e5e7eb; /* Very subtle borders */
      --whatsapp: #22c55e;
      --whatsapp-dark: #16a34a;
      --glass-bg: rgba(255, 255, 255, 0.85);
    }
    body {
      font-family: 'Inter', 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 0;
      padding-bottom: 120px;
      -webkit-font-smoothing: antialiased;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      padding: 28px 20px;
      text-align: center;
      position: sticky;
      top: 0;
      z-index: 10;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .header h1 {
      margin: 0 0 6px 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .header p {
      margin: 0;
      font-size: 13px;
      font-weight: 500;
      color: #cbd5e1;
      letter-spacing: 0.02em;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px 16px;
    }
    .product-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .product-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s;
    }
    .product-card:active {
      transform: scale(0.98);
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .product-info {
      flex: 1;
      padding-right: 12px;
    }
    .product-name {
      font-weight: 700;
      font-size: 16px;
      color: var(--text);
      margin-bottom: 6px;
      letter-spacing: -0.01em;
      line-height: 1.3;
    }
    .product-prices {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 4px;
    }
    .price.wholesale-main {
      color: #059669; /* Elegant Emerald */
      font-weight: 800;
      font-size: 18px;
    }
    .price.retail-crossed {
      color: #9ca3af;
      font-size: 13px;
      font-weight: 500;
      text-decoration: line-through;
    }
    .product-unit {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 600;
      background: #f1f5f9;
      padding: 3px 8px;
      border-radius: 6px;
      display: inline-block;
      margin-top: 4px;
    }
    .qty-control {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #f8fafc;
      padding: 6px;
      border-radius: 12px;
      border: 1px solid var(--border);
    }
    .qty-btn {
      background: #ffffff;
      border: 1px solid var(--border);
      width: 34px;
      height: 34px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 600;
      color: var(--primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .qty-btn:active {
      background: #f1f5f9;
    }
    .qty-input {
      width: 36px;
      text-align: center;
      font-size: 16px;
      font-weight: 700;
      border: none;
      background: transparent;
      padding: 0;
      color: var(--text);
    }
    .qty-input:focus {
      outline: none;
    }
    /* Hide number arrows */
    input[type=number]::-webkit-inner-spin-button, 
    input[type=number]::-webkit-outer-spin-button { 
      -webkit-appearance: none; 
      margin: 0; 
    }
    
    .notes-section {
      margin-top: 24px;
      background: var(--card-bg);
      padding: 20px;
      border-radius: 16px;
      border: 1px solid var(--border);
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    }
    .notes-section label {
      display: block;
      font-weight: 700;
      margin-bottom: 10px;
      font-size: 14px;
      color: var(--text);
    }
    .notes-input {
      width: 100%;
      box-sizing: border-box;
      background: #f8fafc;
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px;
      font-size: 15px;
      font-family: inherit;
      resize: vertical;
      min-height: 80px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .notes-input:focus {
      outline: none;
      border-color: #3b82f6;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
    
    .footer-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--glass-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      padding: 16px;
      border-top: 1px solid rgba(229, 231, 235, 0.8);
      z-index: 20;
    }
    .footer-container {
      max-width: 600px;
      margin: 0 auto;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 800;
      color: var(--text);
    }
    .btn-whatsapp {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      background: linear-gradient(135deg, var(--whatsapp) 0%, var(--whatsapp-dark) 100%);
      color: white;
      text-align: center;
      padding: 16px;
      border-radius: 12px;
      font-size: 17px;
      font-weight: 800;
      text-decoration: none;
      border: none;
      cursor: pointer;
      box-sizing: border-box;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn-whatsapp:active {
      transform: scale(0.98);
      box-shadow: 0 2px 6px rgba(34, 197, 94, 0.2);
    }
    .btn-whatsapp:disabled {
      background: #94a3b8;
      box-shadow: none;
      cursor: not-allowed;
      transform: none;
    }
    .developer-credit {
      text-align: center;
      margin-top: 32px;
      padding-bottom: 24px;
      font-size: 13px;
      font-weight: 700;
      color: #6366f1; /* Professional Indigo */
      letter-spacing: 0.02em;
    }
    .search-container {
      margin-bottom: 20px;
    }
    .search-input {
      width: 100%;
      box-sizing: border-box;
      background: #ffffff;
      color: var(--text);
      border: 1px solid #d1d5db;
      border-radius: 14px;
      padding: 14px 18px;
      font-size: 16px;
      font-family: inherit;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
      transition: all 0.2s ease;
    }
    .search-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
  </style>
</head>
<body>

  <header class="header">
    <h1>${escapeHtml(shopData.shopName)}</h1>
    <p>📍 ${escapeHtml(shopData.address)} | 📞 ${escapeHtml(shopData.phone)}</p>
  </header>

  <div class="container">
    <div class="search-container">
      <input type="text" id="searchInput" class="search-input" placeholder="🔍 Search products..." onkeyup="searchProducts()" />
    </div>

    <div class="product-list">
      ${productRowsHTML}
    </div>

    <div class="notes-section">
      <label for="orderNotes">Special Instructions / Order Notes (Optional)</label>
      <textarea id="orderNotes" class="notes-input" placeholder="e.g. Please deliver after 5 PM..."></textarea>
    </div>
    
    <div class="price-warning-note" style="color: #ef4444; font-size: 13px; font-weight: 600; text-align: center; margin-top: 16px; padding: 0 16px;">
      ⚠️ Note: Prices may fluctuate up or down depending on market rates without prior notice.
    </div> 
    <div class="price-warning-note" style="color: #ef4444; font-size: 13px; font-weight: 600; text-align: center; margin-top: 16px; padding: 0 16px;">
      ⚠️ نوٹ: اشیاء کی قیمتیں مارکیٹ ریٹ کے مطابق کم یا زیادہ ہو سکتی ہیں، اور ان میں بغیر پیشگی اطلاع کے تبدیلی کی جا سکتی ہے۔
    </div>
    
    <div class="developer-credit">
      Designed & Maintained by Shayan | 03082135452
    </div>
  </div>

  <div class="footer-bar">
    <div class="footer-container">
      <div class="summary-row">
        <span style="color: var(--text-muted); font-weight: 600;">Total Items: <span id="totalItems" style="color: var(--text); font-weight: 800;">0</span></span>
        <span>${escapeHtml(shopData.currency)} <span id="totalAmount">0</span></span>
      </div>
      <button type="button" id="sendBtn" class="btn-whatsapp" onclick="sendOrder()" disabled>
        <span>Send Order via WhatsApp</span>
      </button>
    </div>
  </div>

  <script>
    const productsData = ${productsJSON};
    const shopName = ${JSON.stringify(shopData.shopName)};
    const whatsappNumber = ${JSON.stringify(shopData.whatsappNumber)};
    const currency = ${JSON.stringify(shopData.currency)};

    function searchProducts() {
      const input = document.getElementById('searchInput');
      const filter = input.value.toLowerCase();
      
      productsData.forEach(p => {
        const card = document.getElementById('product-' + p.idx);
        if (card) {
          if (p.name.toLowerCase().includes(filter)) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        }
      });
    }

    function updateQty(idx, change) {
      const input = document.getElementById('qty_' + idx);
      let current = parseInt(input.value) || 0;
      current += change;
      if (current < 0) current = 0;
      input.value = current;
      calculateTotal();
    }

    function calculateTotal() {
      let totalItems = 0;
      let totalAmount = 0;
      
      productsData.forEach(p => {
        const qty = parseInt(document.getElementById('qty_' + p.idx).value) || 0;
        totalItems += qty;
        totalAmount += (qty * p.price);
      });

      document.getElementById('totalItems').innerText = totalItems;
      document.getElementById('totalAmount').innerText = totalAmount.toLocaleString();
      
      const sendBtn = document.getElementById('sendBtn');
      if (totalItems > 0) {
        sendBtn.disabled = false;
        sendBtn.innerText = 'Send Order via WhatsApp';
      } else {
        sendBtn.disabled = true;
        sendBtn.innerText = 'Select products to order';
      }
    }

    function sendOrder() {
      let hasOrder = false;
      let totalItems = 0;
      let totalAmount = 0;
      
      let msg = "*NEW ORDER*\\n";
      msg += "Shop: *" + shopName + "*\\n\\n";
      
      // Use monospace markdown block for tabular data
      msg += "\`\`\`\\n";
      msg += "Item                 | Qty | Price\\n";
      msg += "--------------------------------------\\n";

      productsData.forEach(p => {
        const qty = parseInt(document.getElementById('qty_' + p.idx).value) || 0;
        if (qty > 0) {
          // Truncate name to 20 chars, pad to 20
          let name = p.name;
          if (name.length > 20) { name = name.substring(0, 17) + "..."; }
          name = name.padEnd(20, ' ');
          
          let qtyStr = String(qty).padEnd(3, ' ');
          
          msg += name + " | " + qtyStr + " | " + p.priceStr + "\\n";
          
          hasOrder = true;
          totalItems += qty;
          totalAmount += (qty * p.price);
        }
      });

      if (!hasOrder) return;

      msg += "--------------------------------------\\n";
      msg += "Total Items : " + totalItems + "\\n";
      msg += "Total Amount: " + currency + " " + totalAmount.toLocaleString() + "\\n";
      msg += "\`\`\`\\n";

      const notes = document.getElementById('orderNotes').value.trim();
      if (notes) {
        msg += "\\n*Notes:*\\n_" + notes + "_\\n";
      }

      msg += "\\nPlease confirm availability. Thank you!";

      const encodedMsg = encodeURIComponent(msg);
      const url = "https://wa.me/" + whatsappNumber + "?text=" + encodedMsg;
      
      window.open(url, '_blank');
    }

    // Initialize totals
    calculateTotal();
  </script>
  
  <!-- Hidden data block for seamless Admin Panel imports -->
  <script id="catalogData" type="application/json">
    ${JSON.stringify({ shopData, products })}
  </script>
</body>
</html>`;
}

// Utility function to escape HTML strings inside the generated code
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
