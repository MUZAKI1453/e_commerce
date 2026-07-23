-- 1. Tabel Users
CREATE TABLE IF NOT EXISTS "User" (
                                      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                                      "username" TEXT NOT NULL UNIQUE,
                                      "email" TEXT NOT NULL UNIQUE,
                                      "password_hash" TEXT NOT NULL,
                                      "role" TEXT NOT NULL
);

-- 2. Tabel Products
CREATE TABLE IF NOT EXISTS "Product" (
                                         "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                                         "name" TEXT NOT NULL,
                                         "description" TEXT NOT NULL,
                                         "price" REAL NOT NULL,
                                         "stock" INTEGER NOT NULL,
                                         "image_url" TEXT,
                                         "is_perishable" BOOLEAN NOT NULL DEFAULT 0,
                                         "expiry_date" DATETIME
);

-- 3. Tabel Financial Logs
CREATE TABLE IF NOT EXISTS "FinancialLog" (
                                              "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                                              "type" TEXT NOT NULL,
                                              "amount" REAL NOT NULL,
                                              "description" TEXT NOT NULL,
                                              "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Transactions
CREATE TABLE IF NOT EXISTS "Transaction" (
                                             "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                                             "invoice_number" TEXT NOT NULL UNIQUE,
                                             "user_id" INTEGER,
                                             "total_amount" REAL NOT NULL,
                                             "payment_method" TEXT NOT NULL,
                                             "payment_status" TEXT NOT NULL,
                                             "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                             FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 5. Tabel Transaction Details
CREATE TABLE IF NOT EXISTS "TransactionDetail" (
                                                   "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                                                   "transaction_id" INTEGER NOT NULL,
                                                   "product_id" INTEGER NOT NULL,
                                                   "quantity" INTEGER NOT NULL,
                                                   "price_at_sale" REAL NOT NULL,
                                                   FOREIGN KEY ("transaction_id") REFERENCES "Transaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                                                   FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);