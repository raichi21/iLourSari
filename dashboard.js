// Data Manager for handling all data operations with localStorage
class DataManager {
  constructor() {
    this.initializeStorage();
  }

  initializeStorage() {
    // Initialize sample data if not exists
    if (!localStorage.getItem('iLourSari_branches')) {
      const branches = [
        { id: 1, name: 'Main Branch', address: 'Santa Maria', Owner: 'Ms. Lourdes Gunio'},
        { id: 2, name: '2nd Branch', address: 'Santa Maria', Owner: 'Ms. Lourdes Gunio' },
        { id: 3, name: '3rd Branch', address: 'Santa Maria', Owner: 'Ms. Lourdes Gunio' },
      ];
      localStorage.setItem('iLourSari_branches', JSON.stringify(branches));
    }

    if (!localStorage.getItem('iLourSari_products')) {
      const products = [
        { id: 1, name: 'Rice (5kg)', sku: 'RICE-5KG', category: 'grocery', price: 250, reorderPoint: 20 },
        { id: 2, name: 'Coke (500ml)', sku: 'COKE-500', category: 'beverages', price: 25, reorderPoint: 50 },
        { id: 3, name: 'Bread (1pc)', sku: 'BREAD-1PC', category: 'grocery', price: 15, reorderPoint: 30 },
        { id: 4, name: 'Milk (1L)', sku: 'MILK-1L', category: 'beverages', price: 65, reorderPoint: 25 },
        { id: 5, name: 'Soap (bar)', sku: 'SOAP-BAR', category: 'toiletries', price: 12, reorderPoint: 40 },
        { id: 6, name: 'Shampoo (250ml)', sku: 'SHAMPOO-250', category: 'toiletries', price: 85, reorderPoint: 15 },
        { id: 7, name: 'Tissue (1pack)', sku: 'TISSUE-PK', category: 'household', price: 45, reorderPoint: 20 },
        { id: 8, name: 'Coffee (100g)', sku: 'COFFEE-100', category: 'grocery', price: 120, reorderPoint: 10 },
      ];
      localStorage.setItem('iLourSari_products', JSON.stringify(products));
    }

    if (!localStorage.getItem('iLourSari_inventory')) {
      const inventory = {};
      const products = JSON.parse(localStorage.getItem('iLourSari_products'));
      const branches = JSON.parse(localStorage.getItem('iLourSari_branches'));
      
      products.forEach(product => {
        inventory[product.id] = {};
        branches.forEach(branch => {
          inventory[product.id][branch.id] = Math.floor(Math.random() * 100) + 10;
        });
      });
      localStorage.setItem('iLourSari_inventory', JSON.stringify(inventory));
    }

    if (!localStorage.getItem('iLourSari_transactions')) {
      localStorage.setItem('iLourSari_transactions', JSON.stringify([]));
    }

    if (!localStorage.getItem('iLourSari_reservations')) {
      localStorage.setItem('iLourSari_reservations', JSON.stringify([]));
    }

    if (!localStorage.getItem('iLourSari_transactions_history')) {
      localStorage.setItem('iLourSari_transactions_history', JSON.stringify([]));
    }
  }

  // Branch operations
  getBranches() {
    return JSON.parse(localStorage.getItem('iLourSari_branches')) || [];
  }

  getBranchById(id) {
    return this.getBranches().find(b => b.id === parseInt(id));
  }

  // Product operations
  getProducts() {
    return JSON.parse(localStorage.getItem('iLourSari_products')) || [];
  }

  getProductById(id) {
    return this.getProducts().find(p => p.id === parseInt(id));
  }

  addProduct(product) {
    const products = this.getProducts();
    const newProduct = {
      id: Math.max(...products.map(p => p.id), 0) + 1,
      ...product
    };
    products.push(newProduct);
    localStorage.setItem('iLourSari_products', JSON.stringify(products));

    // Initialize inventory for new product
    const inventory = JSON.parse(localStorage.getItem('iLourSari_inventory'));
    const branches = this.getBranches();
    inventory[newProduct.id] = {};
    branches.forEach(branch => {
      inventory[newProduct.id][branch.id] = 0;
    });
    localStorage.setItem('iLourSari_inventory', JSON.stringify(inventory));

    return newProduct;
  }

  updateProduct(id, updates) {
    const products = this.getProducts();
    const product = products.find(p => p.id === parseInt(id));
    if (product) {
      Object.assign(product, updates);
      localStorage.setItem('iLourSari_products', JSON.stringify(products));
    }
    return product;
  }

  // Inventory operations
  getInventory() {
    return JSON.parse(localStorage.getItem('iLourSari_inventory')) || {};
  }

  getStockByProductAndBranch(productId, branchId) {
    const inventory = this.getInventory();
    return inventory[productId]?.[branchId] || 0;
  }

  updateStock(productId, branchId, quantity, reason) {
    const inventory = this.getInventory();
    if (!inventory[productId]) {
      inventory[productId] = {};
    }
    const currentStock = inventory[productId][branchId] || 0;
    inventory[productId][branchId] = Math.max(0, currentStock + quantity);
    localStorage.setItem('iLourSari_inventory', JSON.stringify(inventory));

    // Log transaction
    this.logTransaction({
      type: 'stock_adjustment',
      productId,
      branchId,
      quantity,
      reason,
      timestamp: new Date().toISOString()
    });

    return inventory[productId][branchId];
  }

  getTotalInventoryValue(branchId = null) {
    const inventory = this.getInventory();
    const products = this.getProducts();
    let total = 0;

    Object.keys(inventory).forEach(productId => {
      const product = products.find(p => p.id === parseInt(productId));
      if (product) {
        if (branchId) {
          const quantity = inventory[productId][branchId] || 0;
          total += quantity * product.price;
        } else {
          Object.values(inventory[productId]).forEach(quantity => {
            total += quantity * product.price;
          });
        }
      }
    });

    return total;
  }

  // Transaction operations
  addTransaction(transaction) {
    const transactions = JSON.parse(localStorage.getItem('iLourSari_transactions')) || [];
    const newTransaction = {
      id: 'TRX-' + Date.now(),
      items: transaction.items,
      subtotal: transaction.subtotal,
      discount: transaction.discount || 0,
      total: transaction.total,
      paymentMethod: transaction.paymentMethod,
      branchId: transaction.branchId,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString()
    };
    transactions.push(newTransaction);
    localStorage.setItem('iLourSari_transactions', JSON.stringify(transactions));
    
    // Add to history for archival
    const history = JSON.parse(localStorage.getItem('iLourSari_transactions_history')) || [];
    history.push(newTransaction);
    localStorage.setItem('iLourSari_transactions_history', JSON.stringify(history));

    return newTransaction;
  }

  getTransactions(branchId = null, dateFilter = null) {
    const transactions = JSON.parse(localStorage.getItem('iLourSari_transactions')) || [];
    return transactions.filter(t => {
      let matches = true;
      if (branchId) matches = matches && t.branchId === parseInt(branchId);
      if (dateFilter) matches = matches && t.date === dateFilter;
      return matches;
    });
  }

  getTodaySales(branchId = null) {
    const today = new Date().toLocaleDateString();
    const transactions = this.getTransactions(branchId, today);
    return transactions.reduce((sum, t) => sum + t.total, 0);
  }

  // Reservation operations
  addReservation(reservation) {
    const reservations = JSON.parse(localStorage.getItem('iLourSari_reservations')) || [];
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (reservation.expiryDays || 7));

    const newReservation = {
      id: 'RES-' + Date.now(),
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      productId: reservation.productId,
      quantity: reservation.quantity,
      branchId: reservation.branchId,
      status: 'active',
      createdDate: new Date().toISOString(),
      expiryDate: expiryDate.toISOString()
    };
    reservations.push(newReservation);
    localStorage.setItem('iLourSari_reservations', JSON.stringify(reservations));
    return newReservation;
  }

  getReservations(status = null) {
    const reservations = JSON.parse(localStorage.getItem('iLourSari_reservations')) || [];
    if (status) {
      return reservations.filter(r => r.status === status);
    }
    return reservations;
  }

  updateReservationStatus(id, status) {
    const reservations = JSON.parse(localStorage.getItem('iLourSari_reservations')) || [];
    const reservation = reservations.find(r => r.id === id);
    if (reservation) {
      reservation.status = status;
      localStorage.setItem('iLourSari_reservations', JSON.stringify(reservations));
    }
    return reservation;
  }

  // Utility functions
  logTransaction(log) {
    const logs = JSON.parse(localStorage.getItem('iLourSari_logs')) || [];
    logs.push(log);
    localStorage.setItem('iLourSari_logs', JSON.stringify(logs));
  }

  exportData() {
    const data = {
      branches: this.getBranches(),
      products: this.getProducts(),
      inventory: this.getInventory(),
      transactions: JSON.parse(localStorage.getItem('iLourSari_transactions')),
      reservations: this.getReservations(),
      exportDate: new Date().toISOString()
    };
    return data;
  }
}

// ===== APPLICATION MANAGER =====
class iLourSariApp {
  constructor() {
    this.dataManager = new DataManager();
    this.currentBranchId = 1;
    this.cart = [];
    this.currentPaymentMethod = 'cash';
    this.lastReceipt = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateDateTime();
    this.initializeBranchSelector();
    this.renderDashboard();
    setInterval(() => this.updateDateTime(), 60000);
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => this.navigatePage(e.target.closest('.nav-item').dataset.page));
    });

    // Dashboard
    document.getElementById('sales-filter')?.addEventListener('change', () => this.updateDashboard());

    // POS System
    document.getElementById('product-search')?.addEventListener('input', (e) => this.filterProducts(e.target.value));
    document.getElementById('clear-cart')?.addEventListener('click', () => this.clearCart());
    document.getElementById('discount')?.addEventListener('input', () => this.updateCartTotal());
    document.getElementById('checkout-btn')?.addEventListener('click', () => this.checkout());
    document.getElementById('print-receipt-btn')?.addEventListener('click', () => this.printReceipt());

    document.querySelectorAll('.payment-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.selectPaymentMethod(e.target.dataset.method));
    });

    // Inventory
    document.getElementById('product-search')?.addEventListener('input', (e) => this.filterInventory(e.target.value));
    document.getElementById('category-filter')?.addEventListener('change', () => this.updateInventoryTable());
    document.getElementById('stock-filter')?.addEventListener('change', () => this.updateInventoryTable());
    document.getElementById('add-product-btn')?.addEventListener('click', () => this.openProductModal());

    // Products Management
    document.getElementById('new-product-btn')?.addEventListener('click', () => this.openProductModal());

    // Reservations
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.filterReservations(e.target.dataset.tab));
    });

    // Reports
    document.getElementById('generate-report-btn')?.addEventListener('click', () => this.generateReport());
    document.getElementById('export-csv-btn')?.addEventListener('click', () => this.exportCSV());

    // Export Data
    document.getElementById('export-btn')?.addEventListener('click', () => this.exportAllData());

    // Modal controls
    this.setupModalControls();
  }

  setupModalControls() {
    // Product Modal
    document.getElementById('product-form')?.addEventListener('submit', (e) => this.handleProductSubmit(e));
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.closeModal('product-modal'));
    document.querySelector('#product-modal .close-btn')?.addEventListener('click', () => this.closeModal('product-modal'));

    // Stock Modal
    document.getElementById('stock-form')?.addEventListener('submit', (e) => this.handleStockSubmit(e));
    document.getElementById('stock-modal-cancel')?.addEventListener('click', () => this.closeModal('stock-modal'));
    document.querySelector('#stock-modal .close-btn')?.addEventListener('click', () => this.closeModal('stock-modal'));

    // Reservation Modal
    document.getElementById('reservation-form')?.addEventListener('submit', (e) => this.handleReservationSubmit(e));
    document.getElementById('res-modal-cancel')?.addEventListener('click', () => this.closeModal('reservation-modal'));
    document.querySelector('#reservation-modal .close-btn')?.addEventListener('click', () => this.closeModal('reservation-modal'));

    // Receipt Modal
    document.getElementById('close-receipt-btn')?.addEventListener('click', () => this.closeModal('receipt-modal'));
    document.querySelector('#receipt-modal .close-btn')?.addEventListener('click', () => this.closeModal('receipt-modal'));
    document.getElementById('print-btn')?.addEventListener('click', () => window.print());
  }

  // ===== NAVIGATION =====
  navigatePage(page) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

    // Update pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`)?.classList.add('active');

    // Update title
    const titles = {
      dashboard: 'Dashboard',
      pos: 'Point of Sale',
      inventory: 'Inventory Management',
      products: 'Product Management',
      branches: 'Branch Management',
      reservations: 'Product Reservations',
      reports: 'Reports & Analytics'
    };
    document.getElementById('page-title').textContent = titles[page] || page;

    // Update content
    switch(page) {
      case 'dashboard':
        this.updateDashboard();
        break;
      case 'pos':
        this.renderPOS();
        break;
      case 'inventory':
        this.updateInventoryTable();
        break;
      case 'products':
        this.renderProductsTable();
        break;
      case 'branches':
        this.renderBranches();
        break;
      case 'reservations':
        this.renderReservations();
        break;
      case 'reports':
        this.updateReports();
        break;
    }
  }

  // ===== BRANCH SELECTOR =====
  initializeBranchSelector() {
    const branches = this.dataManager.getBranches();
    const selector = document.getElementById('branch-selector');
    selector.innerHTML = `
      <label>Active Branch:</label>
      <select id="branch-select">
        ${branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
      </select>
    `;
    document.getElementById('branch-select').addEventListener('change', (e) => {
      this.currentBranchId = parseInt(e.target.value);
      this.updateDashboard();
    });
  }

  updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
  }

  // ===== DASHBOARD =====
  updateDashboard() {
    this.renderDashboardKPIs();
    this.renderSalesChart();
    this.renderInventoryChart();
    this.renderBranchPerformance();
  }

  renderDashboardKPIs() {
    const today = new Date().toLocaleDateString();
    const transactions = this.dataManager.getTransactions(this.currentBranchId, today);
    const inventory = this.dataManager.getTotalInventoryValue(this.currentBranchId);
    const products = this.dataManager.getProducts();
    
    let lowStockCount = 0;
    products.forEach(product => {
      const stock = this.dataManager.getStockByProductAndBranch(product.id, this.currentBranchId);
      if (stock <= product.reorderPoint) lowStockCount++;
    });

    const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);

    document.getElementById('kpi-sales').textContent = '₱' + totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 });
    document.getElementById('kpi-inventory').textContent = '₱' + inventory.toLocaleString('en-US', { minimumFractionDigits: 2 });
    document.getElementById('kpi-transactions').textContent = transactions.length;
    document.getElementById('kpi-low-stock').textContent = lowStockCount;
  }

  renderSalesChart() {
    const canvas = document.getElementById('salesChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const filter = document.getElementById('sales-filter')?.value || 'week';
    const data = this.generateChartData(filter);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Simple line chart
    const padding = 40;
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;
    const maxValue = Math.max(...data.values, 1);

    ctx.strokeStyle = '#2d5a8c';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.values.forEach((value, index) => {
      const x = padding + (index / (data.values.length - 1)) * width;
      const y = padding + height - (value / maxValue) * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw points
    ctx.fillStyle = '#10b981';
    data.values.forEach((value, index) => {
      const x = padding + (index / (data.values.length - 1)) * width;
      const y = padding + height - (value / maxValue) * height;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    data.labels.forEach((label, index) => {
      const x = padding + (index / (data.values.length - 1)) * width;
      ctx.fillText(label, x, canvas.height - 10);
    });
  }

  generateChartData(filter) {
    let labels = [];
    let values = [];

    if (filter === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      labels = days;
      values = days.map(() => Math.floor(Math.random() * 5000) + 1000);
    } else if (filter === 'month') {
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      values = labels.map(() => Math.floor(Math.random() * 20000) + 5000);
    } else {
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      values = labels.map(() => Math.floor(Math.random() * 50000) + 10000);
    }

    return { labels, values };
  }

  renderInventoryChart() {
    const branches = this.dataManager.getBranches();
    const inventory = this.dataManager.getInventory();
    const chartDiv = document.getElementById('branchInventoryChart');

    let html = '';
    const maxValue = Math.max(...Object.values(inventory).flatMap(inv => Object.values(inv)), 1);

    branches.forEach(branch => {
      let totalValue = 0;
      Object.values(inventory).forEach(inv => {
        totalValue += inv[branch.id] || 0;
      });
      const height = (totalValue / maxValue) * 200;
      html += `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <div class="chart-bar" style="height: ${height}px; min-height: 20px;"></div>
          <div class="chart-bar-label">${branch.name}</div>
        </div>
      `;
    });

    chartDiv.innerHTML = html;
  }

  renderBranchPerformance() {
    const branches = this.dataManager.getBranches();
    const tbody = document.getElementById('branch-table-body');

    let html = '';
    branches.forEach(branch => {
      const sales = this.dataManager.getTodaySales(branch.id);
      const transactions = this.dataManager.getTransactions(branch.id);
      const inventory = this.dataManager.getTotalInventoryValue(branch.id);

      html += `
        <tr>
          <td>${branch.name}</td>
          <td>₱${sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td>${transactions.length}</td>
          <td>₱${inventory.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td><span class="status-badge active">Active</span></td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  // Point of Sale System
  renderPOS() {
    this.renderProductGrid();
    this.renderCart();
  }

  renderProductGrid() {
    const products = this.dataManager.getProducts();
    const grid = document.getElementById('product-grid');

    let html = '';
    products.forEach(product => {
      const stock = this.dataManager.getStockByProductAndBranch(product.id, this.currentBranchId);
      const inCart = this.cart.find(item => item.productId === product.id);
      
      html += `
        <div class="product-card ${inCart ? 'active' : ''}" onclick="app.addToCart(${product.id})">
          <div class="product-icon">📦</div>
          <div class="product-name">${product.name}</div>
          <div class="product-price">₱${product.price.toFixed(2)}</div>
          <div class="product-stock">Stock: ${stock}</div>
          <button class="product-btn" ${stock === 0 ? 'disabled' : ''}>
            ${inCart ? 'In Cart' : 'Add'}
          </button>
        </div>
      `;
    });

    grid.innerHTML = html;
  }

  addToCart(productId) {
    const product = this.dataManager.getProductById(productId);
    const stock = this.dataManager.getStockByProductAndBranch(productId, this.currentBranchId);

    if (stock === 0) return;

    const cartItem = this.cart.find(item => item.productId === productId);
    if (cartItem) {
      if (cartItem.quantity < stock) {
        cartItem.quantity++;
      }
    } else {
      this.cart.push({
        productId,
        name: product.name,
        price: product.price,
        quantity: 1
      });
    }

    this.renderCart();
    this.updateCartTotal();
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.productId !== productId);
    this.renderCart();
    this.updateCartTotal();
  }

  updateItemQuantity(productId, delta) {
    const item = this.cart.find(i => i.productId === productId);
    if (item) {
      item.quantity = Math.max(1, item.quantity + delta);
      this.renderCart();
      this.updateCartTotal();
    }
  }

  renderCart() {
    const cartDiv = document.getElementById('cart-items');
    const clearBtn = document.getElementById('clear-cart');

    if (this.cart.length === 0) {
      cartDiv.innerHTML = '<div class="empty-state"><div class="empty-icon">🛒</div><div class="empty-message">Cart is empty</div></div>';
      clearBtn.disabled = true;
      document.getElementById('checkout-btn').disabled = true;
      return;
    }

    clearBtn.disabled = false;
    document.getElementById('checkout-btn').disabled = false;

    let html = '';
    this.cart.forEach(item => {
      html += `
        <div class="cart-item">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-qty">
              <button class="qty-btn" onclick="app.updateItemQuantity(${item.productId}, -1)">−</button>
              <span>${item.quantity}</span>
              <button class="qty-btn" onclick="app.updateItemQuantity(${item.productId}, 1)">+</button>
            </div>
          </div>
          <div class="cart-item-price">₱${(item.price * item.quantity).toFixed(2)}</div>
          <button class="cart-item-remove" onclick="app.removeFromCart(${item.productId})">✕</button>
        </div>
      `;
    });

    cartDiv.innerHTML = html;
  }

  updateCartTotal() {
    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const total = Math.max(0, subtotal - discount);

    document.getElementById('subtotal').textContent = '₱' + subtotal.toFixed(2);
    document.getElementById('total').textContent = '₱' + total.toFixed(2);
  }

  selectPaymentMethod(method) {
    this.currentPaymentMethod = method;
    document.querySelectorAll('.payment-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-method="${method}"]`).classList.add('active');
  }

  clearCart() {
    this.cart = [];
    document.getElementById('discount').value = '0';
    this.renderCart();
    this.updateCartTotal();
  }

  checkout() {
    if (this.cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    // Update inventory
    this.cart.forEach(item => {
      this.dataManager.updateStock(item.productId, this.currentBranchId, -item.quantity, 'sale');
    });

    // Create transaction
    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const total = subtotal - discount;

    const transaction = this.dataManager.addTransaction({
      items: this.cart.map(item => ({ productId: item.productId, quantity: item.quantity, price: item.price })),
      subtotal,
      discount,
      total,
      paymentMethod: this.currentPaymentMethod,
      branchId: this.currentBranchId
    });

    this.lastReceipt = transaction;
    this.displayReceipt(transaction);
    this.clearCart();
    this.renderProductGrid();

    document.getElementById('print-receipt-btn').disabled = false;
  }

  displayReceipt(transaction) {
    const receiptContent = document.getElementById('receipt-content');
    const branch = this.dataManager.getBranchById(transaction.branchId);

    let html = `
      <div class="receipt-header-text">iLourSari Store Receipt</div>
      <div class="receipt-item"><strong>${branch.name}</strong></div>
      <div class="receipt-item"><small>${branch.address}</small></div>
      <div style="margin: 16px 0; border-top: 1px solid; border-bottom: 1px solid;"></div>
    `;

    transaction.items.forEach(item => {
      const product = this.dataManager.getProductById(item.productId);
      html += `
        <div class="receipt-item">
          <span>${product.name} x${item.quantity}</span>
          <span>₱${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      `;
    });

    html += `
      <div style="margin: 16px 0; border-top: 1px solid; border-bottom: 1px solid;"></div>
      <div class="receipt-item">
        <span>Subtotal:</span>
        <span>₱${transaction.subtotal.toFixed(2)}</span>
      </div>
    `;

    if (transaction.discount > 0) {
      html += `
        <div class="receipt-item">
          <span>Discount:</span>
          <span>-₱${transaction.discount.toFixed(2)}</span>
        </div>
      `;
    }

    html += `
      <div class="receipt-item" style="font-weight: 700; font-size: 16px;">
        <span>TOTAL:</span>
        <span>₱${transaction.total.toFixed(2)}</span>
      </div>
      <div class="receipt-item">
        <span>Payment:</span>
        <span>${this.currentPaymentMethod.toUpperCase()}</span>
      </div>
      <div class="receipt-footer">
        <div>Transaction ID: ${transaction.id}</div>
        <div>Date: ${new Date(transaction.timestamp).toLocaleString()}</div>
        <div style="margin-top: 16px;">Thank you for your purchase!</div>
      </div>
    `;

    receiptContent.innerHTML = html;
    this.openModal('receipt-modal');
  }

  printReceipt() {
    window.print();
  }

  filterProducts(query) {
    const products = document.querySelectorAll('.product-card');
    query = query.toLowerCase();

    products.forEach(card => {
      const name = card.querySelector('.product-name').textContent.toLowerCase();
      card.style.display = name.includes(query) ? 'flex' : 'none';
    });
  }

  // ===== INVENTORY MANAGEMENT =====
  updateInventoryTable() {
    const products = this.dataManager.getProducts();
    const branches = this.dataManager.getBranches();
    const categoryFilter = document.getElementById('category-filter')?.value || '';
    const stockFilter = document.getElementById('stock-filter')?.value || '';
    const tbody = document.getElementById('inventory-table-body');

    let html = '';

    products.forEach(product => {
      if (categoryFilter && product.category !== categoryFilter) return;

      let totalStock = 0;
      let branchLevels = '';

      branches.forEach(branch => {
        const stock = this.dataManager.getStockByProductAndBranch(product.id, branch.id);
        totalStock += stock;
        branchLevels += `<div>${branch.name}: ${stock}</div>`;
      });

      if (stockFilter) {
        if (stockFilter === 'low' && totalStock > product.reorderPoint) return;
        if (stockFilter === 'normal' && (totalStock <= product.reorderPoint || totalStock > product.reorderPoint * 3)) return;
        if (stockFilter === 'high' && totalStock <= product.reorderPoint * 3) return;
      }

      const status = totalStock <= product.reorderPoint ? 'warning' : 'active';

      html += `
        <tr>
          <td>${product.name}</td>
          <td>${product.category}</td>
          <td>${product.sku}</td>
          <td>₱${product.price.toFixed(2)}</td>
          <td style="font-size: 12px;">${branchLevels}</td>
          <td>${totalStock}</td>
          <td>${product.reorderPoint}</td>
          <td><span class="status-badge ${status}">${status}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="app.openStockModal(${product.id})">Update</button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  openStockModal(productId) {
    const product = this.dataManager.getProductById(productId);
    const branches = this.dataManager.getBranches();

    document.getElementById('stock-product').value = product.name;
    document.getElementById('stock-quantity').value = this.dataManager.getStockByProductAndBranch(productId, this.currentBranchId);

    let branchOptions = '';
    branches.forEach(branch => {
      branchOptions += `<option value="${branch.id}">${branch.name}</option>`;
    });
    document.getElementById('stock-branch').innerHTML = branchOptions;
    document.getElementById('stock-branch').value = this.currentBranchId;
    document.getElementById('stock-change').value = '';
    document.getElementById('stock-reason').value = '';

    document.getElementById('stock-form').dataset.productId = productId;
    this.openModal('stock-modal');
  }

  handleStockSubmit(e) {
    e.preventDefault();
    const productId = parseInt(document.getElementById('stock-form').dataset.productId);
    const branchId = parseInt(document.getElementById('stock-branch').value);
    const quantity = parseInt(document.getElementById('stock-change').value);
    const reason = document.getElementById('stock-reason').value;

    if (!reason) {
      alert('Please select a reason');
      return;
    }

    this.dataManager.updateStock(productId, branchId, quantity, reason);
    this.closeModal('stock-modal');
    this.updateInventoryTable();
    alert('Stock updated successfully');
  }

  filterInventory(query) {
    query = query.toLowerCase();
    const rows = document.querySelectorAll('#inventory-table-body tr');
    rows.forEach(row => {
      const productName = row.querySelector('td')?.textContent.toLowerCase() || '';
      row.style.display = productName.includes(query) ? '' : 'none';
    });
  }

  // ===== PRODUCT MANAGEMENT =====
  renderProductsTable() {
    const products = this.dataManager.getProducts();
    const tbody = document.getElementById('products-table-body');

    let html = '';
    products.forEach(product => {
      html += `
        <tr>
          <td>${product.name}</td>
          <td>${product.sku}</td>
          <td>${product.category}</td>
          <td>₱${product.price.toFixed(2)}</td>
          <td>${product.reorderPoint}</td>
          <td><span class="status-badge active">Active</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="app.editProduct(${product.id})">Edit</button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  openProductModal(productId = null) {
    const form = document.getElementById('product-form');
    const title = document.getElementById('modal-title');

    if (productId) {
      const product = this.dataManager.getProductById(productId);
      title.textContent = 'Edit Product';
      document.getElementById('product-name').value = product.name;
      document.getElementById('product-sku').value = product.sku;
      document.getElementById('product-category').value = product.category;
      document.getElementById('product-price').value = product.price;
      document.getElementById('product-reorder').value = product.reorderPoint;
      form.dataset.productId = productId;
    } else {
      title.textContent = 'Add Product';
      form.reset();
      form.dataset.productId = '';
    }

    this.openModal('product-modal');
  }

  handleProductSubmit(e) {
    e.preventDefault();
    const productId = document.getElementById('product-form').dataset.productId;

    const productData = {
      name: document.getElementById('product-name').value,
      sku: document.getElementById('product-sku').value,
      category: document.getElementById('product-category').value,
      price: parseFloat(document.getElementById('product-price').value),
      reorderPoint: parseInt(document.getElementById('product-reorder').value)
    };

    if (productId) {
      this.dataManager.updateProduct(parseInt(productId), productData);
    } else {
      this.dataManager.addProduct(productData);
    }

    this.closeModal('product-modal');
    this.renderProductsTable();
    this.renderPOS();
    alert('Product saved successfully');
  }

  editProduct(productId) {
    this.openProductModal(productId);
  }

  // ===== BRANCHES =====
  renderBranches() {
    const branches = this.dataManager.getBranches();
    const grid = document.getElementById('branches-grid');

    let html = '';
    branches.forEach(branch => {
      const sales = this.dataManager.getTodaySales(branch.id);
      const inventory = this.dataManager.getTotalInventoryValue(branch.id);
      const transactions = this.dataManager.getTransactions(branch.id);

      html += `
        <div class="branch-card">
          <h3>🏪 ${branch.name}</h3>
          <div class="branch-info">
            <div><strong>Address:</strong> ${branch.address}</div>
            <div><strong>Manager:</strong> ${branch.manager}</div>
          </div>
          <div class="branch-stats">
            <div class="stat-item">
              <div class="stat-value">₱${sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <div class="stat-label">Today's Sales</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${transactions.length}</div>
              <div class="stat-label">Transactions</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">₱${inventory.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <div class="stat-label">Inventory Value</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" style="color: #10b981;">Active</div>
              <div class="stat-label">Status</div>
            </div>
          </div>
        </div>
      `;
    });

    grid.innerHTML = html;
  }

  // ===== RESERVATIONS =====
  renderReservations(status = 'active') {
    const reservations = this.dataManager.getReservations(status);
    const tbody = document.getElementById('reservations-table-body');

    let html = '';
    reservations.forEach(res => {
      const product = this.dataManager.getProductById(res.productId);
      const branch = this.dataManager.getBranchById(res.branchId);
      const expiryDate = new Date(res.expiryDate);
      const isExpired = new Date() > expiryDate;

      html += `
        <tr>
          <td>${res.id}</td>
          <td>${res.customerName}</td>
          <td>${product.name}</td>
          <td>${res.quantity}</td>
          <td>${branch.name}</td>
          <td>${new Date(res.createdDate).toLocaleDateString()}</td>
          <td>${expiryDate.toLocaleDateString()} ${isExpired ? '(Expired)' : ''}</td>
          <td><span class="status-badge ${res.status}">${res.status}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="app.updateReservationStatus('${res.id}', 'completed')">Complete</button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html || '<tr><td colspan="9" style="text-align: center; padding: 20px;">No reservations found</td></tr>';
  }

  filterReservations(status) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    this.renderReservations(status);
  }

  updateReservationStatus(id, status) {
    this.dataManager.updateReservationStatus(id, status);
    this.renderReservations('active');
    alert('Reservation updated');
  }

  // Reports
  updateReports() {
    this.generateReport();
  }

  generateReport() {
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;

    // Sales Summary
    const transactions = this.dataManager.getTransactions();
    let filteredTransactions = transactions;

    if (startDate) {
      const start = new Date(startDate);
      filteredTransactions = filteredTransactions.filter(t => new Date(t.timestamp) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      filteredTransactions = filteredTransactions.filter(t => new Date(t.timestamp) <= end);
    }

    const totalSales = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = filteredTransactions.length;
    const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    document.getElementById('sales-summary').innerHTML = `
      <div class="report-item">
        <span class="report-item-label">Total Sales</span>
        <span class="report-item-value">₱${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="report-item">
        <span class="report-item-label">Number of Transactions</span>
        <span class="report-item-value">${totalTransactions}</span>
      </div>
      <div class="report-item">
        <span class="report-item-label">Average Transaction</span>
        <span class="report-item-value">₱${avgTransaction.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
      </div>
    `;

    // Top Products
    const productSales = {};
    filteredTransactions.forEach(t => {
      t.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { qty: 0, revenue: 0 };
        }
        productSales[item.productId].qty += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5);

    let topProductsHtml = '';
    topProducts.forEach(([productId, data]) => {
      const product = this.dataManager.getProductById(parseInt(productId));
      topProductsHtml += `
        <div class="report-item">
          <span class="report-item-label">${product.name} (${data.qty}x)</span>
          <span class="report-item-value">₱${data.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      `;
    });

    document.getElementById('top-products').innerHTML = topProductsHtml || '<div class="report-item"><span>No data</span></div>';

    // Branch Comparison
    const branches = this.dataManager.getBranches();
    let comparisonHtml = '';
    branches.forEach(branch => {
      const branchTransactions = filteredTransactions.filter(t => t.branchId === branch.id);
      const branchSales = branchTransactions.reduce((sum, t) => sum + t.total, 0);
      comparisonHtml += `
        <div class="report-item">
          <span class="report-item-label">${branch.name}</span>
          <span class="report-item-value">₱${branchSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      `;
    });

    document.getElementById('branch-comparison').innerHTML = comparisonHtml;
  }

  exportCSV() {
    const transactions = this.dataManager.getTransactions();
    let csv = 'Transaction ID,Date,Branch,Total,Payment Method\n';

    transactions.forEach(t => {
      const branch = this.dataManager.getBranchById(t.branchId);
      csv += `${t.id},${new Date(t.timestamp).toLocaleString()},${branch.name},${t.total},${t.paymentMethod}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iLourSari_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  // Modal Controls
  openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
  }

  closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
  }

  // Export All Data
  exportAllData() {
    const data = this.dataManager.exportData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iLourSari_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }

  renderDashboard() {
    this.updateDashboard();
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new iLourSariApp();
});
