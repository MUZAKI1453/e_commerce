const express = require('express');
const router = express.Router();
const db = require('../database');


/* ==========================================================
 * 1. GET: Ambil Semua Produk
 * ========================================================== */
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
 * 2. POST: Tambah Produk Baru
 * ========================================================== */
router.post('/', (req, res) => {
    const { name, category, price, stock, description, image_url } = req.body;

    // Validasi field wajib
    if (!name || price === undefined) {
        return res.status(400).json({ message: 'Nama produk dan Harga wajib diisi!' });
    }

    const query = `
        INSERT INTO Product (name, category, price, stock, description, image_url)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        name,
        category || 'Coffee',
        Number(price) || 0,
        Number(stock) || 0,
        description || '',
        image_url?.trim() ? image_url : null // Jika kosong/hanya spasi, simpan null
    ];

    db.run(query, values, function (err) {
        if (err) {
            console.error('Error POST /api/products:', err.message);
            return res.status(500).json({ error: 'Gagal menambah produk: ' + err.message });
        }
        res.status(201).json({
            message: 'Produk berhasil ditambahkan!',
            productId: this.lastID
        });
    });
});


/* ==========================================================
 * 3. PUT: Edit / Perbarui Produk Berdasarkan ID
 * ========================================================== */
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, category, price, stock, description, image_url } = req.body;

    // Validasi field wajib
    if (!name || price === undefined) {
        return res.status(400).json({ message: 'Nama produk dan Harga wajib diisi!' });
    }

    const query = `
        UPDATE Product
        SET name = ?, category = ?, price = ?, stock = ?, description = ?, image_url = ?
        WHERE id = ?
    `;

    const values = [
        name,
        category || 'Coffee',
        Number(price) || 0,
        Number(stock) || 0,
        description || '',
        image_url?.trim() ? image_url : null,
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
 * 4. DELETE: Hapus Produk Berdasarkan ID
 * ========================================================== */
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