const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../prisma/dev.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Gagal terhubung ke SQLite:', err.message);
    } else {
        console.log('✅ Berhasil terhubung ke database SQLite!');
        initCompleteSchema();
    }
});

// Fungsi untuk Inisialisasi Skema Tabel Lengkap dari Awal
function initCompleteSchema() {
    db.serialize(() => {
        // 1. Tabel User
        db.run(`
            CREATE TABLE IF NOT EXISTS "User" (
                                                  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                                                  "username" TEXT NOT NULL UNIQUE,
                                                  "email" TEXT NOT NULL UNIQUE,
                                                  "password_hash" TEXT NOT NULL,
                                                  "role" TEXT NOT NULL
            )
        `);

        // 2. Tabel Product (Lengkap dengan category)
        db.run(`
            CREATE TABLE IF NOT EXISTS "Product" (
                                                     "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                                                     "name" TEXT NOT NULL,
                                                     "description" TEXT,
                                                     "price" REAL NOT NULL,
                                                     "stock" INTEGER NOT NULL DEFAULT 0,
                                                     "image_url" TEXT,
                                                     "category" TEXT DEFAULT 'Coffee',
                                                     "is_perishable" INTEGER NOT NULL DEFAULT 0,
                                                     "expiry_date" DATETIME
            )
        `);

        // 3. Tabel FinancialLog
        db.run(`
            CREATE TABLE IF NOT EXISTS "FinancialLog" (
                                                          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                                                          "type" TEXT NOT NULL,
                                                          "amount" REAL NOT NULL,
                                                          "description" TEXT,
                                                          "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 4. Tabel Transaction (Lengkap dengan invoice_code, order_type, customer_name, dsb.)
        db.run(`
            CREATE TABLE IF NOT EXISTS "Transaction" (
                                                         "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                                                         "invoice_number" TEXT NOT NULL UNIQUE,
                                                         "invoice_code" TEXT,
                                                         "user_id" INTEGER,
                                                         "customer_name" TEXT DEFAULT 'Pelanggan',
                                                         "order_type" TEXT DEFAULT 'takeaway',
                                                         "table_number" TEXT DEFAULT '-',
                                                         "total_amount" REAL NOT NULL,
                                                         "payment_method" TEXT NOT NULL DEFAULT 'QRIS',
                                                         "payment_status" TEXT NOT NULL DEFAULT 'PAID',
                                                         "status" TEXT NOT NULL DEFAULT 'PAID',
                                                         "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                                         FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
            )
        `);

        // 5. Tabel TransactionDetail (Lengkap dengan price, price_at_sale, subtotal)
        db.run(`
            CREATE TABLE IF NOT EXISTS "TransactionDetail" (
                                                               "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                                                               "transaction_id" INTEGER NOT NULL,
                                                               "product_id" INTEGER NOT NULL,
                                                               "quantity" INTEGER NOT NULL,
                                                               "price" REAL DEFAULT 0,
                                                               "price_at_sale" REAL NOT NULL,
                                                               "subtotal" REAL DEFAULT 0,
                                                               FOREIGN KEY ("transaction_id") REFERENCES "Transaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                                                               FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
            )
        `, (err) => {
            if (!err) {
                // Buat Admin Default setelah skema tabel siap
                initDefaultAdmin();
            }
        });
    });
}

// Fungsi untuk membuat Akun Admin Utama
async function initDefaultAdmin() {
    const defaultUsername = 'admin';
    const defaultPassword = 'admin123';

    const checkQuery = `SELECT * FROM User WHERE username = ?`;
    db.get(checkQuery, [defaultUsername], async (err, user) => {
        if (err) return console.error('Error checking admin:', err.message);

        if (!user) {
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);
            const insertQuery = `INSERT INTO User (username, email, password_hash, role) VALUES (?, ?, ?, ?)`;

            db.run(insertQuery, [defaultUsername, 'admin@internal.local', hashedPassword, 'admin'], function(err) {
                if (err) {
                    console.error('❌ Gagal membuat Admin Default:', err.message);
                } else {
                    console.log('🔑 Akun Admin Default Berhasil Dibuat:');
                    console.log(`   Username : ${defaultUsername}`);
                    console.log(`   Password : ${defaultPassword}`);
                }
            });
        }
    });
}

module.exports = db;