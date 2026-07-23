const express = require('express');
const router = express.Router();
const db = require('../database');

// 1. GET: Ambil semua produk
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

// 2. POST: Tambah produk / menu baru
router.post('/', (req, res) => {
    const { name, category, price, stock, description, image_url } = req.body;

    if (!name || price === undefined) {
        return res.status(400).json({ message: 'Nama produk dan Harga wajib diisi!' });
    }

    // Query standar yang kompatibel dengan semua skema tabel Product
    const query = `
        INSERT INTO Product (name, category, price, stock, description, image_url)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const defaultImg = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400';

    const values = [
        name,
        category || 'Coffee',
        Number(price) || 0,
        Number(stock) || 0,
        description || '',
        image_url || defaultImg
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

// 3. DELETE: Hapus produk berdasarkan ID
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