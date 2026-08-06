/* ==========================================================================
   Simba Hardware Hub — Core State & UI Controller
   ========================================================================== */

// 1. SEED DATA & IN-MEMORY STATE
const INITIAL_PRODUCTS = [
    // Cement
    { sku: "CEM-001", name: "Bamburi Tembo Cement (32.5N)", category: "Cement", unit: "Bags", costPrice: 650, salePrice: 790, stockQty: 120, reorderLevel: 20 },
    { sku: "CEM-002", name: "Savannah Portland Cement (42.5R)", category: "Cement", unit: "Bags", costPrice: 720, salePrice: 850, stockQty: 12, reorderLevel: 15 }, // low stock
    
    // Steel
    { sku: "STL-001", name: "Reinforcement Steel Bar D12 (12mm)", category: "Steel", unit: "Pieces", costPrice: 1100, salePrice: 1450, stockQty: 85, reorderLevel: 15 },
    { sku: "STL-002", name: "Reinforcement Steel Bar D10 (10mm)", category: "Steel", unit: "Pieces", costPrice: 780, salePrice: 980, stockQty: 110, reorderLevel: 20 },
    { sku: "STL-003", name: "Binding Wire 25kg (G16)", category: "Steel", unit: "Rolls", costPrice: 2800, salePrice: 3500, stockQty: 0, reorderLevel: 5 }, // out of stock

    // Paint
    { sku: "PNT-001", name: "Crown Paints Vinyl Matt White (20L)", category: "Paint", unit: "Tins", costPrice: 7500, salePrice: 8900, stockQty: 25, reorderLevel: 5 },
    { sku: "PNT-002", name: "Crown Paints Silk Emulsion Cream (4L)", category: "Paint", unit: "Tins", costPrice: 2200, salePrice: 2800, stockQty: 40, reorderLevel: 8 },
    { sku: "PNT-003", name: "Crown Solignum Wood Preservative (5L)", category: "Paint", unit: "Tins", costPrice: 1800, salePrice: 2250, stockQty: 18, reorderLevel: 4 },

    // Tools
    { sku: "TOL-001", name: "Stanley Claw Hammer 16oz", category: "Tools", unit: "Pieces", costPrice: 850, salePrice: 1200, stockQty: 30, reorderLevel: 5 },
    { sku: "TOL-002", name: "Bosch Angle Grinder GWS 750", category: "Tools", unit: "Pieces", costPrice: 5200, salePrice: 6800, stockQty: 8, reorderLevel: 3 },
    { sku: "TOL-003", name: "Tolsen Tape Measure 8M/26ft", category: "Tools", unit: "Pieces", costPrice: 320, salePrice: 480, stockQty: 65, reorderLevel: 10 },

    // Electricals
    { sku: "ELC-001", name: "East African Cables Single Core 1.5mm (Red)", category: "Electricals", unit: "Rolls", costPrice: 2800, salePrice: 3400, stockQty: 50, reorderLevel: 8 },
    { sku: "ELC-002", name: "East African Cables Single Core 2.5mm (Blue)", category: "Electricals", unit: "Rolls", costPrice: 4200, salePrice: 5100, stockQty: 3, reorderLevel: 8 }, // low stock
    { sku: "ELC-003", name: "Philips LED Bulb Cool Daylight E27 12W", category: "Electricals", unit: "Pieces", costPrice: 210, salePrice: 320, stockQty: 140, reorderLevel: 15 },

    // Plumbing
    { sku: "PLM-001", name: "PPR Pipe PN20 (20mm x 4M)", category: "Plumbing", unit: "Pieces", costPrice: 250, salePrice: 380, stockQty: 200, reorderLevel: 30 },
    { sku: "PLM-002", name: "Pegler Brass Gate Valve 3/4\"", category: "Plumbing", unit: "Pieces", costPrice: 1200, salePrice: 1650, stockQty: 18, reorderLevel: 5 }
];

const INITIAL_QUOTATIONS = [
    {
        id: "QT-9012",
        customerName: "Kamau Builders Ltd",
        phone: "0711222333",
        date: "2026-08-05",
        status: "pending",
        description: "Need quotation for construction work on Mombasa Road. Need bulk supply of cement and steel.",
        items: [
            { sku: "CEM-001", name: "Bamburi Tembo Cement (32.5N)", qty: 60, requestedPrice: 790, quotedPrice: 0 },
            { sku: "STL-001", name: "Reinforcement Steel Bar D12 (12mm)", qty: 25, requestedPrice: 1450, quotedPrice: 0 }
        ],
        quotedPrice: 0,
        validUntil: ""
    },
    {
        id: "QT-8841",
        customerName: "Wanjiku Njoroge",
        phone: "0722334455",
        date: "2026-08-03",
        status: "approved",
        description: "Paint and Wood preservative for a residential home fence renovation.",
        items: [
            { sku: "PNT-001", name: "Crown Paints Vinyl Matt White (20L)", qty: 4, requestedPrice: 8900, quotedPrice: 8500 },
            { sku: "PNT-003", name: "Crown Solignum Wood Preservative (5L)", qty: 6, requestedPrice: 2250, quotedPrice: 2100 }
        ],
        quotedPrice: 46600,
        validUntil: "2026-09-03"
    }
];

const INITIAL_CALLBACKS = [
    { id: "CB-001", name: "Peter Mwangi", phone: "0725999888", query: "Need advice on pipe size for plumbing connection in Ruiru", status: "pending", timestamp: "2026-08-06 10:20" },
    { id: "CB-002", name: "Alice Chebet", phone: "0712333444", query: "Bulk purchase inquiry for Stanley Claw Hammers", status: "completed", timestamp: "2026-08-05 14:15" }
];

const INITIAL_ORDERS = [
    { id: "ORD-7001", date: "2026-08-06", items: "CEM-001 (x5)", type: "Pickup", total: 3950, status: "Ready" },
    { id: "ORD-6988", date: "2026-08-05", items: "PNT-002 (x2), TOL-003 (x1)", type: "Delivery", total: 7280, status: "Completed" }
];

// App Variables
let products = [...INITIAL_PRODUCTS];
let quotations = [...INITIAL_QUOTATIONS];
let callbacks = [...INITIAL_CALLBACKS];
let orders = [...INITIAL_ORDERS];
let stockLogs = [];

let customerCart = []; // { sku, qty }
let posCart = []; // { sku, qty }
let selectedPayMethod = "mpesa";
let activeView = "customer";
let activeStaffTab = "pos";
let selectedQuoteId = null;

// Audit Trail Tracker
function logStockChange(sku, name, changeQty, reason, user = "System") {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const direction = changeQty > 0 ? "IN" : "OUT";
    stockLogs.unshift({
        timestamp,
        skuName: `[${sku}] ${name}`,
        changeQty: Math.abs(changeQty),
        direction,
        reason,
        user
    });
}

// Seed initial stock logs for audit history demo
logStockChange("CEM-001", "Bamburi Tembo Cement (32.5N)", 50, "Restock replenishment", "Store Manager");
logStockChange("STL-003", "Binding Wire 25kg (G16)", -2, "Water damage write-off", "Store Manager");
logStockChange("TOL-001", "Stanley Claw Hammer 16oz", -1, "POS In-store sale", "Cashier T1");

// 2. VIEW CONTROLLER (Navigation & Tabs)
function switchView(viewName) {
    activeView = viewName;
    const custPortal = document.getElementById("customer-portal");
    const staffTerminal = document.getElementById("staff-terminal");
    const btnCust = document.getElementById("btn-customer-view");
    const btnStaff = document.getElementById("btn-staff-view");

    if (viewName === "customer") {
        custPortal.classList.remove("hidden");
        staffTerminal.classList.add("hidden");
        btnCust.classList.add("active");
        btnStaff.classList.remove("active");
        renderCustomerCatalog();
    } else {
        custPortal.classList.add("hidden");
        staffTerminal.classList.remove("hidden");
        btnCust.classList.remove("active");
        btnStaff.classList.add("active");
        
        switchStaffTab(activeStaffTab);
    }
}

function switchStaffTab(tabName) {
    activeStaffTab = tabName;
    
    // Hide all tabs
    document.querySelectorAll(".staff-tab-panel").forEach(panel => {
        panel.classList.add("hidden");
    });
    document.querySelectorAll(".staff-nav-item").forEach(item => {
        item.classList.remove("active");
    });

    // Show active tab
    const activePanel = document.getElementById(`staff-tab-${tabName}`);
    if (activePanel) activePanel.classList.remove("hidden");

    // Highlight button
    event.currentTarget.classList.add("active");

    // Populate Tab Data
    if (tabName === "pos") {
        renderPOSCatalog();
        renderPOSCart();
    } else if (tabName === "inventory") {
        renderInventoryTable();
        renderStockLogsTable();
    } else if (tabName === "quotes") {
        renderQuotesInbox();
    } else if (tabName === "dashboard") {
        renderDashboard();
    }
}

// Dark/Light Theme Switcher
function toggleTheme() {
    const body = document.body;
    const toggleBtn = document.getElementById("theme-toggle-btn");
    
    if (body.classList.contains("dark-mode")) {
        body.classList.remove("dark-mode");
        body.classList.add("light-mode");
        toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        body.classList.remove("light-mode");
        body.classList.add("dark-mode");
        toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
}

// 3. COMMON RENDERING HELPERS
function getProductBySku(sku) {
    return products.find(p => p.sku === sku);
}

function formatKES(amount) {
    return "KES " + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getStockBadge(qty, reorder) {
    if (qty <= 0) {
        return `<span class="prod-stock-tag tag-outstock">Out of Stock</span>`;
    } else if (qty <= reorder) {
        return `<span class="prod-stock-tag tag-lowstock">Low Stock (${qty})</span>`;
    } else {
        return `<span class="prod-stock-tag tag-instock">In Stock (${qty})</span>`;
    }
}

function getStatusBadgeClass(status) {
    switch (status.toLowerCase()) {
        case 'pending': return 'status-pending';
        case 'approved': return 'status-approved';
        case 'converted': return 'status-converted';
        case 'placed': return 'status-pending';
        case 'confirmed': return 'status-approved';
        case 'ready': return 'status-approved';
        case 'completed': return 'status-converted';
        default: return 'status-pending';
    }
}

// 4. CUSTOMER STOREFRONT IMPLEMENTATION

// Categories list
const CATEGORIES = ["All", "Cement", "Steel", "Paint", "Tools", "Electricals", "Plumbing"];
let activeCustomerCategory = "All";

function renderCustomerCatalog() {
    const chipsContainer = document.getElementById("customer-category-chips");
    const gridContainer = document.getElementById("customer-product-grid");
    const quoteDropdown = document.getElementById("quote-item-dropdown");
    
    // 1. Render Category Chips
    chipsContainer.innerHTML = CATEGORIES.map(cat => `
        <button class="category-chip ${cat === activeCustomerCategory ? 'active' : ''}" 
                onclick="setCustomerCategory('${cat}')">
            ${cat}
        </button>
    `).join('');

    // 2. Render Products Grid
    const searchVal = document.getElementById("cust-search").value.toLowerCase();
    const filteredProducts = products.filter(prod => {
        const matchesCategory = activeCustomerCategory === "All" || prod.category === activeCustomerCategory;
        const matchesSearch = prod.name.toLowerCase().includes(searchVal) || prod.sku.toLowerCase().includes(searchVal);
        return matchesCategory && matchesSearch;
    });

    if (filteredProducts.length === 0) {
        gridContainer.innerHTML = `<div class="empty-list-msg" style="grid-column: 1/-1;">No products found matching your filter criteria.</div>`;
    } else {
        gridContainer.innerHTML = filteredProducts.map(prod => {
            const isOutOfStock = prod.stockQty <= 0;
            const iconClass = getCategoryIcon(prod.category);
            return `
                <div class="product-card">
                    ${getStockBadge(prod.stockQty, prod.reorderLevel)}
                    <div class="prod-visual-img">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="prod-category-tag">${prod.category}</div>
                    <h4>${prod.name}</h4>
                    <div class="prod-sku-tag">SKU: ${prod.sku}</div>
                    <div class="prod-meta-footer">
                        <div class="prod-price-box">
                            <span class="prod-price">${formatKES(prod.salePrice)}</span>
                            <span class="prod-unit">per ${prod.unit}</span>
                        </div>
                        <button class="add-cart-btn" onclick="addToCustomerCart('${prod.sku}')" ${isOutOfStock ? 'disabled' : ''}>
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 3. Render Quote Form Dropdown
    quoteDropdown.innerHTML = products.map(prod => `
        <option value="${prod.sku}">${prod.name} (${prod.unit})</option>
    `).join('');
}

function getCategoryIcon(cat) {
    switch (cat) {
        case "Cement": return "fa-solid fa-trowel-bricks";
        case "Steel": return "fa-solid fa-bars-staggered";
        case "Paint": return "fa-solid fa-paint-roller";
        case "Tools": return "fa-solid fa-screwdriver-wrench";
        case "Electricals": return "fa-solid fa-bolt";
        case "Plumbing": return "fa-solid fa-faucet-drip";
        default: return "fa-solid fa-box";
    }
}

function setCustomerCategory(categoryName) {
    activeCustomerCategory = categoryName;
    renderCustomerCatalog();
}

function filterCustomerProducts() {
    renderCustomerCatalog();
}

// Cart Drawer Operations
function toggleCartDrawer() {
    const drawer = document.getElementById("cart-drawer-panel");
    drawer.classList.toggle("open");
    renderCustomerCart();
}

function addToCustomerCart(sku) {
    const prod = getProductBySku(sku);
    if (!prod || prod.stockQty <= 0) return;

    const cartItem = customerCart.find(item => item.sku === sku);
    if (cartItem) {
        if (cartItem.qty < prod.stockQty) {
            cartItem.qty++;
        } else {
            alert(`Cannot add more. Only ${prod.stockQty} items in stock.`);
        }
    } else {
        customerCart.push({ sku, qty: 1 });
    }

    updateCartBadge();
    renderCustomerCart();
    
    // Show toast or highlight cart
    const cartTrigger = document.querySelector(".cart-trigger");
    cartTrigger.style.transform = "scale(1.2)";
    setTimeout(() => cartTrigger.style.transform = "none", 150);
}

function updateCartQty(sku, change) {
    const prod = getProductBySku(sku);
    const cartItem = customerCart.find(item => item.sku === sku);
    if (!cartItem) return;

    cartItem.qty += change;
    if (cartItem.qty <= 0) {
        customerCart = customerCart.filter(item => item.sku !== sku);
    } else if (cartItem.qty > prod.stockQty) {
        cartItem.qty = prod.stockQty;
        alert(`Limit reached. Only ${prod.stockQty} items in stock.`);
    }

    updateCartBadge();
    renderCustomerCart();
}

function removeCustomerCartItem(sku) {
    customerCart = customerCart.filter(item => item.sku !== sku);
    updateCartBadge();
    renderCustomerCart();
}

function updateCartBadge() {
    const count = customerCart.reduce((total, item) => total + item.qty, 0);
    document.getElementById("cart-badge-count").textContent = count;
}

function selectPayMethod(method) {
    selectedPayMethod = method;
    document.querySelectorAll(".pay-method-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    event.currentTarget.classList.add("active");

    const mpesaWrapper = document.getElementById("mpesa-number-input");
    if (method === "mpesa") {
        mpesaWrapper.classList.remove("hidden");
    } else {
        mpesaWrapper.classList.add("hidden");
    }
}

function updateFulfillmentOptions() {
    const fulfillment = document.getElementById("fulfillment-choice").value;
    const addrGroup = document.getElementById("delivery-address-group");
    
    if (fulfillment === "delivery") {
        addrGroup.classList.remove("hidden");
    } else {
        addrGroup.classList.add("hidden");
    }
    recalcCustomerCartTotal();
}

function renderCustomerCart() {
    const itemsList = document.getElementById("cart-items-list");
    
    if (customerCart.length === 0) {
        itemsList.innerHTML = `
            <div class="empty-cart-msg">
                <i class="fa-solid fa-cart-flatbed"></i>
                <p>Your cart is empty.</p>
            </div>
        `;
        document.getElementById("cart-subtotal").textContent = "KES 0.00";
        document.getElementById("cart-total").textContent = "KES 0.00";
        return;
    }

    let subtotal = 0;
    itemsList.innerHTML = customerCart.map(item => {
        const prod = getProductBySku(item.sku);
        if (!prod) return '';
        const itemTotal = prod.salePrice * item.qty;
        subtotal += itemTotal;
        return `
            <div class="cart-item">
                <div class="cart-item-details">
                    <h5>${prod.name}</h5>
                    <span class="cart-item-price">${formatKES(prod.salePrice)}</span>
                </div>
                <div class="cart-item-controls">
                    <button class="cart-qty-btn" onclick="updateCartQty('${item.sku}', -1)">-</button>
                    <span class="cart-item-qty">${item.qty}</span>
                    <button class="cart-qty-btn" onclick="updateCartQty('${item.sku}', 1)">+</button>
                </div>
                <i class="fa-regular fa-trash-can cart-item-remove" onclick="removeCustomerCartItem('${item.sku}')"></i>
            </div>
        `;
    }).join('');

    document.getElementById("cart-subtotal").textContent = formatKES(subtotal);
    recalcCustomerCartTotal();
}

function recalcCustomerCartTotal() {
    let total = 0;
    const subtotalText = document.getElementById("cart-subtotal").textContent;
    const subtotal = Number(subtotalText.replace(/[^\d.]/g, ''));
    
    const fulfillment = document.getElementById("fulfillment-choice").value;
    const deliveryFee = fulfillment === "delivery" ? 1200 : 0;
    
    total = subtotal + deliveryFee;
    document.getElementById("cart-total").textContent = formatKES(total);
}

function processCustomerCheckout() {
    if (customerCart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const fulfillment = document.getElementById("fulfillment-choice").value;
    const address = document.getElementById("delivery-address").value.trim();
    const payMethod = selectedPayMethod;
    const mpesaNo = document.getElementById("mpesa-number-input").value.trim();

    if (fulfillment === "delivery" && !address) {
        alert("Please enter a delivery address.");
        return;
    }

    if (payMethod === "mpesa" && !mpesaNo) {
        alert("Please enter your M-Pesa phone number for the STK push request.");
        return;
    }

    // Process Stock deductions
    // Check if stock is still available first (race condition check)
    for (const item of customerCart) {
        const prod = getProductBySku(item.sku);
        if (prod.stockQty < item.qty) {
            alert(`Overselling alert! Product "${prod.name}" only has ${prod.stockQty} items left.`);
            return;
        }
    }

    // Deduct stock
    const itemsDescription = [];
    customerCart.forEach(item => {
        const prod = getProductBySku(item.sku);
        prod.stockQty -= item.qty;
        itemsDescription.push(`${prod.name} (x${item.qty})`);
        
        // Log to Audit Log
        logStockChange(prod.sku, prod.name, -item.qty, `Customer Online Store Order (${fulfillment})`, "Customer Portal");
    });

    const totalText = document.getElementById("cart-total").textContent;
    const totalVal = Number(totalText.replace(/[^\d.]/g, ''));

    // Create Order
    const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
    const dateToday = new Date().toISOString().split('T')[0];
    orders.unshift({
        id: orderId,
        date: dateToday,
        items: itemsDescription.join(', '),
        type: fulfillment === "delivery" ? "Delivery" : "Pickup",
        total: totalVal,
        status: "Placed"
    });

    // Reset Cart
    customerCart = [];
    updateCartBadge();
    toggleCartDrawer();
    
    // Update Orders table & notify
    renderCustomerOrdersTracker();
    alert(`Order ${orderId} created successfully! Payment simulated successfully. We will notify you when it's confirmed.`);

    // Sync other views
    renderCustomerCatalog();
}

function renderCustomerOrdersTracker() {
    const tbody = document.getElementById("customer-orders-tracker-tbody");
    tbody.innerHTML = orders.map(ord => `
        <tr>
            <td style="font-weight:600;">${ord.id}</td>
            <td>${ord.date}</td>
            <td style="max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${ord.items}</td>
            <td>${ord.type}</td>
            <td style="font-weight:700;">${formatKES(ord.total)}</td>
            <td><span class="quote-status-badge ${getStatusBadgeClass(ord.status)}">${ord.status}</span></td>
            <td>
                ${ord.status === "Placed" ? `<button class="btn-secondary" style="padding:2px 8px; font-size:0.75rem;" onclick="cancelCustomerOrder('${ord.id}')">Cancel</button>` : `<span class="text-muted" style="font-size:0.8rem;">No actions</span>`}
            </td>
        </tr>
    `).join('');
}

function cancelCustomerOrder(orderId) {
    const ordIndex = orders.findIndex(o => o.id === orderId);
    if (ordIndex === -1) return;

    // Refund stock qty (simple mockup)
    // Note: in high fidelity, we would parse SKU quantities, but this is a dashboard helper
    orders[ordIndex].status = "Cancelled";
    renderCustomerOrdersTracker();
    alert(`Order ${orderId} cancelled.`);
}

// 5. HELPLINE & CALLBACK MODAL LOGIC
function openCallbackModal() {
    document.getElementById("modal-callback").classList.remove("hidden");
}

function closeCallbackModal() {
    document.getElementById("modal-callback").classList.add("hidden");
}

function submitCallbackRequest(e) {
    e.preventDefault();
    const name = document.getElementById("call-name").value;
    const phone = document.getElementById("call-phone").value;
    const reason = document.getElementById("call-reason").value;

    const callbackId = "CB-00" + (callbacks.length + 1);
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    callbacks.unshift({
        id: callbackId,
        name,
        phone,
        query: reason || "General Callback Helpline Request",
        status: "pending",
        timestamp
    });

    closeCallbackModal();
    alert("Help Request submitted! A hardware specialist will contact you shortly.");
    document.getElementById("callback-request-form").reset();
}

// 6. CUSTOMER QUOTATION SYSTEM
let customerQuoteItems = []; // { sku, qty }

function addQuoteItemToList() {
    const dropdown = document.getElementById("quote-item-dropdown");
    const qtyInput = document.getElementById("quote-item-qty");
    
    const sku = dropdown.value;
    const qty = parseInt(qtyInput.value);
    
    if (!sku || isNaN(qty) || qty <= 0) return;

    const prod = getProductBySku(sku);
    const existing = customerQuoteItems.find(item => item.sku === sku);
    
    if (existing) {
        existing.qty += qty;
    } else {
        customerQuoteItems.push({
            sku,
            name: prod.name,
            qty
        });
    }

    renderQuoteBuilderList();
}

function removeQuoteItemFromList(sku) {
    customerQuoteItems = customerQuoteItems.filter(item => item.sku !== sku);
    renderQuoteBuilderList();
}

function renderQuoteBuilderList() {
    const ul = document.getElementById("quote-items-list-ul");
    if (customerQuoteItems.length === 0) {
        ul.innerHTML = `<li class="empty-list-msg">No items selected yet. Select items above or specify below.</li>`;
        return;
    }

    ul.innerHTML = customerQuoteItems.map(item => `
        <li>
            <span><strong>${item.qty}x</strong> ${item.name}</span>
            <span class="remove-btn" onclick="removeQuoteItemFromList('${item.sku}')">Remove</span>
        </li>
    `).join('');
}

function submitQuoteRequest(e) {
    e.preventDefault();
    const name = document.getElementById("quote-name").value;
    const phone = document.getElementById("quote-phone").value;
    const desc = document.getElementById("quote-description").value;

    if (customerQuoteItems.length === 0 && !desc.trim()) {
        alert("Please add items to the quotation list or describe your needs in the text box.");
        return;
    }

    const quoteId = "QT-" + Math.floor(1000 + Math.random() * 9000);
    const dateToday = new Date().toISOString().split('T')[0];

    const quoteItems = customerQuoteItems.map(item => {
        const prod = getProductBySku(item.sku);
        return {
            sku: item.sku,
            name: item.name,
            qty: item.qty,
            requestedPrice: prod.salePrice,
            quotedPrice: 0 // to be set by staff manager
        };
    });

    quotations.unshift({
        id: quoteId,
        customerName: name,
        phone,
        date: dateToday,
        status: "pending",
        description: desc,
        items: quoteItems,
        quotedPrice: 0,
        validUntil: ""
    });

    // Reset
    customerQuoteItems = [];
    renderQuoteBuilderList();
    document.getElementById("quote-request-form").reset();
    
    alert(`Quotation Request ${quoteId} submitted! Check with our sales manager for pricing.`);
    
    // Sync badge
    updateQuotesBadge();
}

function updateQuotesBadge() {
    const pendingCount = quotations.filter(q => q.status === "pending").length;
    const badge = document.getElementById("pending-quotes-badge");
    
    if (pendingCount > 0) {
        badge.textContent = pendingCount;
        badge.classList.remove("hidden");
    } else {
        badge.classList.add("hidden");
    }
}

// 7. STAFF POS (POINT OF SALE) SYSTEM

let posSearchVal = "";
let posCatVal = "all";

function renderPOSCatalog() {
    const grid = document.getElementById("pos-products-grid");
    const categorySelect = document.getElementById("pos-category-select");

    // Populate category dropdown in POS once
    if (categorySelect.options.length <= 1) {
        categorySelect.innerHTML = `<option value="all">All Categories</option>` + 
            CATEGORIES.slice(1).map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }

    const searchVal = document.getElementById("pos-search-input").value.toLowerCase();
    const selectCat = categorySelect.value;

    const filtered = products.filter(prod => {
        const matchesCategory = selectCat === "all" || prod.category === selectCat;
        const matchesSearch = prod.name.toLowerCase().includes(searchVal) || prod.sku.toLowerCase().includes(searchVal);
        return matchesCategory && matchesSearch;
    });

    grid.innerHTML = filtered.map(prod => {
        const isOutOfStock = prod.stockQty <= 0;
        return `
            <div class="pos-item-card" onclick="addToPOSCart('${prod.sku}')">
                <h5>${prod.name}</h5>
                <span class="pos-item-sku">${prod.sku}</span>
                <div class="pos-item-footer">
                    <span class="pos-item-price">${formatKES(prod.salePrice)}</span>
                    <span class="pos-item-stock ${prod.stockQty <= prod.reorderLevel ? 'text-amber' : 'text-green'}">
                        ${prod.stockQty} ${prod.unit}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

function filterPOSCatalog() {
    renderPOSCatalog();
}

function addToPOSCart(sku) {
    const prod = getProductBySku(sku);
    if (!prod) return;

    if (prod.stockQty <= 0) {
        alert("Product is out of stock in warehouse!");
        return;
    }

    const existing = posCart.find(item => item.sku === sku);
    if (existing) {
        if (existing.qty < prod.stockQty) {
            existing.qty++;
        } else {
            alert(`Overselling warning! Only ${prod.stockQty} items in stock.`);
        }
    } else {
        posCart.push({ sku, qty: 1 });
    }

    renderPOSCart();
}

function updatePOSCartQty(sku, qtyVal) {
    const prod = getProductBySku(sku);
    const cartItem = posCart.find(item => item.sku === sku);
    if (!cartItem) return;

    const parsedQty = parseInt(qtyVal);
    if (isNaN(parsedQty) || parsedQty <= 0) {
        posCart = posCart.filter(item => item.sku !== sku);
    } else if (parsedQty > prod.stockQty) {
        cartItem.qty = prod.stockQty;
        alert(`Quantity capped at stock maximum (${prod.stockQty}).`);
    } else {
        cartItem.qty = parsedQty;
    }
    renderPOSCart();
}

function removePOSCartItem(sku) {
    posCart = posCart.filter(item => item.sku !== sku);
    renderPOSCart();
}

function renderPOSCart() {
    const container = document.getElementById("pos-cart-items");
    
    if (posCart.length === 0) {
        container.innerHTML = `
            <div class="empty-pos-msg">
                <i class="fa-solid fa-cart-arrow-down"></i>
                <p>Cart is empty. Click items on the left to add to bill.</p>
            </div>
        `;
        document.getElementById("pos-subtotal").textContent = "KES 0.00";
        document.getElementById("pos-tax").textContent = "KES 0.00";
        document.getElementById("pos-total").textContent = "KES 0.00";
        return;
    }

    let subtotal = 0;
    container.innerHTML = posCart.map(item => {
        const prod = getProductBySku(item.sku);
        if (!prod) return '';
        const lineTotal = prod.salePrice * item.qty;
        subtotal += lineTotal;
        return `
            <div class="pos-cart-item">
                <div>
                    <h6>${prod.name}</h6>
                    <span class="item-cost">${formatKES(prod.salePrice)}</span>
                </div>
                <input type="number" class="pos-cart-qty-input" value="${item.qty}" min="1" 
                       onchange="updatePOSCartQty('${item.sku}', this.value)">
                <i class="fa-regular fa-trash-can pos-cart-item-remove" onclick="removePOSCartItem('${item.sku}')"></i>
            </div>
        `;
    }).join('');

    const vatAmt = subtotal * 0.16; // 16% VAT Included
    const total = subtotal; // Price is inclusive of VAT

    document.getElementById("pos-subtotal").textContent = formatKES(subtotal - vatAmt);
    document.getElementById("pos-tax").textContent = formatKES(vatAmt);
    document.getElementById("pos-total").textContent = formatKES(total);
}

function togglePosPaymentDetails() {
    const type = document.getElementById("pos-payment-type").value;
    const refBox = document.getElementById("pos-mpesa-wrapper");
    if (type === "mpesa") {
        refBox.classList.remove("hidden");
    } else {
        refBox.classList.add("hidden");
    }
}

function processPOSSale() {
    if (posCart.length === 0) {
        alert("Cannot process an empty sale!");
        return;
    }

    const payType = document.getElementById("pos-payment-type").value;
    const mpesaRef = document.getElementById("pos-mpesa-ref").value.trim();

    if (payType === "mpesa" && !mpesaRef) {
        alert("Please enter the M-Pesa Transaction Reference code.");
        return;
    }

    // Verify stock availability
    for (const item of posCart) {
        const prod = getProductBySku(item.sku);
        if (prod.stockQty < item.qty) {
            alert(`Overselling alert! ${prod.name} only has ${prod.stockQty} in stock.`);
            return;
        }
    }

    // Deduct Stock and create Receipt info
    const receiptItems = [];
    let subtotal = 0;

    posCart.forEach(item => {
        const prod = getProductBySku(item.sku);
        prod.stockQty -= item.qty;
        
        const lineVal = prod.salePrice * item.qty;
        subtotal += lineVal;

        receiptItems.push({
            name: prod.name,
            qty: item.qty,
            unitPrice: prod.salePrice,
            total: lineVal
        });

        // Audit Log
        logStockChange(prod.sku, prod.name, -item.qty, `In-Store POS Sale`, "Cashier T1");
    });

    // Save sale totals in daily sales array
    const vatAmt = subtotal * 0.16;
    const netAmt = subtotal - vatAmt;

    // Show Printable Receipt Modal
    const receiptBox = document.getElementById("receipt-paper-content");
    const receiptNo = "RC-" + Math.floor(100000 + Math.random() * 900000);
    const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    receiptBox.innerHTML = `
        <h4>SIMBA HARDWARE HUB</h4>
        <p>Mombasa Road, Nairobi<br>Phone: +254 700 123 456<br>PIN: P051293881Z</p>
        <div class="divider"></div>
        <div class="receipt-metadata">
            <strong>Receipt No:</strong> ${receiptNo}<br>
            <strong>Date/Time:</strong> ${dateStr}<br>
            <strong>Cashier ID:</strong> Cashier T1<br>
            <strong>Payment Mode:</strong> ${payType.toUpperCase()} ${mpesaRef ? '(' + mpesaRef + ')' : ''}
        </div>
        <div class="divider"></div>
        <table class="receipt-table">
            <thead>
                <tr>
                    <th>Item Description</th>
                    <th>Qty</th>
                    <th class="align-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${receiptItems.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.qty}</td>
                        <td class="align-right">${formatKES(item.total).replace("KES ", "")}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="divider"></div>
        <div class="receipt-totals">
            <div class="totals-row">
                <span>Net Subtotal:</span>
                <span>${formatKES(netAmt).replace("KES ", "")}</span>
            </div>
            <div class="totals-row">
                <span>VAT (16% Inc.):</span>
                <span>${formatKES(vatAmt).replace("KES ", "")}</span>
            </div>
            <div class="totals-row total-highlight">
                <span>TOTAL PAID:</span>
                <span>${formatKES(subtotal)}</span>
            </div>
        </div>
        <div class="divider"></div>
        <p style="text-align:center; font-size:0.7rem;">Thank you for shopping with us!<br>Goods once sold are not returnable.<br>Building Tomorrow Together.</p>
        <div class="receipt-barcode">
            <i class="fa-solid fa-barcode"></i>
            <span>*${receiptNo}*</span>
        </div>
    `;

    document.getElementById("modal-receipt").classList.remove("hidden");

    // Reset POS cart
    posCart = [];
    renderPOSCart();
    renderPOSCatalog();
    document.getElementById("pos-mpesa-ref").value = "";
}

function closeReceiptModal() {
    document.getElementById("modal-receipt").classList.add("hidden");
}

function downloadReceiptAsPDF() {
    alert("Downloading simulated receipt PDF... (receipt file saved locally).");
    closeReceiptModal();
}

// 8. STAFF INVENTORY & STOCK LOGS CONTROL

let inventorySearchVal = "";
let inventoryFilterStock = "all";

function renderInventoryTable() {
    const tbody = document.getElementById("inventory-table-body");
    const searchVal = document.getElementById("inv-search").value.toLowerCase();
    const filterStock = document.getElementById("inv-filter-stock").value;

    const filtered = products.filter(prod => {
        const matchesSearch = prod.name.toLowerCase().includes(searchVal) || prod.sku.toLowerCase().includes(searchVal);
        let matchesStock = true;
        if (filterStock === "low") {
            matchesStock = prod.stockQty <= prod.reorderLevel && prod.stockQty > 0;
        } else if (filterStock === "out") {
            matchesStock = prod.stockQty <= 0;
        }
        return matchesSearch && matchesStock;
    });

    tbody.innerHTML = filtered.map(prod => {
        let statusTag = "";
        if (prod.stockQty <= 0) {
            statusTag = `<span class="quote-status-badge status-pending">Out of Stock</span>`;
        } else if (prod.stockQty <= prod.reorderLevel) {
            statusTag = `<span class="quote-status-badge status-approved" style="background-color:var(--amber-bg); color:var(--amber);">Low Stock</span>`;
        } else {
            statusTag = `<span class="quote-status-badge status-converted">In Stock</span>`;
        }

        return `
            <tr>
                <td style="font-family:monospace;">${prod.sku}</td>
                <td style="font-weight:600;">${prod.name}</td>
                <td>${prod.category}</td>
                <td>${prod.unit}</td>
                <td>${formatKES(prod.costPrice)}</td>
                <td>${formatKES(prod.salePrice)}</td>
                <td style="font-weight:700;">${prod.stockQty}</td>
                <td>${prod.reorderLevel}</td>
                <td>${statusTag}</td>
                <td>
                    <button class="btn-secondary" style="padding:2px 8px; font-size:0.75rem;" 
                            onclick="openAdjustStockModal('${prod.sku}')">Adjust</button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderStockLogsTable() {
    const tbody = document.getElementById("stock-log-table-body");
    if (stockLogs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-list-msg">No logs recorded yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = stockLogs.map(log => `
        <tr>
            <td style="font-size:0.75rem; color:var(--text-muted);">${log.timestamp}</td>
            <td style="font-weight:600;">${log.skuName}</td>
            <td style="font-weight:700; color:${log.direction === 'IN' ? 'var(--green)' : 'var(--red)'}">
                ${log.direction === 'IN' ? '+' : '-'}${log.changeQty}
            </td>
            <td>
                <span class="quote-status-badge ${log.direction === 'IN' ? 'status-approved' : 'status-pending'}">
                    ${log.direction}
                </span>
            </td>
            <td>${log.reason}</td>
            <td>${log.user}</td>
        </tr>
    `).join('');
}

function clearStockAdjustmentLogs() {
    stockLogs = [];
    renderStockLogsTable();
}

// Add Product Modal
function openAddProductModal() {
    document.getElementById("modal-add-product").classList.remove("hidden");
}

function closeAddProductModal() {
    document.getElementById("modal-add-product").classList.add("hidden");
}

function submitAddProduct(e) {
    e.preventDefault();
    const name = document.getElementById("prod-name").value;
    const cat = document.getElementById("prod-category").value;
    const unit = document.getElementById("prod-unit").value;
    const cost = Number(document.getElementById("prod-cost").value);
    const sale = Number(document.getElementById("prod-selling").value);
    const stock = Number(document.getElementById("prod-stock").value);
    const reorder = Number(document.getElementById("prod-reorder").value);

    // Make custom SKU
    const prefix = cat.substring(0, 3).toUpperCase();
    const count = products.filter(p => p.category === cat).length + 1;
    const sku = `${prefix}-0${count < 10 ? '0' + count : count}`;

    const newProd = {
        sku,
        name,
        category: cat,
        unit,
        costPrice: cost,
        salePrice: sale,
        stockQty: stock,
        reorderLevel: reorder
    };

    products.push(newProd);

    // Log to Stock Audit
    if (stock > 0) {
        logStockChange(sku, name, stock, "Initial product setup inventory load", "Store Manager");
    }

    closeAddProductModal();
    document.getElementById("add-product-form").reset();
    
    renderInventoryTable();
    renderStockLogsTable();
    alert(`Product ${name} added successfully as SKU ${sku}!`);
}

// Adjust Stock Level Modal
function openAdjustStockModal(sku) {
    const prod = getProductBySku(sku);
    if (!prod) return;

    document.getElementById("adjust-prod-sku").value = prod.sku;
    document.getElementById("adjust-prod-title").textContent = prod.name;
    document.getElementById("adjust-prod-current-qty").textContent = prod.stockQty;
    document.getElementById("modal-adjust-stock").classList.remove("hidden");
}

function closeAdjustStockModal() {
    document.getElementById("modal-adjust-stock").classList.add("hidden");
}

function submitAdjustStock(e) {
    e.preventDefault();
    const sku = document.getElementById("adjust-prod-sku").value;
    const changeQty = parseInt(document.getElementById("adjust-qty-change").value);
    const reasonOption = document.getElementById("adjust-reason").value;

    if (isNaN(changeQty) || changeQty === 0) {
        alert("Please enter a valid non-zero adjustment quantity.");
        return;
    }

    const prod = getProductBySku(sku);
    if (!prod) return;

    if (prod.stockQty + changeQty < 0) {
        alert("Error: Total stock cannot be adjusted below zero!");
        return;
    }

    prod.stockQty += changeQty;

    let reasonText = "";
    if (reasonOption === "restock") reasonText = "Restock replenishment supply";
    else if (reasonOption === "damage") reasonText = "Damaged inventory write-off";
    else if (reasonOption === "audit") reasonText = "Inventory physical audit correction";
    else if (reasonOption === "return") reasonText = "Customer inventory return";

    logStockChange(sku, prod.name, changeQty, reasonText, "Store Manager");

    closeAdjustStockModal();
    document.getElementById("adjust-stock-form").reset();
    
    renderInventoryTable();
    renderStockLogsTable();
}

// 9. MANAGER QUOTATION PORTAL

function renderQuotesInbox() {
    const listPanel = document.getElementById("quotes-inbox-list");
    listPanel.innerHTML = quotations.map(q => `
        <div class="quote-inbox-card ${selectedQuoteId === q.id ? 'active' : ''}" onclick="selectQuotation('${q.id}')">
            <span class="quote-status-badge ${getStatusBadgeClass(q.status)}">${q.status}</span>
            <h5>${q.customerName}</h5>
            <p><i class="fa-regular fa-clock"></i> Requested on: ${q.date}</p>
            <p><i class="fa-solid fa-phone"></i> Phone: ${q.phone}</p>
        </div>
    `).join('');

    updateQuotesBadge();
}

function selectQuotation(quoteId) {
    selectedQuoteId = quoteId;
    renderQuotesInbox();

    const quote = quotations.find(q => q.id === quoteId);
    const detailsEmpty = document.getElementById("quote-details-empty-state");
    const detailsActive = document.getElementById("quote-details-active-state");

    if (!quote) {
        detailsEmpty.classList.remove("hidden");
        detailsActive.classList.add("hidden");
        return;
    }

    detailsEmpty.classList.add("hidden");
    detailsActive.classList.remove("hidden");

    let subtotal = 0;
    const itemsRows = quote.items.map((item, idx) => {
        const prod = getProductBySku(item.sku);
        const quotedPrice = item.quotedPrice || prod.salePrice;
        subtotal += quotedPrice * item.qty;

        return `
            <tr>
                <td style="font-weight:600;">${item.name}</td>
                <td>${item.qty}</td>
                <td>${formatKES(prod.salePrice)}</td>
                <td>
                    <input type="number" min="0" value="${quotedPrice}" 
                           oninput="updateQuoteItemPrice('${quote.id}', '${item.sku}', this.value)" 
                           ${quote.status !== 'pending' ? 'disabled' : ''}>
                </td>
                <td style="font-weight:700;" id="quote-line-total-${item.sku}">
                    ${formatKES(quotedPrice * item.qty)}
                </td>
            </tr>
        `;
    }).join('');

    detailsActive.innerHTML = `
        <div class="quote-review-header">
            <span class="quote-status-badge ${getStatusBadgeClass(quote.status)}" style="float:right;">${quote.status}</span>
            <h4>Review Quote Request: ${quote.id}</h4>
            <p><strong>Customer Name:</strong> ${quote.customerName} | <strong>Phone:</strong> ${quote.phone}</p>
            ${quote.description ? `<p style="margin-top: 8px; font-style:italic;">"${quote.description}"</p>` : ''}
        </div>
        
        <table class="quote-review-items-table">
            <thead>
                <tr>
                    <th>Item Description</th>
                    <th>Qty</th>
                    <th>Standard Price</th>
                    <th>Quoted Price (KES)</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${itemsRows}
            </tbody>
        </table>

        <div class="quote-price-summary-box">
            <div class="summary-row" style="font-size:1.15rem; font-weight:700;">
                <span>Proposed Total Value:</span>
                <span id="quote-review-grand-total">${formatKES(subtotal)}</span>
            </div>
            ${quote.status === 'pending' ? `
                <div class="form-group" style="margin-top:10px; margin-bottom:0;">
                    <label for="quote-validity">Validity Period (Expiry Date)</label>
                    <input type="date" id="quote-validity" required value="2026-09-06">
                </div>
            ` : `
                <p style="margin-top: 8px; color:var(--text-secondary);">
                    <strong>Validity Expiry:</strong> ${quote.validUntil || '30 Days'}
                </p>
            `}
        </div>

        <div class="quote-action-bar">
            ${quote.status === 'pending' ? `
                <button class="btn-primary" onclick="approveQuotation('${quote.id}')">
                    <i class="fa-solid fa-check"></i> Approve & Send to Customer
                </button>
                <button class="btn-secondary" style="color:var(--red); border-color:var(--red-bg);" onclick="rejectQuotation('${quote.id}')">
                    Reject Quote
                </button>
            ` : quote.status === 'approved' ? `
                <button class="btn-primary" onclick="convertQuoteToOrder('${quote.id}')">
                    <i class="fa-solid fa-cart-shopping"></i> Convert Quote to Order
                </button>
                <span style="font-size:0.85rem; color:var(--text-muted); align-self:center;">Approved Quote waiting customer checkout conversion.</span>
            ` : `
                <span class="text-green" style="font-weight:600;"><i class="fa-solid fa-circle-check"></i> This quotation has been converted to Order.</span>
            `}
        </div>
    `;
}

function updateQuoteItemPrice(quoteId, sku, newPriceVal) {
    const quote = quotations.find(q => q.id === quoteId);
    if (!quote) return;

    const item = quote.items.find(i => i.sku === sku);
    if (!item) return;

    const newPrice = Number(newPriceVal);
    if (isNaN(newPrice) || newPrice < 0) return;

    item.quotedPrice = newPrice;
    
    // Update line total inside active view
    const lineTotalTd = document.getElementById(`quote-line-total-${sku}`);
    if (lineTotalTd) lineTotalTd.textContent = formatKES(newPrice * item.qty);

    // Update grand total
    let grand = 0;
    quote.items.forEach(it => {
        grand += (it.quotedPrice || getProductBySku(it.sku).salePrice) * it.qty;
    });
    
    document.getElementById("quote-review-grand-total").textContent = formatKES(grand);
    quote.quotedPrice = grand;
}

function approveQuotation(quoteId) {
    const quote = quotations.find(q => q.id === quoteId);
    if (!quote) return;

    const validityVal = document.getElementById("quote-validity").value;
    if (!validityVal) {
        alert("Please set a quote validity expiration date.");
        return;
    }

    quote.status = "approved";
    quote.validUntil = validityVal;
    
    // Calculate final price if not touched
    let finalTotal = 0;
    quote.items.forEach(item => {
        if (!item.quotedPrice) {
            item.quotedPrice = getProductBySku(item.sku).salePrice;
        }
        finalTotal += item.quotedPrice * item.qty;
    });
    quote.quotedPrice = finalTotal;

    selectQuotation(quoteId);
    renderQuotesInbox();
    alert(`Quotation ${quoteId} approved! Details sent back to customer callback channels.`);
}

function rejectQuotation(quoteId) {
    if (!confirm("Are you sure you want to reject this quotation?")) return;
    
    quotations = quotations.filter(q => q.id !== quoteId);
    selectedQuoteId = null;
    
    selectQuotation(null);
    renderQuotesInbox();
}

function convertQuoteToOrder(quoteId) {
    const quote = quotations.find(q => q.id === quoteId);
    if (!quote) return;

    // Confirm inventory availability before converting
    for (const item of quote.items) {
        const prod = getProductBySku(item.sku);
        if (prod.stockQty < item.qty) {
            alert(`Cannot convert quote. Item "${prod.name}" has insufficient stock (${prod.stockQty} left, quote requested ${item.qty}).`);
            return;
        }
    }

    // Deduct inventory
    const itemsDescription = [];
    quote.items.forEach(item => {
        const prod = getProductBySku(item.sku);
        prod.stockQty -= item.qty;
        itemsDescription.push(`${prod.name} (x${item.qty})`);
        
        // Stock logs
        logStockChange(prod.sku, prod.name, -item.qty, `Converted from Quotation ${quote.id}`, "Store Manager");
    });

    // Create Order
    const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
    const dateToday = new Date().toISOString().split('T')[0];

    orders.unshift({
        id: orderId,
        date: dateToday,
        items: itemsDescription.join(', '),
        type: "Pickup", // Default for quotations
        total: quote.quotedPrice,
        status: "Confirmed"
    });

    quote.status = "converted";

    selectQuotation(quoteId);
    renderQuotesInbox();
    renderCustomerOrdersTracker();
    
    alert(`Order ${orderId} created successfully from Quotation ${quote.id}!`);
}

// 10. STAFF DASHBOARD & REPORTS CONTROLLER

function renderDashboard() {
    // 1. Stat cards
    
    // Daily sales calculation
    // Today's orders values + POS values
    let totalSalesVal = 0;
    const dateToday = new Date().toISOString().split('T')[0];
    
    orders.forEach(ord => {
        if (ord.date === dateToday && ord.status !== "Cancelled") {
            totalSalesVal += ord.total;
        }
    });

    // Seed/Audit log transactions that are POS Sales also add to today's sales
    // In full setup we query sales table, here we aggregate orders + sales logs
    document.getElementById("stat-daily-sales").textContent = formatKES(totalSalesVal);

    // Stock Valuation (Selling price * qty)
    let stockValuation = 0;
    let lowStockCount = 0;
    products.forEach(p => {
        stockValuation += p.salePrice * p.stockQty;
        if (p.stockQty <= p.reorderLevel) {
            lowStockCount++;
        }
    });
    document.getElementById("stat-stock-valuation").textContent = formatKES(stockValuation);
    document.getElementById("stat-low-stock-count").textContent = lowStockCount;

    // Quote conversion rates
    const totalQuotes = quotations.length;
    const convertedQuotes = quotations.filter(q => q.status === "converted").length;
    const conversionRate = totalQuotes > 0 ? Math.round((convertedQuotes / totalQuotes) * 100) : 0;
    
    document.getElementById("stat-quote-conversion").textContent = `${conversionRate}%`;
    document.getElementById("stat-quote-numbers").textContent = `${convertedQuotes} of ${totalQuotes} converted`;

    // 2. Bar Chart updates
    const todayChartBar = document.getElementById("today-chart-bar");
    if (todayChartBar) {
        // scale height depending on sales value (capped at KES 50k for max scale height)
        const scaleVal = Math.min(100, Math.max(5, Math.round((totalSalesVal / 50000) * 100)));
        todayChartBar.style.height = `${scaleVal}%`;
    }

    // 3. Render Best Sellers list (mockup based on stock levels and demo popularity)
    const bestSellersDiv = document.getElementById("best-sellers-list-div");
    
    // Seed some counts
    const popularity = [
        { name: "Bamburi Tembo Cement (32.5N)", qtySold: 140 },
        { name: "Crown Paints Silk Emulsion Cream (4L)", qtySold: 48 },
        { name: "Reinforcement Steel Bar D12 (12mm)", qtySold: 35 },
        { name: "Tolsen Tape Measure 8M/26ft", qtySold: 28 }
    ];

    bestSellersDiv.innerHTML = popularity.map(pop => `
        <div class="best-seller-item">
            <span>${pop.name}</span>
            <span class="qty-badge">${pop.qtySold} sold</span>
        </div>
    `).join('');

    // 4. Render Helpline Callbacks list
    renderCallbackRequestsLog();
}

function renderCallbackRequestsLog() {
    const tbody = document.getElementById("callback-log-tbody");
    if (callbacks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-list-msg">No callback requests logged.</td></tr>`;
        return;
    }

    tbody.innerHTML = callbacks.map(cb => `
        <tr>
            <td style="font-size:0.75rem; color:var(--text-muted);">${cb.timestamp}</td>
            <td style="font-weight:600;">${cb.name}</td>
            <td><a href="tel:${cb.phone}" style="color:var(--accent); font-weight:500;">${cb.phone}</a></td>
            <td>${cb.query}</td>
            <td>
                <span class="quote-status-badge ${cb.status === 'completed' ? 'status-converted' : 'status-pending'}">
                    ${cb.status}
                </span>
            </td>
            <td>
                ${cb.status === 'pending' ? `
                    <button class="btn-primary" style="padding:2px 8px; font-size:0.75rem;" onclick="resolveCallback('${cb.id}')">
                        Mark Resolved
                    </button>
                ` : `
                    <span class="text-muted" style="font-size:0.8rem;">Resolved</span>
                `}
            </td>
        </tr>
    `).join('');
}

function resolveCallback(cbId) {
    const cb = callbacks.find(c => c.id === cbId);
    if (!cb) return;

    cb.status = "completed";
    renderCallbackRequestsLog();
    renderDashboard();
    alert(`Callback request for ${cb.name} marked as completed.`);
}

// 11. INITIALIZATION ON PAGE LOAD
window.onload = function() {
    // 1. Render elements
    renderCustomerCatalog();
    renderCustomerOrdersTracker();
    updateQuotesBadge();
    
    // 2. Sync POS Category filter
    renderPOSCatalog();
};
