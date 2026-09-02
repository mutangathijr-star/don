/* ==========================================================================
   Simba Hardware Hub — Node.js & Express REST API Server
   ========================================================================== */

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 1. PRODUCTS API
app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/products', (req, res) => {
    const { sku, name, category, unit, costPrice, salePrice, stockQty, reorderLevel, imageUrl } = req.body;
    const stmt = db.prepare(`INSERT INTO products (sku, name, category, unit, costPrice, salePrice, stockQty, reorderLevel, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    stmt.run([sku, name, category, unit, costPrice, salePrice, stockQty, reorderLevel, imageUrl || ''], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Product created", sku });
    });
});

app.put('/api/products/:sku/stock', (req, res) => {
    const { stockQty } = req.body;
    db.run(`UPDATE products SET stockQty = ? WHERE sku = ?`, [stockQty, req.params.sku], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Stock updated", sku: req.params.sku, stockQty });
    });
});

app.delete('/api/products/:sku', (req, res) => {
    db.run(`DELETE FROM products WHERE sku = ?`, [req.params.sku], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Product deleted", sku: req.params.sku });
    });
});

// 2. CATEGORIES API
app.get('/api/categories', (req, res) => {
    db.all("SELECT name FROM categories", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => r.name));
    });
});

app.post('/api/categories', (req, res) => {
    const { name } = req.body;
    db.run("INSERT INTO categories (name) VALUES (?)", [name], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Category added", name });
    });
});

app.delete('/api/categories/:name', (req, res) => {
    db.run("DELETE FROM categories WHERE name = ?", [req.params.name], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Category deleted" });
    });
});

// 3. ORDERS & DISPATCH API
app.get('/api/orders', (req, res) => {
    db.all("SELECT * FROM orders ORDER BY date DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/orders', (req, res) => {
    const { id, date, customerName, phone, items, type, deliveryArea, total, status, paymentMethod } = req.body;
    const stmt = db.prepare(`INSERT INTO orders (id, date, customerName, phone, items, type, deliveryArea, total, status, paymentMethod) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    stmt.run([id, date, customerName || 'Customer', phone || '', items, type, deliveryArea || '', total, status, paymentMethod || 'Cash'], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Order placed", id });
    });
});

app.put('/api/orders/:id/status', (req, res) => {
    const { status } = req.body;
    db.run(`UPDATE orders SET status = ? WHERE id = ?`, [status, req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Order status updated", id: req.params.id, status });
    });
});

// 4. QUOTATIONS API
app.get('/api/quotations', (req, res) => {
    db.all("SELECT * FROM quotations ORDER BY date DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const parsed = rows.map(r => ({
            ...r,
            items: JSON.parse(r.itemsJson)
        }));
        res.json(parsed);
    });
});

app.post('/api/quotations', (req, res) => {
    const { id, customerName, phone, date, status, description, items, quotedPrice, validUntil } = req.body;
    const stmt = db.prepare(`INSERT INTO quotations (id, customerName, phone, date, status, description, itemsJson, quotedPrice, validUntil) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    stmt.run([id, customerName, phone, date, status, description || '', JSON.stringify(items), quotedPrice || 0, validUntil || ''], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Quotation submitted", id });
    });
});

app.put('/api/quotations/:id', (req, res) => {
    const { status, quotedPrice, validUntil, items } = req.body;
    db.run(`UPDATE quotations SET status = ?, quotedPrice = ?, validUntil = ?, itemsJson = ? WHERE id = ?`, 
        [status, quotedPrice, validUntil, JSON.stringify(items), req.params.id], function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "Quotation updated", id: req.params.id });
        });
});

// 5. HELPLINE CALLBACKS API
app.get('/api/callbacks', (req, res) => {
    db.all("SELECT * FROM callbacks ORDER BY timestamp DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/callbacks', (req, res) => {
    const { id, name, phone, query, status, timestamp } = req.body;
    const stmt = db.prepare(`INSERT INTO callbacks (id, name, phone, query, status, timestamp) VALUES (?, ?, ?, ?, ?, ?)`);
    stmt.run([id, name, phone, query || '', status, timestamp], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Callback requested", id });
    });
});

app.put('/api/callbacks/:id/status', (req, res) => {
    const { status } = req.body;
    db.run(`UPDATE callbacks SET status = ? WHERE id = ?`, [status, req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Callback status updated", id: req.params.id });
    });
});

// 6. STOCK AUDIT LOGS API
app.get('/api/stock-logs', (req, res) => {
    db.all("SELECT * FROM stock_logs ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/stock-logs', (req, res) => {
    const { timestamp, skuName, changeQty, direction, reason, user } = req.body;
    const stmt = db.prepare(`INSERT INTO stock_logs (timestamp, skuName, changeQty, direction, reason, user) VALUES (?, ?, ?, ?, ?, ?)`);
    stmt.run([timestamp, skuName, changeQty, direction, reason, user], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Audit log created" });
    });
});

app.listen(PORT, () => {
    console.log(`Simba Hardware Server running at http://localhost:${PORT}`);
});
