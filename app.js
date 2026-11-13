/* ==========================================================================
   Simba Hardware Hub — Core State & Dual-Mode Controller
   ========================================================================== */

// 1. SEED DATA & DUAL-MODE API ENGINE
const API_BASE_URL = "http://localhost:8080/api";
let isApiOnline = false;

const INITIAL_CATEGORIES = ["Cement", "Steel", "Paint", "Tools", "Electricals", "Plumbing", "Building Materials"];

const INITIAL_PRODUCTS = [
    { sku: "CEM-001", name: "Bamburi Tembo Cement (32.5N)", category: "Cement", unit: "Bags", costPrice: 650, salePrice: 790, stockQty: 120, reorderLevel: 20, imageUrl: "" },
    { sku: "CEM-002", name: "Savannah Portland Cement (42.5R)", category: "Cement", unit: "Bags", costPrice: 720, salePrice: 850, stockQty: 12, reorderLevel: 15, imageUrl: "" },
    { sku: "STL-001", name: "Reinforcement Steel Bar D12 (12mm)", category: "Steel", unit: "Pieces", costPrice: 1100, salePrice: 1450, stockQty: 85, reorderLevel: 15, imageUrl: "" },
    { sku: "STL-002", name: "Reinforcement Steel Bar D10 (10mm)", category: "Steel", unit: "Pieces", costPrice: 780, salePrice: 980, stockQty: 110, reorderLevel: 20, imageUrl: "" },
    { sku: "PNT-001", name: "Crown Paints Vinyl Matt White (20L)", category: "Paint", unit: "Tins", costPrice: 7500, salePrice: 8900, stockQty: 25, reorderLevel: 5, imageUrl: "" },
    { sku: "TOL-001", name: "Stanley Claw Hammer 16oz", category: "Tools", unit: "Pieces", costPrice: 850, salePrice: 1200, stockQty: 30, reorderLevel: 5, imageUrl: "" },
    { sku: "ELC-001", name: "East African Cables Single Core 1.5mm", category: "Electricals", unit: "Rolls", costPrice: 2800, salePrice: 3400, stockQty: 50, reorderLevel: 8, imageUrl: "" },
    { sku: "PLM-001", name: "PPR Pipe PN20 (20mm x 4M)", category: "Plumbing", unit: "Pieces", costPrice: 250, salePrice: 380, stockQty: 200, reorderLevel: 30, imageUrl: "" }
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
            { sku: "PNT-001", name: "Crown Paints Vinyl Matt White (20L)", qty: 4, requestedPrice: 8900, quotedPrice: 8500 }
        ],
        quotedPrice: 34000,
        validUntil: "2026-09-30"
    }
];

const INITIAL_CALLBACKS = [
    { id: "CB-001", name: "Peter Mwangi", phone: "0725999888", query: "Need advice on pipe size for plumbing connection in Ruiru", status: "pending", timestamp: "2026-08-06 10:20" }
];

const INITIAL_ORDERS = [
    { id: "ORD-7001", date: "2026-08-06", customerName: "John Kamau", phone: "0712345678", items: "CEM-001 (x5)", type: "Pickup", deliveryArea: "", total: 3950, status: "Ready", paymentMethod: "M-Pesa" },
    { id: "ORD-6988", date: "2026-08-05", customerName: "Sarah Wambui", phone: "0722000000", items: "PNT-001 (x1)", type: "Delivery", deliveryArea: "Westlands", total: 9700, status: "Completed", paymentMethod: "Card" }
];

// App Memory State
let categories = loadState('simba_categories', INITIAL_CATEGORIES);
let products = loadState('simba_products', INITIAL_PRODUCTS);
let quotations = loadState('simba_quotations', INITIAL_QUOTATIONS);
let callbacks = loadState('simba_callbacks', INITIAL_CALLBACKS);
let orders = loadState('simba_orders', INITIAL_ORDERS);
let stockLogs = loadState('simba_stock_logs', [
    { timestamp: "2026-08-06 10:00:00", skuName: "[CEM-001] Bamburi Tembo Cement", changeQty: 50, direction: "IN", reason: "Restock replenishment", user: "Store Manager" }
]);

let customerCart = [];
let posCart = [];
let selectedPayMethod = "mpesa";
let activeView = "customer";
let activeStaffTab = "pos";
let selectedQuoteId = null;
let isStaffAuthenticated = false;

// LocalStorage helpers
function loadState(key, defaultVal) {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultVal;
}

function saveState(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
}

function syncAllState() {
    saveState('simba_categories', categories);
    saveState('simba_products', products);
    saveState('simba_quotations', quotations);
    saveState('simba_callbacks', callbacks);
    saveState('simba_orders', orders);
    saveState('simba_stock_logs', stockLogs);
}

// Audit Trail Tracker
function logStockChange(sku, name, changeQty, reason, user = "System") {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const direction = changeQty > 0 ? "IN" : "OUT";
    const logItem = {
        timestamp,
        skuName: `[${sku}] ${name}`,
        changeQty: Math.abs(changeQty),
        direction,
        reason,
        user
    };
    stockLogs.unshift(logItem);
    syncAllState();
}

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
        renderCustomerQuotesTracker();
        renderCustomerOrdersTracker();
    } else {
        custPortal.classList.add("hidden");
        staffTerminal.classList.remove("hidden");
        btnCust.classList.remove("active");
        btnStaff.classList.add("active");
        
        const loginScreen = document.getElementById("staff-login-screen");
        const mainLayout = document.getElementById("staff-main-layout");
        if (isStaffAuthenticated) {
            loginScreen.classList.add("hidden");
            mainLayout.classList.remove("hidden");
            switchStaffTab(activeStaffTab);
        } else {
            loginScreen.classList.remove("hidden");
            mainLayout.classList.add("hidden");
        }
    }
}

function handleStaffLogin(e) {
    e.preventDefault();
    const pinVal = document.getElementById("staff-pin-input").value;
    if (pinVal === "1234" || pinVal === "admin123") {
        isStaffAuthenticated = true;
        document.getElementById("staff-pin-input").value = "";
        document.getElementById("staff-login-screen").classList.add("hidden");
        document.getElementById("staff-main-layout").classList.remove("hidden");
        switchStaffTab(activeStaffTab);
    } else {
        alert("Incorrect PIN. Access Denied!");
    }
}

function handleStaffLogout() {
    isStaffAuthenticated = false;
    document.getElementById("staff-login-screen").classList.remove("hidden");
    document.getElementById("staff-main-layout").classList.add("hidden");
}

function switchStaffTab(tabName) {
    activeStaffTab = tabName;
    
    document.querySelectorAll(".staff-tab-panel").forEach(panel => panel.classList.add("hidden"));
    document.querySelectorAll(".staff-nav-item").forEach(item => item.classList.remove("active"));

    const activePanel = document.getElementById(`staff-tab-${tabName}`);
    if (activePanel) activePanel.classList.remove("hidden");

    if (tabName === "pos") {
        renderPOSCatalog();
        renderPOSCart();
    } else if (tabName === "inventory") {
        renderInventoryTable();
        renderStockLogsTable();
    } else if (tabName === "dispatch") {
        renderStaffDispatchTable();
    } else if (tabName === "quotes") {
        renderQuotesInbox();
    } else if (tabName === "copilot") {
        renderStaffCopilot();
    } else if (tabName === "dashboard") {
        renderDashboard();
    }

    const navBtn = document.querySelector(`.staff-nav-item[onclick*="'${tabName}'"]`);
    if (navBtn) navBtn.classList.add("active");
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
        case 'out for delivery': return 'status-approved';
        case 'completed': return 'status-converted';
        case 'cancelled': return 'status-pending';
        default: return 'status-pending';
    }
}

function getCategoryIcon(cat) {
    switch (cat) {
        case "Cement": return "fa-solid fa-trowel-bricks";
        case "Steel": return "fa-solid fa-bars-staggered";
        case "Paint": return "fa-solid fa-paint-roller";
        case "Tools": return "fa-solid fa-screwdriver-wrench";
        case "Electricals": return "fa-solid fa-bolt";
        case "Plumbing": return "fa-solid fa-faucet-drip";
        case "Building Materials": return "fa-solid fa-cubes-stacked";
        default: return "fa-solid fa-box";
    }
}

// 4. CUSTOMER STOREFRONT IMPLEMENTATION
let activeCustomerCategory = "All";

function renderCustomerCatalog() {
    const chipsContainer = document.getElementById("customer-category-chips");
    const gridContainer = document.getElementById("customer-product-grid");
    const quoteDropdown = document.getElementById("quote-item-dropdown");
    
    // 1. Render Category Chips dynamically
    const allCats = ["All", ...categories];
    chipsContainer.innerHTML = allCats.map(cat => `
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
            const visualHtml = prod.imageUrl 
                ? `<img src="${prod.imageUrl}" alt="${prod.name}" style="max-height: 100%; max-width: 100%; object-fit: contain; border-radius: 8px;">`
                : `<i class="${iconClass}"></i>`;
            return `
                <div class="product-card">
                    ${getStockBadge(prod.stockQty, prod.reorderLevel)}
                    <div class="prod-visual-img">
                        ${visualHtml}
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
    document.querySelectorAll(".pay-method-btn").forEach(btn => btn.classList.remove("active"));
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
    const deliveryBox = document.getElementById("delivery-details-box");
    
    if (fulfillment === "delivery") {
        deliveryBox.classList.remove("hidden");
    } else {
        deliveryBox.classList.add("hidden");
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
    let deliveryFee = 0;

    if (fulfillment === "delivery") {
        const areaSelect = document.getElementById("delivery-area");
        const selectedOption = areaSelect.options[areaSelect.selectedIndex];
        deliveryFee = Number(selectedOption.getAttribute("data-fee") || 1000);
    }
    
    total = subtotal + deliveryFee;
    document.getElementById("cart-total").textContent = formatKES(total);
}

function processCustomerCheckout() {
    if (customerCart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const fulfillment = document.getElementById("fulfillment-choice").value;
    const recipient = document.getElementById("delivery-recipient").value.trim();
    const phone = document.getElementById("delivery-phone").value.trim();
    const address = document.getElementById("delivery-address").value.trim();
    const area = document.getElementById("delivery-area").value;
    const payMethod = selectedPayMethod;
    const mpesaNo = document.getElementById("mpesa-number-input").value.trim();

    if (fulfillment === "delivery") {
        if (!recipient || !phone || !address) {
            alert("Please complete recipient name, phone, and delivery address.");
            return;
        }
    }

    if (payMethod === "mpesa" && !mpesaNo) {
        alert("Please enter your M-Pesa phone number.");
        return;
    }

    for (const item of customerCart) {
        const prod = getProductBySku(item.sku);
        if (prod.stockQty < item.qty) {
            alert(`Overselling alert! Product "${prod.name}" only has ${prod.stockQty} items left.`);
            return;
        }
    }

    const itemsDescription = [];
    customerCart.forEach(item => {
        const prod = getProductBySku(item.sku);
        prod.stockQty -= item.qty;
        itemsDescription.push(`${prod.name} (x${item.qty})`);
        
        logStockChange(prod.sku, prod.name, -item.qty, `Customer Online Order (${fulfillment})`, "Customer Portal");
    });

    const totalText = document.getElementById("cart-total").textContent;
    const totalVal = Number(totalText.replace(/[^\d.]/g, ''));

    const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
    const dateToday = new Date().toISOString().split('T')[0];
    
    orders.unshift({
        id: orderId,
        date: dateToday,
        customerName: recipient || "Online Customer",
        phone: phone || mpesaNo,
        items: itemsDescription.join(', '),
        type: fulfillment === "delivery" ? "Delivery" : "Pickup",
        deliveryArea: fulfillment === "delivery" ? area : "",
        total: totalVal,
        status: "Placed",
        paymentMethod: payMethod.toUpperCase()
    });

    syncAllState();
    customerCart = [];
    updateCartBadge();
    toggleCartDrawer();
    
    renderCustomerOrdersTracker();
    alert(`Order ${orderId} placed successfully! We will notify you as it is dispatched.`);
    renderCustomerCatalog();
}

function renderCustomerOrdersTracker() {
    const tbody = document.getElementById("customer-orders-tracker-tbody");
    tbody.innerHTML = orders.map(ord => `
        <tr>
            <td style="font-weight:600;">${ord.id}</td>
            <td>${ord.date}</td>
            <td style="max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${ord.items}</td>
            <td>${ord.type} ${ord.deliveryArea ? '(' + ord.deliveryArea + ')' : ''}</td>
            <td style="font-weight:700;">${formatKES(ord.total)}</td>
            <td><span class="quote-status-badge ${getStatusBadgeClass(ord.status)}">${ord.status}</span></td>
            <td>
                ${ord.status === "Placed" ? `<button class="btn-secondary" style="padding:2px 8px; font-size:0.75rem;" onclick="cancelCustomerOrder('${ord.id}')">Cancel</button>` : `<span class="text-muted" style="font-size:0.8rem;">Locked</span>`}
            </td>
        </tr>
    `).join('');
}

function cancelCustomerOrder(orderId) {
    const ord = orders.find(o => o.id === orderId);
    if (!ord) return;
    ord.status = "Cancelled";
    syncAllState();
    renderCustomerOrdersTracker();
    alert(`Order ${orderId} cancelled.`);
}

function renderCustomerQuotesTracker() {
    const tbody = document.getElementById("customer-quotes-tracker-tbody");
    if (quotations.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-list-msg">No active quotations found.</td></tr>`;
        return;
    }

    tbody.innerHTML = quotations.map(q => {
        const itemSummary = q.items ? q.items.map(i => `${i.qty}x ${i.name}`).join(', ') : q.description;
        return `
            <tr>
                <td style="font-weight:600;">${q.id}</td>
                <td>${q.date}</td>
                <td style="max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${itemSummary}</td>
                <td style="font-weight:700;">${q.quotedPrice > 0 ? formatKES(q.quotedPrice) : 'Pending Review'}</td>
                <td>${q.validUntil || 'N/A'}</td>
                <td><span class="quote-status-badge ${getStatusBadgeClass(q.status)}">${q.status}</span></td>
                <td>
                    ${q.status === 'approved' ? `
                        <button class="btn-primary" style="padding:4px 10px; font-size:0.75rem;" onclick="customerConvertQuoteToOrder('${q.id}')">
                            Convert & Checkout
                        </button>
                    ` : `<span class="text-muted" style="font-size:0.8rem;">No actions</span>`}
                </td>
            </tr>
        `;
    }).join('');
}

function customerConvertQuoteToOrder(quoteId) {
    const quote = quotations.find(q => q.id === quoteId);
    if (!quote || quote.status !== 'approved') return;

    for (const item of quote.items) {
        const prod = getProductBySku(item.sku);
        if (prod && prod.stockQty < item.qty) {
            alert(`Insufficient stock for ${prod.name} (${prod.stockQty} left). Please contact store helpline.`);
            return;
        }
    }

    const itemsDesc = [];
    quote.items.forEach(item => {
        const prod = getProductBySku(item.sku);
        if (prod) {
            prod.stockQty -= item.qty;
            itemsDesc.push(`${prod.name} (x${item.qty})`);
            logStockChange(prod.sku, prod.name, -item.qty, `Customer Converted Quote ${quote.id}`, "Customer Storefront");
        }
    });

    const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
    const dateToday = new Date().toISOString().split('T')[0];

    orders.unshift({
        id: orderId,
        date: dateToday,
        customerName: quote.customerName,
        phone: quote.phone,
        items: itemsDesc.join(', '),
        type: "Delivery",
        deliveryArea: "Nairobi Region",
        total: quote.quotedPrice,
        status: "Placed",
        paymentMethod: "M-Pesa"
    });

    quote.status = "converted";
    syncAllState();
    
    alert(`SMS Notification sent to ${quote.phone}: Your quote ${quote.id} was converted into Order ${orderId}!`);
    renderCustomerQuotesTracker();
    renderCustomerOrdersTracker();
    renderCustomerCatalog();
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
        query: reason || "General Helpline Request",
        status: "pending",
        timestamp
    });

    syncAllState();
    closeCallbackModal();
    alert("Request submitted! A hardware expert will contact you shortly.");
    document.getElementById("callback-request-form").reset();
}

// 6. CUSTOMER QUOTATION SYSTEM
let customerQuoteItems = [];

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
        customerQuoteItems.push({ sku, name: prod.name, qty });
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
        alert("Please add items or describe your project.");
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
            requestedPrice: prod ? prod.salePrice : 0,
            quotedPrice: 0
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

    syncAllState();
    customerQuoteItems = [];
    renderQuoteBuilderList();
    document.getElementById("quote-request-form").reset();
    
    alert(`Quotation Request ${quoteId} submitted! You can track its status in the Track Quotes section.`);
    updateQuotesBadge();
    renderCustomerQuotesTracker();
}

function updateQuotesBadge() {
    const pendingCount = quotations.filter(q => q.status === "pending").length;
    const badge = document.getElementById("pending-quotes-badge");
    if (badge) {
        if (pendingCount > 0) {
            badge.textContent = pendingCount;
            badge.classList.remove("hidden");
        } else {
            badge.classList.add("hidden");
        }
    }
}

// 7. DYNAMIC CATEGORY MANAGER MODAL
function openCategoryManagerModal() {
    document.getElementById("modal-categories").classList.remove("hidden");
    renderCategoryManagerList();
}

function closeCategoryManagerModal() {
    document.getElementById("modal-categories").classList.add("hidden");
}

function renderCategoryManagerList() {
    const ul = document.getElementById("category-manager-list-ul");
    ul.innerHTML = categories.map(cat => `
        <li>
            <span>${cat}</span>
            <i class="fa-solid fa-trash-can delete-cat-btn" onclick="deleteCategory('${cat}')"></i>
        </li>
    `).join('');
}

function submitAddCategory(e) {
    e.preventDefault();
    const input = document.getElementById("new-cat-name");
    const name = input.value.trim();
    if (!name) return;

    if (categories.includes(name)) {
        alert("Category already exists!");
        return;
    }

    categories.push(name);
    syncAllState();
    input.value = "";
    renderCategoryManagerList();
    renderCustomerCatalog();
    renderPOSCatalog();
    alert(`Category "${name}" added successfully!`);
}

function deleteCategory(catName) {
    if (!confirm(`Are you sure you want to delete category "${catName}"?`)) return;
    categories = categories.filter(c => c !== catName);
    syncAllState();
    renderCategoryManagerList();
    renderCustomerCatalog();
    renderPOSCatalog();
}

// 8. STAFF POS & INVENTORY CONTROLLERS
function renderPOSCatalog() {
    const grid = document.getElementById("pos-products-grid");
    const categorySelect = document.getElementById("pos-category-select");

    categorySelect.innerHTML = `<option value="all">All Categories</option>` + 
        categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');

    const searchVal = document.getElementById("pos-search-input").value.toLowerCase();
    const selectCat = categorySelect.value;

    const filtered = products.filter(prod => {
        const matchesCategory = selectCat === "all" || prod.category === selectCat;
        const matchesSearch = prod.name.toLowerCase().includes(searchVal) || prod.sku.toLowerCase().includes(searchVal);
        return matchesCategory && matchesSearch;
    });

    grid.innerHTML = filtered.map(prod => `
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
    `).join('');
}

function filterPOSCatalog() {
    renderPOSCatalog();
}

function addToPOSCart(sku) {
    const prod = getProductBySku(sku);
    if (!prod || prod.stockQty <= 0) return;

    const existing = posCart.find(item => item.sku === sku);
    if (existing) {
        if (existing.qty < prod.stockQty) existing.qty++;
    } else {
        posCart.push({ sku, qty: 1 });
    }

    renderPOSCart();
}

function renderPOSCart() {
    const container = document.getElementById("pos-cart-items");
    if (posCart.length === 0) {
        container.innerHTML = `<div class="empty-pos-msg"><i class="fa-solid fa-cart-arrow-down"></i><p>Cart is empty.</p></div>`;
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
                <input type="number" class="pos-cart-qty-input" value="${item.qty}" min="1" onchange="updatePOSCartQty('${item.sku}', this.value)">
                <i class="fa-regular fa-trash-can pos-cart-item-remove" onclick="removePOSCartItem('${item.sku}')"></i>
            </div>
        `;
    }).join('');

    const vatAmt = subtotal * 0.16;
    document.getElementById("pos-subtotal").textContent = formatKES(subtotal - vatAmt);
    document.getElementById("pos-tax").textContent = formatKES(vatAmt);
    document.getElementById("pos-total").textContent = formatKES(subtotal);
}

function updatePOSCartQty(sku, val) {
    const prod = getProductBySku(sku);
    const cartItem = posCart.find(item => item.sku === sku);
    if (!cartItem || !prod) return;

    const q = parseInt(val);
    if (isNaN(q) || q <= 0) {
        posCart = posCart.filter(item => item.sku !== sku);
    } else {
        cartItem.qty = Math.min(q, prod.stockQty);
    }
    renderPOSCart();
}

function removePOSCartItem(sku) {
    posCart = posCart.filter(item => item.sku !== sku);
    renderPOSCart();
}

function togglePosPaymentDetails() {
    const type = document.getElementById("pos-payment-type").value;
    const refBox = document.getElementById("pos-mpesa-wrapper");
    if (type === "mpesa") refBox.classList.remove("hidden");
    else refBox.classList.add("hidden");
}

function processPOSSale() {
    if (posCart.length === 0) return;

    const receiptItems = [];
    let subtotal = 0;

    posCart.forEach(item => {
        const prod = getProductBySku(item.sku);
        prod.stockQty -= item.qty;
        const lineVal = prod.salePrice * item.qty;
        subtotal += lineVal;

        receiptItems.push({ name: prod.name, qty: item.qty, unitPrice: prod.salePrice, total: lineVal });
        logStockChange(prod.sku, prod.name, -item.qty, `In-Store POS Sale`, "Cashier T1");
    });

    syncAllState();
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
            <strong>Cashier ID:</strong> Cashier T1
        </div>
        <div class="divider"></div>
        <table class="receipt-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th class="align-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${receiptItems.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td class="align-right">${formatKES(i.total).replace("KES ", "")}</td></tr>`).join('')}
            </tbody>
        </table>
        <div class="divider"></div>
        <div class="receipt-totals">
            <div class="totals-row total-highlight">
                <span>TOTAL PAID:</span>
                <span>${formatKES(subtotal)}</span>
            </div>
        </div>
    `;

    document.getElementById("modal-receipt").classList.remove("hidden");
    posCart = [];
    renderPOSCart();
    renderPOSCatalog();
}

function closeReceiptModal() {
    document.getElementById("modal-receipt").classList.add("hidden");
}

function downloadReceiptAsPDF() {
    alert("Saving PDF receipt locally...");
    closeReceiptModal();
}

// 9. INVENTORY TABLE
function renderInventoryTable() {
    const tbody = document.getElementById("inventory-table-body");
    const searchVal = document.getElementById("inv-search").value.toLowerCase();
    const filterStock = document.getElementById("inv-filter-stock").value;

    const filtered = products.filter(prod => {
        const matchesSearch = prod.name.toLowerCase().includes(searchVal) || prod.sku.toLowerCase().includes(searchVal);
        let matchesStock = true;
        if (filterStock === "low") matchesStock = prod.stockQty <= prod.reorderLevel && prod.stockQty > 0;
        else if (filterStock === "out") matchesStock = prod.stockQty <= 0;
        return matchesSearch && matchesStock;
    });

    tbody.innerHTML = filtered.map(prod => `
        <tr>
            <td style="font-family:monospace;">${prod.sku}</td>
            <td style="font-weight:600;">${prod.name}</td>
            <td>${prod.category}</td>
            <td>${prod.unit}</td>
            <td>${formatKES(prod.costPrice)}</td>
            <td>${formatKES(prod.salePrice)}</td>
            <td style="font-weight:700;">${prod.stockQty}</td>
            <td>${prod.reorderLevel}</td>
            <td>${getStockBadge(prod.stockQty, prod.reorderLevel)}</td>
            <td>
                <button class="btn-secondary" style="padding:2px 8px; font-size:0.75rem;" onclick="openAdjustStockModal('${prod.sku}')">Adjust</button>
                <button class="btn-secondary" style="padding:2px 8px; font-size:0.75rem; color:var(--red); border-color:var(--red-bg);" onclick="deleteProduct('${prod.sku}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function deleteProduct(sku) {
    const prod = getProductBySku(sku);
    if (!prod) return;
    if (!confirm(`Are you sure you want to delete "${prod.name}"?`)) return;

    products = products.filter(p => p.sku !== sku);
    logStockChange(sku, prod.name, -prod.stockQty, "Product deleted from database", "Store Manager");
    syncAllState();
    
    renderInventoryTable();
    renderCustomerCatalog();
    renderPOSCatalog();
    alert(`Product ${prod.name} deleted.`);
}

function openAddProductModal() {
    const catSelect = document.getElementById("prod-category");
    catSelect.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
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
    const imageUrl = document.getElementById("prod-image-url").value.trim();

    const prefix = cat.substring(0, 3).toUpperCase();
    const count = products.filter(p => p.category === cat).length + 1;
    const sku = `${prefix}-0${count < 10 ? '0' + count : count}`;

    products.push({ sku, name, category: cat, unit, costPrice: cost, salePrice: sale, stockQty: stock, reorderLevel: reorder, imageUrl });
    syncAllState();

    if (stock > 0) logStockChange(sku, name, stock, "Initial product setup load", "Store Manager");

    closeAddProductModal();
    document.getElementById("add-product-form").reset();
    renderInventoryTable();
    alert(`Product ${name} added!`);
}

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

    const prod = getProductBySku(sku);
    if (!prod || isNaN(changeQty) || changeQty === 0) return;

    prod.stockQty += changeQty;
    syncAllState();
    logStockChange(sku, prod.name, changeQty, `Stock Adjustment: ${reasonOption}`, "Store Manager");

    closeAdjustStockModal();
    renderInventoryTable();
}

function renderStockLogsTable() {
    const tbody = document.getElementById("stock-log-table-body");
    tbody.innerHTML = stockLogs.map(log => `
        <tr>
            <td style="font-size:0.75rem; color:var(--text-muted);">${log.timestamp}</td>
            <td style="font-weight:600;">${log.skuName}</td>
            <td style="font-weight:700; color:${log.direction === 'IN' ? 'var(--green)' : 'var(--red)'}">${log.direction === 'IN' ? '+' : '-'}${log.changeQty}</td>
            <td><span class="quote-status-badge ${log.direction === 'IN' ? 'status-approved' : 'status-pending'}">${log.direction}</span></td>
            <td>${log.reason}</td>
            <td>${log.user}</td>
        </tr>
    `).join('');
}

function clearStockAdjustmentLogs() {
    stockLogs = [];
    syncAllState();
    renderStockLogsTable();
}

// 10. ORDERS & DISPATCH DASHBOARD
function renderStaffDispatchTable() {
    const tbody = document.getElementById("staff-dispatch-table-tbody");
    tbody.innerHTML = orders.map(ord => `
        <tr>
            <td style="font-weight:600;">${ord.id}</td>
            <td>${ord.date}</td>
            <td><strong>${ord.customerName}</strong><br><small style="color:var(--text-secondary);">${ord.phone}</small></td>
            <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${ord.items}</td>
            <td>${ord.type} ${ord.deliveryArea ? '<b>(' + ord.deliveryArea + ')</b>' : ''}</td>
            <td style="font-weight:700;">${formatKES(ord.total)}</td>
            <td><span class="quote-status-badge ${getStatusBadgeClass(ord.status)}">${ord.status}</span></td>
            <td>
                <select style="padding:4px; font-size:0.75rem;" onchange="advanceOrderStatus('${ord.id}', this.value)">
                    <option value="">Update Status...</option>
                    <option value="Confirmed">Mark Confirmed</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Completed">Mark Completed</option>
                    <option value="Cancelled">Cancel Order</option>
                </select>
            </td>
        </tr>
    `).join('');
}

function advanceOrderStatus(orderId, newStatus) {
    if (!newStatus) return;
    const ord = orders.find(o => o.id === orderId);
    if (!ord) return;
    ord.status = newStatus;
    syncAllState();
    renderStaffDispatchTable();
    renderCustomerOrdersTracker();
    alert(`Order ${orderId} status updated to: ${newStatus}`);
}

// 11. STAFF QUOTATION MANAGER
function renderQuotesInbox() {
    const listPanel = document.getElementById("quotes-inbox-list");
    listPanel.innerHTML = quotations.map(q => `
        <div class="quote-inbox-card ${selectedQuoteId === q.id ? 'active' : ''}" onclick="selectQuotation('${q.id}')">
            <span class="quote-status-badge ${getStatusBadgeClass(q.status)}">${q.status}</span>
            <h5>${q.customerName}</h5>
            <p><i class="fa-regular fa-clock"></i> Date: ${q.date}</p>
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
    const itemsRows = quote.items ? quote.items.map((item, idx) => {
        const prod = getProductBySku(item.sku);
        const quotedPrice = item.quotedPrice || (prod ? prod.salePrice : 0);
        subtotal += quotedPrice * item.qty;

        return `
            <tr>
                <td style="font-weight:600;">${item.name}</td>
                <td>${item.qty}</td>
                <td>${formatKES(prod ? prod.salePrice : 0)}</td>
                <td><input type="number" min="0" value="${quotedPrice}" oninput="updateQuoteItemPrice('${quote.id}', '${item.sku}', this.value)" ${quote.status !== 'pending' ? 'disabled' : ''}></td>
                <td style="font-weight:700;" id="quote-line-total-${item.sku}">${formatKES(quotedPrice * item.qty)}</td>
            </tr>
        `;
    }).join('') : '';

    detailsActive.innerHTML = `
        <div class="quote-review-header">
            <span class="quote-status-badge ${getStatusBadgeClass(quote.status)}" style="float:right;">${quote.status}</span>
            <h4>Review Quote Request: ${quote.id}</h4>
            <p><strong>Customer:</strong> ${quote.customerName} | <strong>Phone:</strong> ${quote.phone}</p>
        </div>
        <table class="quote-review-items-table">
            <thead>
                <tr><th>Item</th><th>Qty</th><th>Standard</th><th>Quoted Price</th><th>Total</th></tr>
            </thead>
            <tbody>${itemsRows}</tbody>
        </table>
        <div class="quote-price-summary-box">
            <div class="summary-row" style="font-weight:700;">
                <span>Total Value:</span>
                <span id="quote-review-grand-total">${formatKES(subtotal)}</span>
            </div>
            ${quote.status === 'pending' ? `<div class="form-group" style="margin-top:10px;"><label>Expiry Date</label><input type="date" id="quote-validity" value="2026-09-30"></div>` : ''}
        </div>
        <div class="quote-action-bar">
            ${quote.status === 'pending' ? `
                <button class="btn-primary" onclick="approveQuotation('${quote.id}')"><i class="fa-solid fa-check"></i> Approve Quote</button>
            ` : `<span class="text-green"><i class="fa-solid fa-circle-check"></i> Quotation processed.</span>`}
        </div>
    `;
}

function updateQuoteItemPrice(quoteId, sku, val) {
    const quote = quotations.find(q => q.id === quoteId);
    if (!quote) return;
    const item = quote.items.find(i => i.sku === sku);
    if (!item) return;

    item.quotedPrice = Number(val);
    let grand = 0;
    quote.items.forEach(it => grand += (it.quotedPrice || 0) * it.qty);
    quote.quotedPrice = grand;
    document.getElementById("quote-review-grand-total").textContent = formatKES(grand);
}

function approveQuotation(quoteId) {
    const quote = quotations.find(q => q.id === quoteId);
    if (!quote) return;

    quote.status = "approved";
    quote.validUntil = document.getElementById("quote-validity").value || "2026-09-30";
    syncAllState();
    
    selectQuotation(quoteId);
    renderQuotesInbox();
    renderCustomerQuotesTracker();
    alert(`Quotation ${quoteId} approved!`);
}

// 12. DASHBOARD & REPORTS
function renderDashboard() {
    let totalSalesVal = 0;
    orders.forEach(ord => { if (ord.status !== "Cancelled") totalSalesVal += ord.total; });

    let stockValuation = 0;
    let lowStockCount = 0;
    products.forEach(p => {
        stockValuation += p.salePrice * p.stockQty;
        if (p.stockQty <= p.reorderLevel) lowStockCount++;
    });

    document.getElementById("stat-daily-sales").textContent = formatKES(totalSalesVal);
    document.getElementById("stat-stock-valuation").textContent = formatKES(stockValuation);
    document.getElementById("stat-low-stock-count").textContent = lowStockCount;

    renderCallbackRequestsLog();
}

function renderCallbackRequestsLog() {
    const tbody = document.getElementById("callback-log-tbody");
    tbody.innerHTML = callbacks.map(cb => `
        <tr>
            <td style="font-size:0.75rem;">${cb.timestamp}</td>
            <td style="font-weight:600;">${cb.name}</td>
            <td><a href="tel:${cb.phone}">${cb.phone}</a></td>
            <td>${cb.query}</td>
            <td><span class="quote-status-badge ${cb.status === 'completed' ? 'status-converted' : 'status-pending'}">${cb.status}</span></td>
            <td>${cb.status === 'pending' ? `<button class="btn-primary" style="padding:2px 8px; font-size:0.75rem;" onclick="resolveCallback('${cb.id}')">Resolve</button>` : 'Resolved'}</td>
        </tr>
    `).join('');
}

function resolveCallback(cbId) {
    const cb = callbacks.find(c => c.id === cbId);
    if (!cb) return;
    cb.status = "completed";
    syncAllState();
    renderCallbackRequestsLog();
}

// ==========================================================================
// 13. FUNDI SIMBA AI CHAT ASSISTANT (CUSTOMER STOREFRONT)
// ==========================================================================

let aiSettings = loadState('simba_ai_settings', {
    mode: 'smart-local',
    apiKey: ''
});

const DEFAULT_AI_MESSAGES = [
    {
        sender: 'assistant',
        text: `Habari! I am <strong>Fundi Simba</strong>, your AI Hardware & Construction Assistant. 🔨<br><br>
I can calculate construction materials for walls, concrete slabs, roofing, or paint coverage, search our live inventory, and add items directly to your shopping cart or quotation!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
];

let aiChatMessages = loadState('simba_ai_chat', DEFAULT_AI_MESSAGES);
let isAiWindowOpen = false;

function initAI() {
    renderAIChat();
    // Check if API key exists in settings
    const keyInput = document.getElementById("gemini-api-key");
    const modeSelect = document.getElementById("ai-mode-select");
    if (keyInput && aiSettings.apiKey) keyInput.value = aiSettings.apiKey;
    if (modeSelect && aiSettings.mode) modeSelect.value = aiSettings.mode;
    toggleApiKeyInput();
}

function toggleAIAssistant() {
    const win = document.getElementById("ai-chat-window");
    if (!win) return;
    isAiWindowOpen = !isAiWindowOpen;
    if (isAiWindowOpen) {
        win.classList.remove("hidden");
        renderAIChat();
        setTimeout(() => {
            const input = document.getElementById("ai-chat-input");
            if (input) input.focus();
        }, 150);
    } else {
        win.classList.add("hidden");
    }
}

function openAISettingsModal() {
    const modal = document.getElementById("modal-ai-settings");
    if (modal) modal.classList.remove("hidden");
}

function closeAISettingsModal() {
    const modal = document.getElementById("modal-ai-settings");
    if (modal) modal.classList.add("hidden");
}

function toggleApiKeyInput() {
    const mode = document.getElementById("ai-mode-select")?.value;
    const group = document.getElementById("gemini-key-group");
    if (group) {
        group.style.display = (mode === "gemini-cloud") ? "block" : "none";
    }
}

function saveAISettings(e) {
    e.preventDefault();
    const mode = document.getElementById("ai-mode-select").value;
    const key = document.getElementById("gemini-api-key").value.trim();
    aiSettings = { mode, apiKey: key };
    saveState('simba_ai_settings', aiSettings);
    closeAISettingsModal();
    alert("AI settings saved successfully!");
}

function clearAIChat() {
    if (!confirm("Clear your chat history with Fundi Simba?")) return;
    aiChatMessages = [...DEFAULT_AI_MESSAGES];
    saveState('simba_ai_chat', aiChatMessages);
    renderAIChat();
}

function renderAIChat() {
    const body = document.getElementById("ai-chat-body");
    if (!body) return;

    body.innerHTML = aiChatMessages.map(msg => {
        const isUser = msg.sender === 'user';
        return `
            <div class="ai-msg ${isUser ? 'user' : 'assistant'}">
                <div class="ai-msg-avatar">
                    <i class="fa-solid ${isUser ? 'fa-user' : 'fa-helmet-safety'}"></i>
                </div>
                <div class="ai-msg-bubble">
                    ${msg.text}
                </div>
            </div>
        `;
    }).join('');

    body.scrollTop = body.scrollHeight;
}

function sendAIPrompt(text) {
    if (!isAiWindowOpen) toggleAIAssistant();
    const input = document.getElementById("ai-chat-input");
    if (input) {
        input.value = text;
        handleAIChatSubmit(new Event('submit'));
    }
}

async function handleAIChatSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById("ai-chat-input");
    const userText = input ? input.value.trim() : "";
    if (!userText) return;

    // Add user message
    aiChatMessages.push({
        sender: 'user',
        text: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    input.value = "";
    saveState('simba_ai_chat', aiChatMessages);
    renderAIChat();

    // Show temporary typing indicator
    const body = document.getElementById("ai-chat-body");
    const typingIndicator = document.createElement("div");
    typingIndicator.className = "ai-msg assistant typing-msg";
    typingIndicator.innerHTML = `
        <div class="ai-msg-avatar"><i class="fa-solid fa-helmet-safety"></i></div>
        <div class="ai-msg-bubble"><i class="fa-solid fa-circle-notch fa-spin"></i> Calculating materials & checking stock...</div>
    `;
    body.appendChild(typingIndicator);
    body.scrollTop = body.scrollHeight;

    // Process with Domain AI Engine or Gemini
    try {
        const aiResponse = await generateAIResponse(userText);
        typingIndicator.remove();
        aiChatMessages.push({
            sender: 'assistant',
            text: aiResponse,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        saveState('simba_ai_chat', aiChatMessages);
        renderAIChat();
    } catch (err) {
        typingIndicator.remove();
        const fallback = generateLocalDomainResponse(userText);
        aiChatMessages.push({
            sender: 'assistant',
            text: fallback,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        saveState('simba_ai_chat', aiChatMessages);
        renderAIChat();
    }
}

async function generateAIResponse(prompt) {
    if (aiSettings.mode === "gemini-cloud" && aiSettings.apiKey) {
        try {
            const contextCatalog = products.map(p => `${p.name} (SKU: ${p.sku}) - KES ${p.salePrice} per ${p.unit}, In Stock: ${p.stockQty}`).join("\n");
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(aiSettings.apiKey)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [
                                {
                                    text: `You are 'Fundi Simba', a friendly and expert construction hardware assistant for Simba Hardware in Kenya.
Our live products catalog:
${contextCatalog}

When the user asks for construction calculations (e.g. wall, concrete, paint, electrical, pipes), estimate exact quantities using standard Kenyan construction practices.
Recommend matching SKUs from our catalog. Mention accurate KES prices.
Provide concise HTML formatted text without markdown backticks.`
                                },
                                { text: prompt }
                            ]
                        }
                    ]
                })
            });

            if (response.ok) {
                const data = await response.json();
                const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (reply) return reply;
            }
        } catch (e) {
            console.warn("Gemini API call failed, falling back to local engine:", e);
        }
    }

    return generateLocalDomainResponse(prompt);
}

// Built-in Smart Domain Engine for Hardware Calculations & Catalog Matching
function generateLocalDomainResponse(prompt) {
    const lower = prompt.toLowerCase();
    let reply = "";
    let recItems = [];

    // 1. WALL & MASONRY ESTIMATION
    if (lower.includes("wall") || lower.includes("brick") || lower.includes("block") || lower.includes("masonry") || lower.includes("cement") && lower.includes("sand")) {
        // Look for dimensions e.g. "10m x 2.5m" or numbers
        const numMatches = prompt.match(/\d+(\.\d+)?/g);
        let length = 10;
        let height = 2.5;

        if (numMatches && numMatches.length >= 2) {
            length = parseFloat(numMatches[0]);
            height = parseFloat(numMatches[1]);
        } else if (numMatches && numMatches.length === 1) {
            length = parseFloat(numMatches[0]);
        }

        const area = (length * height).toFixed(1);
        // Approx 12.5 blocks/m² for 9" or 6" blocks, or ~50 bricks
        const blocksNeeded = Math.round(area * 12.5);
        // Approx 1 bag 32.5N cement per 35 blocks for 1:4 mortar
        const cementBags = Math.max(2, Math.round(blocksNeeded / 35));
        // Approx 1 ton of river sand per 10 bags cement
        const sandTons = (cementBags * 0.1).toFixed(1);

        const cementProd = getProductBySku("CEM-001") || products.find(p => p.category === "Cement");
        const hammerProd = getProductBySku("TOL-001");

        reply = `
            <p><strong>🧱 Wall Construction Estimate (${length}m × ${height}m = ${area} m²):</strong></p>
            <div class="ai-calc-box">
                • <strong>Estimated Blocks / Stones:</strong> ~${blocksNeeded} pieces (Standard 9" stone blocks)<br>
                • <strong>Mortar Cement (32.5N):</strong> ~<strong>${cementBags} bags</strong> (1:4 standard mix)<br>
                • <strong>Clean River Sand:</strong> ~${sandTons} Tons<br>
                • <strong>DPC (Damp Proof Course):</strong> 1 roll recommended for base damp proofing.
            </div>
            <p>Here are the recommended items from our live inventory:</p>
        `;

        if (cementProd) recItems.push({ sku: cementProd.sku, qty: cementBags });
        if (hammerProd) recItems.push({ sku: hammerProd.sku, qty: 1 });

    // 2. PAINT ESTIMATOR
    } else if (lower.includes("paint") || lower.includes("primer") || lower.includes("sqm") || lower.includes("square meter") || lower.includes("room") || lower.includes("house")) {
        const numMatches = prompt.match(/\d+(\.\d+)?/g);
        let area = 150;
        if (numMatches && numMatches.length >= 1) {
            area = parseFloat(numMatches[0]);
        }

        // 20L tin covers approx 70-80 sqm (2 coats)
        const tinsNeeded = Math.max(1, Math.ceil(area / 75));
        const paintProd = getProductBySku("PNT-001") || products.find(p => p.category === "Paint");

        reply = `
            <p><strong>🎨 Paint Coverage Estimate for ~${area} m²:</strong></p>
            <div class="ai-calc-box">
                • <strong>Surface Area:</strong> ~${area} m² (2 coats coverage)<br>
                • <strong>Required Volume:</strong> ~${tinsNeeded * 20} Litres<br>
                • <strong>20L Tins Needed:</strong> <strong>${tinsNeeded} tin${tinsNeeded > 1 ? 's' : ''}</strong> (Vinyl Matt White / Emulsion)
            </div>
            <p>Stock available in store:</p>
        `;

        if (paintProd) recItems.push({ sku: paintProd.sku, qty: tinsNeeded });

    // 3. STEEL & REBAR
    } else if (lower.includes("steel") || lower.includes("rebar") || lower.includes("d12") || lower.includes("d10") || lower.includes("iron bar")) {
        const steelD12 = getProductBySku("STL-001");
        const steelD10 = getProductBySku("STL-002");

        reply = `
            <p><strong>🔩 Reinforcement Steel Bars (High Tensile Grade):</strong></p>
            <div class="ai-calc-box">
                • <strong>D12 (12mm):</strong> Ideal for structural columns, main foundation beams, and lintels.<br>
                • <strong>D10 (10mm):</strong> Used for slab mesh, stirrups/rings, and secondary reinforcement.
            </div>
            <p>Current in-stock rebar products:</p>
        `;

        if (steelD12) recItems.push({ sku: steelD12.sku, qty: 10 });
        if (steelD10) recItems.push({ sku: steelD10.sku, qty: 10 });

    // 4. ELECTRICAL & PLUMBING
    } else if (lower.includes("electrical") || lower.includes("wire") || lower.includes("cable") || lower.includes("plumb") || lower.includes("pipe") || lower.includes("ppr")) {
        const cableProd = getProductBySku("ELC-001");
        const pprProd = getProductBySku("PLM-001");

        reply = `
            <p><strong>⚡ Piping & Wiring Specifications:</strong></p>
            <div class="ai-calc-box">
                • <strong>Lighting & Sockets:</strong> 1.5mm Single Core copper cables for lighting circuits; 2.5mm for standard 13A socket rings.<br>
                • <strong>Water Supply:</strong> PPR PN20 (20mm or 25mm) high-pressure hot/cold potable water pipes.
            </div>
            <p>Verified store products ready for dispatch:</p>
        `;

        if (cableProd) recItems.push({ sku: cableProd.sku, qty: 2 });
        if (pprProd) recItems.push({ sku: pprProd.sku, qty: 5 });

    // 5. DIRECT PRODUCT SEARCH & GENERAL QUERY
    } else {
        // Search through catalog
        const matchingProds = products.filter(p => {
            const words = lower.split(/\s+/);
            return words.some(w => w.length > 2 && (p.name.toLowerCase().includes(w) || p.category.toLowerCase().includes(w)));
        });

        if (matchingProds.length > 0) {
            reply = `<p>Found <strong>${matchingProds.length}</strong> matching item(s) in our live inventory:</p>`;
            matchingProds.slice(0, 3).forEach(p => {
                recItems.push({ sku: p.sku, qty: 1 });
            });
        } else {
            reply = `
                <p>I understand! We carry a full range of <strong>Cement, Steel, Paint, Tools, Electricals, Plumbing</strong>, and general <strong>Building Materials</strong>.</p>
                <p>Try asking me to:</p>
                <div class="ai-calc-box">
                    • <em>"Calculate cement & sand for a 15m perimeter wall"</em><br>
                    • <em>"How many tins of paint for 200 sqm?"</em><br>
                    • <em>"What is the price of D12 steel bar?"</em>
                </div>
            `;
            const sampleProd = products[0];
            if (sampleProd) recItems.push({ sku: sampleProd.sku, qty: 1 });
        }
    }

    // Build Recommendation Cards HTML
    if (recItems.length > 0) {
        let cardsHtml = `<div class="ai-item-recommendations">`;
        recItems.forEach(item => {
            const p = getProductBySku(item.sku);
            if (!p) return;
            const inStock = p.stockQty > 0;
            cardsHtml += `
                <div class="ai-rec-card">
                    <div class="ai-rec-info">
                        <h6>${p.name}</h6>
                        <span class="ai-rec-sku">${p.sku} • In stock: ${p.stockQty} ${p.unit}</span>
                    </div>
                    <div style="text-align:right;">
                        <div class="ai-rec-price">${formatKES(p.salePrice)}</div>
                        ${inStock ? `<button type="button" class="ai-rec-btn" onclick="aiAddToCart('${p.sku}', ${item.qty})"><i class="fa-solid fa-cart-plus"></i> Add ${item.qty}</button>` : `<span class="badge" style="background:var(--red-bg); color:var(--red); font-size:0.7rem;">Out of stock</span>`}
                    </div>
                </div>
            `;
        });
        cardsHtml += `</div>`;

        // Bulk action bar
        const itemsPayload = encodeURIComponent(JSON.stringify(recItems));
        cardsHtml += `
            <div class="ai-bulk-add-bar">
                <button type="button" class="ai-bulk-add-btn" onclick="aiAddAllToCart('${itemsPayload}')">
                    <i class="fa-solid fa-cart-shopping"></i> Add All to Cart
                </button>
                <button type="button" class="ai-bulk-add-btn" style="background:transparent; color:var(--text-primary); border-color:var(--border-color);" onclick="aiAddToQuote('${itemsPayload}')">
                    <i class="fa-solid fa-file-invoice"></i> Request Quote
                </button>
            </div>
        `;

        reply += cardsHtml;
    }

    return reply;
}

function aiAddToCart(sku, qty = 1) {
    const prod = getProductBySku(sku);
    if (!prod) return;
    if (prod.stockQty <= 0) {
        alert("Sorry, this item is currently out of stock.");
        return;
    }

    const existing = customerCart.find(item => item.sku === sku);
    if (existing) {
        const newQty = existing.qty + qty;
        existing.qty = Math.min(newQty, prod.stockQty);
    } else {
        customerCart.push({ sku, qty: Math.min(qty, prod.stockQty) });
    }

    updateCartBadge();
    renderCustomerCart();
    
    // Open cart drawer to confirm
    const drawer = document.getElementById("cart-drawer-panel");
    if (drawer && !drawer.classList.contains("open")) {
        drawer.classList.add("open");
    }
}

function aiAddAllToCart(encodedJson) {
    try {
        const items = JSON.parse(decodeURIComponent(encodedJson));
        let addedCount = 0;
        items.forEach(it => {
            const prod = getProductBySku(it.sku);
            if (prod && prod.stockQty > 0) {
                const existing = customerCart.find(c => c.sku === it.sku);
                const addQty = Math.min(it.qty, prod.stockQty);
                if (existing) {
                    existing.qty = Math.min(existing.qty + addQty, prod.stockQty);
                } else {
                    customerCart.push({ sku: it.sku, qty: addQty });
                }
                addedCount++;
            }
        });

        updateCartBadge();
        renderCustomerCart();

        const drawer = document.getElementById("cart-drawer-panel");
        if (drawer) drawer.classList.add("open");

        alert(`Added ${addedCount} recommended product(s) to your Cart!`);
    } catch (e) {
        console.error("Failed to add all items to cart:", e);
    }
}

function aiAddToQuote(encodedJson) {
    try {
        const items = JSON.parse(decodeURIComponent(encodedJson));
        items.forEach(it => {
            const prod = getProductBySku(it.sku);
            if (prod) {
                const existing = customerQuoteItems.find(q => q.sku === it.sku);
                if (existing) {
                    existing.qty += it.qty;
                } else {
                    customerQuoteItems.push({
                        sku: it.sku,
                        name: prod.name,
                        qty: it.qty
                    });
                }
            }
        });

        renderQuoteBuilderList();
        const quoteSection = document.getElementById("quotation-section");
        if (quoteSection) {
            quoteSection.scrollIntoView({ behavior: 'smooth' });
        }
        alert("Items added to your Quotation Request form!");
    } catch (e) {
        console.error("Failed to add items to quotation:", e);
    }
}


// ==========================================================================
// 14. CONTRACTOR BOQ & MATERIAL LIST SCANNER
// ==========================================================================

let parsedBOQItems = [];

const BOQ_SAMPLES = {
    masonry: `50 bags Bamburi Tembo Cement (32.5N)
25 pieces Reinforcement Steel Bar D12 (12mm)
15 pieces Reinforcement Steel Bar D10 (10mm)
2 pieces Stanley Claw Hammer 16oz`,
    electrical: `3 rolls East African Cables Single Core 1.5mm
50 pieces PVC Conduits 20mm
1 piece 6-way Consumer Unit distribution board`,
    plumbing: `15 pieces PPR Pipe PN20 (20mm x 4M)
10 pieces PPR Equal Elbow 20mm
2 pieces PPR Gate Valve 20mm
1 tin Crown Paints Vinyl Matt White (20L)`
};

function loadBOQSample(type) {
    const input = document.getElementById("boq-raw-input");
    if (input && BOQ_SAMPLES[type]) {
        input.value = BOQ_SAMPLES[type];
        processBOQScan();
    }
}

function clearBOQScanner() {
    const input = document.getElementById("boq-raw-input");
    if (input) input.value = "";
    parsedBOQItems = [];
    const container = document.getElementById("boq-results-container");
    if (container) container.classList.add("hidden");
}

function processBOQScan() {
    const input = document.getElementById("boq-raw-input");
    const rawText = input ? input.value.trim() : "";
    if (!rawText) {
        alert("Please paste or type a material list into the text box.");
        return;
    }

    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    parsedBOQItems = [];
    let grandTotal = 0;
    let matchedCount = 0;

    lines.forEach(line => {
        // Extract quantity from start or middle of line
        const qtyMatch = line.match(/^\d+/) || line.match(/(\d+)\s*(bags?|pcs?|pieces?|rolls?|tins?|meters?|m|kgs?)/i) || line.match(/\d+/);
        let qty = qtyMatch ? parseInt(qtyMatch[0], 10) : 1;
        if (isNaN(qty) || qty <= 0) qty = 1;

        // Clean query text
        const queryText = line.replace(/^\d+[\s\.\-\)]*/, '').trim().toLowerCase();

        // Match against live products catalog
        let bestMatch = null;
        let highestScore = 0;

        products.forEach(prod => {
            const nameLower = prod.name.toLowerCase();
            const skuLower = prod.sku.toLowerCase();
            const catLower = prod.category.toLowerCase();
            let score = 0;

            // Direct SKU match
            if (line.toUpperCase().includes(prod.sku)) score += 100;
            // Name keyword matching
            const queryWords = queryText.split(/[\s,]+/);
            queryWords.forEach(w => {
                if (w.length > 2) {
                    if (nameLower.includes(w)) score += 10;
                    if (skuLower.includes(w)) score += 15;
                    if (catLower.includes(w)) score += 5;
                }
            });

            if (score > highestScore) {
                highestScore = score;
                bestMatch = prod;
            }
        });

        const isMatched = bestMatch && highestScore >= 10;
        if (isMatched) matchedCount++;

        const unitPrice = isMatched ? bestMatch.salePrice : 0;
        const lineTotal = unitPrice * qty;
        grandTotal += lineTotal;

        parsedBOQItems.push({
            originalLine: line,
            qty,
            matchedProduct: isMatched ? bestMatch : null,
            unitPrice,
            lineTotal
        });
    });

    // Render results
    const container = document.getElementById("boq-results-container");
    const tbody = document.getElementById("boq-results-tbody");
    document.getElementById("boq-matched-count").textContent = `${matchedCount} / ${lines.length}`;
    document.getElementById("boq-items-detected").textContent = lines.length;
    document.getElementById("boq-total-estimate").textContent = formatKES(grandTotal);

    tbody.innerHTML = parsedBOQItems.map(item => {
        const prod = item.matchedProduct;
        if (prod) {
            const inStock = prod.stockQty >= item.qty;
            const stockClass = inStock ? 'text-green' : (prod.stockQty > 0 ? 'text-amber' : 'text-red');
            const stockLabel = inStock ? `In Stock (${prod.stockQty} ${prod.unit})` : (prod.stockQty > 0 ? `Partial (${prod.stockQty} left)` : `Out of Stock`);

            return `
                <tr>
                    <td style="font-size:0.8rem; font-weight:500;">${item.originalLine}</td>
                    <td>
                        <strong style="font-size:0.85rem;">${prod.name}</strong><br>
                        <span style="font-size:0.7rem; color:var(--text-muted);">${prod.sku} • ${prod.category}</span>
                    </td>
                    <td><strong>${item.qty}</strong> ${prod.unit}</td>
                    <td>${formatKES(prod.salePrice)}</td>
                    <td style="font-weight:700; color:var(--text-primary);">${formatKES(item.lineTotal)}</td>
                    <td><span class="${stockClass}" style="font-weight:600; font-size:0.8rem;">${stockLabel}</span></td>
                </tr>
            `;
        } else {
            return `
                <tr style="opacity:0.75; background:var(--bg-primary);">
                    <td style="font-size:0.8rem;">${item.originalLine}</td>
                    <td>
                        <em style="color:var(--text-muted);">Specialized / Custom Item</em><br>
                        <small style="color:var(--amber);">Will be reviewed manually by procurement</small>
                    </td>
                    <td><strong>${item.qty}</strong> units</td>
                    <td>—</td>
                    <td>—</td>
                    <td><span class="badge" style="background:var(--amber-bg); color:var(--amber); font-size:0.7rem;">Custom Quote</span></td>
                </tr>
            `;
        }
    }).join('');

    container.classList.remove("hidden");
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function transferBOQToCart() {
    let addedCount = 0;
    parsedBOQItems.forEach(item => {
        if (item.matchedProduct && item.matchedProduct.stockQty > 0) {
            const sku = item.matchedProduct.sku;
            const existing = customerCart.find(c => c.sku === sku);
            const addQty = Math.min(item.qty, item.matchedProduct.stockQty);
            if (existing) {
                existing.qty = Math.min(existing.qty + addQty, item.matchedProduct.stockQty);
            } else {
                customerCart.push({ sku, qty: addQty });
            }
            addedCount++;
        }
    });

    if (addedCount > 0) {
        updateCartBadge();
        renderCustomerCart();
        const drawer = document.getElementById("cart-drawer-panel");
        if (drawer) drawer.classList.add("open");
        alert(`Successfully transferred ${addedCount} matched product(s) into your cart!`);
    } else {
        alert("No in-stock matched products found to add.");
    }
}

function transferBOQToQuote() {
    let count = 0;
    parsedBOQItems.forEach(item => {
        if (item.matchedProduct) {
            const existing = customerQuoteItems.find(q => q.sku === item.matchedProduct.sku);
            if (existing) {
                existing.qty += item.qty;
            } else {
                customerQuoteItems.push({
                    sku: item.matchedProduct.sku,
                    name: item.matchedProduct.name,
                    qty: item.qty
                });
            }
            count++;
        }
    });

    // Also populate description with any unmatched lines
    const unmatched = parsedBOQItems.filter(i => !i.matchedProduct).map(i => i.originalLine).join(", ");
    if (unmatched) {
        const descField = document.getElementById("quote-description");
        if (descField) {
            descField.value = (descField.value ? descField.value + "\n" : "") + "Additional custom materials: " + unmatched;
        }
    }

    renderQuoteBuilderList();
    const section = document.getElementById("quotation-section");
    if (section) section.scrollIntoView({ behavior: 'smooth' });
    alert(`Added ${count} items to your Quotation Request form!`);
}


// ==========================================================================
// 15. STAFF TERMINAL AI CO-PILOT
// ==========================================================================

let copilotFeed = [];

function renderStaffCopilot() {
    const feed = document.getElementById("copilot-chat-feed");
    if (!feed) return;
    if (copilotFeed.length === 0) {
        copilotFeed.push({
            sender: 'bot',
            html: `
                <p><strong>Simba Co-Pilot ready.</strong> You can ask me to analyze inventory, bill items by voice/text, review pending quotations, or generate store reports.</p>
                <div class="copilot-sample-prompts">
                    <button type="button" onclick="sendStaffCopilotPrompt('Which products are currently below reorder level?')">⚠️ Check low stock</button>
                    <button type="button" onclick="sendStaffCopilotPrompt('Summarize today\\'s sales and stock valuation')">📈 Store summary</button>
                    <button type="button" onclick="sendStaffCopilotPrompt('Bill 5 bags of Tembo cement and 2 rolls 1.5mm electrical cable')">🛒 Quick POS Bill</button>
                    <button type="button" onclick="sendStaffCopilotPrompt('List all pending customer quotations that need pricing')">📝 Review Quotes</button>
                </div>
            `
        });
    }

    feed.innerHTML = copilotFeed.map(msg => `
        <div class="copilot-msg ${msg.sender === 'user' ? 'user-msg' : 'bot-msg'}">
            <div class="msg-avatar"><i class="fa-solid ${msg.sender === 'user' ? 'fa-user' : 'fa-helmet-safety'}"></i></div>
            <div class="msg-body">${msg.html}</div>
        </div>
    `).join('');

    feed.scrollTop = feed.scrollHeight;
}

function clearCopilotConsole() {
    copilotFeed = [];
    renderStaffCopilot();
}

function runCopilotQuickAction(action) {
    if (action === 'reorder') {
        const lowStock = products.filter(p => p.stockQty <= p.reorderLevel);
        let totalCost = 0;
        let rowsHtml = lowStock.map(p => {
            const reorderQty = Math.max(10, (p.reorderLevel * 2) - p.stockQty);
            const estCost = reorderQty * p.costPrice;
            totalCost += estCost;
            return `<tr>
                <td><strong>${p.name}</strong> (${p.sku})</td>
                <td style="color:var(--red); font-weight:700;">${p.stockQty} ${p.unit}</td>
                <td>${p.reorderLevel} ${p.unit}</td>
                <td><strong>+${reorderQty} ${p.unit}</strong></td>
                <td>${formatKES(estCost)}</td>
            </tr>`;
        }).join('');

        const html = `
            <h6>📦 Reorder Intelligence Analysis</h6>
            <p>Found <strong>${lowStock.length}</strong> product(s) needing replenishment:</p>
            <div class="table-responsive" style="margin:8px 0;">
                <table class="data-table" style="font-size:0.75rem;">
                    <thead>
                        <tr><th>Product</th><th>Current Stock</th><th>Reorder Level</th><th>Suggested Order</th><th>Est. Cost</th></tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
            <p style="font-weight:700;">Total Estimated Procurement Budget: <span class="text-green">${formatKES(totalCost)}</span></p>
        `;
        pushCopilotMessage('bot', html);

    } else if (action === 'fastpos') {
        const prompt = "Bill 5 bags of Tembo cement and 2 reinforcement steel bars D12";
        sendStaffCopilotPrompt(prompt);

    } else if (action === 'quotes') {
        const pending = quotations.filter(q => q.status === 'pending');
        let html = `<h6>📝 Quotation Margin & Pricing Assistant</h6>`;
        if (pending.length === 0) {
            html += `<p>All customer quotations have been processed! No pending quotes requiring pricing.</p>`;
        } else {
            html += `<p>Found <strong>${pending.length}</strong> pending quotation(s). Recommended contractor discount is <strong>4.5%</strong> on bulk orders above KES 50,000.</p>`;
            html += pending.map(q => `
                <div style="background:var(--bg-primary); padding:8px 10px; border-radius:6px; margin:6px 0; border:1px solid var(--border-color);">
                    <strong>${q.id}</strong> — ${q.customerName} (${q.phone})<br>
                    <small>${q.description || 'Items requested'}: ${q.items.length} item(s)</small><br>
                    <button class="btn-primary" style="padding:2px 8px; font-size:0.72rem; margin-top:4px;" onclick="switchStaffTab('quotes'); selectQuotation('${q.id}')">Open & Quote</button>
                </div>
            `).join('');
        }
        pushCopilotMessage('bot', html);

    } else if (action === 'briefing') {
        let totalSales = 0;
        orders.forEach(o => { if (o.status !== "Cancelled") totalSales += o.total; });
        let stockVal = 0;
        let lowStockCount = 0;
        products.forEach(p => {
            stockVal += p.salePrice * p.stockQty;
            if (p.stockQty <= p.reorderLevel) lowStockCount++;
        });

        const pendingCallbacks = callbacks.filter(c => c.status === 'pending').length;
        const pendingOrders = orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length;

        const html = `
            <h6>📊 Executive Daily Store Briefing</h6>
            <div class="ai-calc-box">
                • <strong>Gross Revenue:</strong> ${formatKES(totalSales)}<br>
                • <strong>Total Inventory Valuation:</strong> ${formatKES(stockVal)}<br>
                • <strong>Low Stock Items:</strong> ${lowStockCount} items at/below reorder threshold<br>
                • <strong>Active Fulfillment Queue:</strong> ${pendingOrders} order(s)<br>
                • <strong>Pending Helpline Callbacks:</strong> ${pendingCallbacks} customer(s) waiting
            </div>
            <p>System status: <span class="badge" style="background:var(--green-bg); color:var(--green);">100% OPERATIONAL</span></p>
        `;
        pushCopilotMessage('bot', html);
    }
}

function sendStaffCopilotPrompt(text) {
    pushCopilotMessage('user', text);
    executeStaffCopilotCommand(text);
}

function handleStaffCopilotSubmit(e) {
    if (e) e.preventDefault();
    const input = document.getElementById("copilot-input-text");
    const text = input ? input.value.trim() : "";
    if (!text) return;
    input.value = "";
    sendStaffCopilotPrompt(text);
}

function pushCopilotMessage(sender, html) {
    copilotFeed.push({ sender, html });
    renderStaffCopilot();
}

function executeStaffCopilotCommand(text) {
    const lower = text.toLowerCase();

    // Command 1: Fast Natural Language POS Billing
    if (lower.startsWith("bill ") || lower.includes("add to bill") || lower.includes("charge ") || lower.includes("pos ")) {
        let billedItems = [];
        products.forEach(p => {
            const nameLower = p.name.toLowerCase();
            const skuLower = p.sku.toLowerCase();
            if (lower.includes(skuLower) || nameLower.split(" ").some(w => w.length > 3 && lower.includes(w))) {
                // Find quantity before product
                const regex = new RegExp(`(\\d+)\\s*(?:bags?|pcs?|pieces?|rolls?|tins?)?\\s*(?:of\\s*)?${p.name.split(" ")[0].toLowerCase()}`, 'i');
                const match = text.match(regex);
                const qty = match ? parseInt(match[1], 10) : 1;
                
                // Add to POS Cart
                for (let i = 0; i < qty; i++) {
                    addToPOSCart(p.sku);
                }
                billedItems.push(`• <strong>${qty}x</strong> ${p.name} (${formatKES(p.salePrice * qty)})`);
            }
        });

        if (billedItems.length > 0) {
            pushCopilotMessage('bot', `
                <p>🛒 <strong>Successfully added to POS Billing Counter:</strong></p>
                <div class="ai-calc-box">${billedItems.join("<br>")}</div>
                <button class="btn-primary" style="padding:4px 10px; font-size:0.75rem;" onclick="switchStaffTab('pos')">
                    <i class="fa-solid fa-cash-register"></i> Go to POS Cart & Checkout
                </button>
            `);
        } else {
            pushCopilotMessage('bot', `<p>Could not recognize specific products in: "<em>${text}</em>". Try mentioning SKU or exact product name e.g. "Bill 5 bags of Tembo cement".</p>`);
        }

    // Command 2: Low Stock & Reorder
    } else if (lower.includes("stock") || lower.includes("reorder") || lower.includes("inventory")) {
        runCopilotQuickAction('reorder');

    // Command 3: Summary / Briefing
    } else if (lower.includes("summary") || lower.includes("sales") || lower.includes("valuation") || lower.includes("brief")) {
        runCopilotQuickAction('briefing');

    // Command 4: Quotations
    } else if (lower.includes("quote") || lower.includes("quotation")) {
        runCopilotQuickAction('quotes');

    // Default Fallback
    } else {
        pushCopilotMessage('bot', `
            <p>I processed your command: "<em>${text}</em>".</p>
            <p>You can execute staff actions like:</p>
            <div class="ai-calc-box">
                • <code>Bill 5 bags Tembo cement</code> (Auto-fills POS)<br>
                • <code>Which products are currently below reorder level?</code><br>
                • <code>Summarize today's sales and stock valuation</code>
            </div>
        `);
    }
}


// ==========================================================================
// 16. INITIALIZATION ON PAGE LOAD
// ==========================================================================

window.onload = function() {
    renderCustomerCatalog();
    renderCustomerOrdersTracker();
    renderCustomerQuotesTracker();
    updateQuotesBadge();
    initAI();
};

