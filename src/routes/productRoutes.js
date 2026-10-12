const express = require('express');
const router = express.Router();
const db = require('../database');


/* ==========================================================
- 1. GET: Ambil Semua Produk
========================================================== */

router.get('/', (req, res) => {
    const query = `SELECT * FROM Product ORDER BY id DESC`;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error GET /api/products:', err.message);
            return res.status(500).json({ error: 'Gagal mengambil data produk: ' + err.message });
        }
        res.json({ data: rows || [] });
    });
});


/* ==========================================================
- 2. POST: Tambah Produk Baru (Berlaku untuk semua jenis produk)
========================================================== */

router.post('/', (req, res) => {
    const { name, category, price, buy_price, stock, description, image_url, is_packaged } = req.body;

    // Validasi field wajib
    if (!name || price === undefined) {
        return res.status(400).json({ message: 'Nama produk dan Harga Jual wajib diisi!' });
    }

    const isPackagedVal = is_packaged ? 1 : 0;
    const buyPriceVal = Number(buy_price) || 0;
    const stockVal = Number(stock) || 0;

    const query = `
        INSERT INTO Product (name, category, price, buy_price, stock, description, image_url, is_packaged)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        name,
        category || 'Coffee',
        Number(price) || 0,
        buyPriceVal,
        stockVal,
        description || '',
        image_url?.trim() ? image_url : null,
        isPackagedVal
    ];

    db.run(query, values, function (err) {
        if (err) {
            console.error('Error POST /api/products:', err.message);
            return res.status(500).json({ error: 'Gagal menambah produk: ' + err.message });
        }

        const newProductId = this.lastID;

        // Otomatis catat pengeluaran (expense) modal awal untuk SEMUA produk
        // asalkan memiliki stok awal > 0 dan harga beli modal > 0.
        if (stockVal > 0 && buyPriceVal > 0) {
            const totalCost = buyPriceVal * stockVal;
            const queryFin = `INSERT INTO FinancialLog (type, amount, description) VALUES ('expense', ?, ?)`;
            db.run(queryFin, [totalCost, `Modal Awal Stok: ${name} (${stockVal} pcs)`], (finErr) => {
                if (finErr) console.error('Gagal mencatat FinancialLog modal awal:', finErr.message);
            });
        }

        res.status(201).json({
            message: 'Produk berhasil ditambahkan!',
            productId: newProductId
        });
    });
});


/* ==========================================================
- 3. POST: Restock Produk (Berlaku untuk semua jenis produk)
========================================================== */

router.post('/:id/restock', (req, res) => {
    const { id } = req.params;
    const { qty_add, buy_price } = req.body;

    const qty = Number(qty_add);
    const unitBuyPrice = Number(buy_price);

    if (!qty || qty <= 0) {
        return res.status(400).json({ message: 'Jumlah tambahan stok harus lebih dari 0!' });
    }

    db.get(`SELECT * FROM Product WHERE id = ?`, [id], (err, product) => {
        if (err || !product) {
            return res.status(404).json({ error: 'Produk tidak ditemukan.' });
        }

        const newStock = product.stock + qty;
        const finalBuyPrice = unitBuyPrice > 0 ? unitBuyPrice : (product.buy_price || 0);

        // Update stok dan harga beli terbaru di tabel Product
        db.run(`UPDATE Product SET stock = ?, buy_price = ? WHERE id = ?`, [newStock, finalBuyPrice, id], function (errUpdate) {
            if (errUpdate) {
                console.error('Error RESTOCK Product:', errUpdate.message);
                return res.status(500).json({ error: 'Gagal merestock produk: ' + errUpdate.message });
            }

            // Otomatis catat pengeluaran ke FinancialLog untuk semua produk jika ada harga beli modal
            if (finalBuyPrice > 0) {
                const totalExpense = finalBuyPrice * qty;
                const queryFin = `INSERT INTO FinancialLog (type, amount, description) VALUES ('expense', ?, ?)`;
                db.run(queryFin, [totalExpense, `Restock Modal: ${product.name} (+${qty} pcs @ Rp ${finalBuyPrice.toLocaleString('id-ID')})`], (finErr) => {
                    if (finErr) console.error('Gagal mencatat FinancialLog restock:', finErr.message);
                });
            }

            res.json({
                message: `Berhasil restock ${product.name}! Stok sekarang: ${newStock}`,
                newStock: newStock
            });
        });
    });
});


/* ==========================================================
- 4. PUT: Edit / Perbarui Produk Berdasarkan ID
========================================================== */

router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, category, price, buy_price, stock, description, image_url, is_packaged } = req.body;

    // Validasi field wajib
    if (!name || price === undefined) {
        return res.status(400).json({ message: 'Nama produk dan Harga wajib diisi!' });
    }

    const query = `
        UPDATE Product
        SET name = ?, category = ?, price = ?, buy_price = ?, stock = ?, description = ?, image_url = ?, is_packaged = ?
        WHERE id = ?
    `;

    const values = [
        name,
        category || 'Coffee',
        Number(price) || 0,
        Number(buy_price) || 0,
        Number(stock) || 0,
        description || '',
        image_url?.trim() ? image_url : null,
        is_packaged ? 1 : 0,
        id
    ];

    db.run(query, values, function (err) {
        if (err) {
            console.error('Error PUT /api/products:', err.message);
            return res.status(500).json({ error: 'Gagal memperbarui produk: ' + err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Produk tidak ditemukan.' });
        }
        res.json({ message: 'Produk berhasil diperbarui!' });
    });
});


/* ==========================================================
- 5. DELETE: Hapus Produk Berdasarkan ID
========================================================== */

router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM Product WHERE id = ?`;

    db.run(query, [id], function (err) {
        if (err) {
            console.error('Error DELETE /api/products:', err.message);
            return res.status(500).json({ error: 'Gagal menghapus produk: ' + err.message });
        }
        res.json({ message: 'Produk berhasil dihapus!' });
    });
});

module.exports = router;