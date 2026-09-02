/* ==========================================================================
   Simba Hardware Hub — Relational Database Schema & Adapter
   ========================================================================== */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'simba_hardware.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to open SQLite database:', err.message);
    } else {
        console.log('Connected to SQLite Database at:', dbPath);
    }
});

// Initialize Tables and Seed Data
function initDatabase() {
    db.serialize(() => {
        // 1. Categories Table
        db.run(`CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )`);

        // 2. Products Table
        db.run(`CREATE TABLE IF NOT EXISTS products (
            sku TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            unit TEXT NOT NULL,
            costPrice REAL NOT NULL,
            salePrice REAL NOT NULL,
            stockQty INTEGER NOT NULL,
            reorderLevel INTEGER NOT NULL,
            imageUrl TEXT DEFAULT ''
        )`);

        // 3. Orders Table
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            customerName TEXT DEFAULT 'Walk-in / Online Customer',
            phone TEXT DEFAULT '',
            items TEXT NOT NULL,
            type TEXT NOT NULL,
            deliveryArea TEXT DEFAULT '',
            total REAL NOT NULL,
            status TEXT NOT NULL,
            paymentMethod TEXT DEFAULT 'Cash'
        )`);

        // 4. Quotations Table
        db.run(`CREATE TABLE IF NOT EXISTS quotations (
            id TEXT PRIMARY KEY,
            customerName TEXT NOT NULL,
            phone TEXT NOT NULL,
            date TEXT NOT NULL,
            status TEXT NOT NULL,
            description TEXT DEFAULT '',
            itemsJson TEXT NOT NULL,
            quotedPrice REAL DEFAULT 0,
            validUntil TEXT DEFAULT ''
        )`);

        // 5. Helpline Callbacks Table
        db.run(`CREATE TABLE IF NOT EXISTS callbacks (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            query TEXT DEFAULT '',
            status TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )`);

        // 6. Stock Logs Audit Table
        db.run(`CREATE TABLE IF NOT EXISTS stock_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            skuName TEXT NOT NULL,
            changeQty INTEGER NOT NULL,
            direction TEXT NOT NULL,
            reason TEXT NOT NULL,
            user TEXT NOT NULL
        )`);

        // Seed Default Categories if empty
        db.get("SELECT COUNT(*) AS count FROM categories", (err, row) => {
            if (row && row.count === 0) {
                const stmt = db.prepare("INSERT INTO categories (name) VALUES (?)");
                ["Cement", "Steel", "Paint", "Tools", "Electricals", "Plumbing", "Building Materials"].forEach(cat => {
                    stmt.run(cat);
                });
                stmt.finalize();
            }
        });

        // Seed Default Products if empty
        db.get("SELECT COUNT(*) AS count FROM products", (err, row) => {
            if (row && row.count === 0) {
                const stmt = db.prepare(`INSERT INTO products (sku, name, category, unit, costPrice, salePrice, stockQty, reorderLevel, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
                
                const initialProds = [
                    ["CEM-001", "Bamburi Tembo Cement (32.5N)", "Cement", "Bags", 650, 790, 120, 20, ""],
                    ["CEM-002", "Savannah Portland Cement (42.5R)", "Cement", "Bags", 720, 850, 12, 15, ""],
                    ["STL-001", "Reinforcement Steel Bar D12 (12mm)", "Steel", "Pieces", 1100, 1450, 85, 15, ""],
                    ["STL-002", "Reinforcement Steel Bar D10 (10mm)", "Steel", "Pieces", 780, 980, 110, 20, ""],
                    ["PNT-001", "Crown Paints Vinyl Matt White (20L)", "Paint", "Tins", 7500, 8900, 25, 5, ""],
                    ["TOL-001", "Stanley Claw Hammer 16oz", "Tools", "Pieces", 850, 1200, 30, 5, ""],
                    ["ELC-001", "East African Cables Single Core 1.5mm", "Electricals", "Rolls", 2800, 3400, 50, 8, ""],
                    ["PLM-001", "PPR Pipe PN20 (20mm x 4M)", "Plumbing", "Pieces", 250, 380, 200, 30, ""]
                ];

                initialProds.forEach(prod => stmt.run(prod));
                stmt.finalize();
            }
        });
    });
}

initDatabase();

module.exports = db;
