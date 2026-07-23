const express = require('express');
const router = express.Router();
const db = require('../database');

// 1. POST: Buat Pesanan / Transaksi Baru dari Pelanggan
router.post('/', (req, res) => {
    const { order_type, table_number, customer_name, items, total_amount, payment_method } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Keranjang belanja tidak boleh kosong!' });
    }

    const invoiceCode = 'INV-' + Date.now();
    const orderType = order_type || 'takeaway';
    const tableNum = table_number || '-';
    const custName = customer_name || 'Pelanggan';
    const payMethod = payment_method || 'QRIS';

    const queryTx = `
        INSERT INTO [Transaction] (
            invoice_number, invoice_code, order_type, table_number,
            customer_name, total_amount, payment_method, payment_status, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'PAID', 'PAID')
    `;

    db.run(queryTx, [invoiceCode, invoiceCode, orderType, tableNum, custName, total_amount, payMethod], function (err) {
        if (err) {
            console.error('Error INSERT Transaction:', err.message);
            return res.status(500).json({ error: 'Gagal membuat transaksi: ' + err.message });
        }

        const transactionId = this.lastID;

        const stmtDetail = db.prepare(`
            INSERT INTO TransactionDetail (transaction_id, product_id, quantity, price, price_at_sale, subtotal)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const stmtStock = db.prepare(`
            UPDATE Product SET stock = stock - ? WHERE id = ? AND stock >= ?
        `);

        items.forEach(item => {
            const subtotal = item.price * item.quantity;
            stmtDetail.run(transactionId, item.id, item.quantity, item.price, item.price, subtotal);
            stmtStock.run(item.quantity, item.id, item.quantity);
        });

        stmtDetail.finalize();
        stmtStock.finalize();

        // Catat Pemasukan ke FinancialLog
        const queryFin = `INSERT INTO FinancialLog (type, amount, description) VALUES ('income', ?, ?)`;
        db.run(queryFin, [total_amount, `Penjualan Online ${invoiceCode}`]);

        res.status(201).json({
            message: 'Pesanan berhasil dibuat!',
            invoiceCode: invoiceCode,
            transactionId: transactionId
        });
    });
});

// 2. GET: Ambil Pesanan Aktif (Untuk Barista Display)
router.get('/active', (req, res) => {
    const query = `
        SELECT t.*,
               json_group_array(
                       json_object('name', p.name, 'quantity', td.quantity)
               ) as items_json
        FROM [Transaction] t
                 LEFT JOIN TransactionDetail td ON t.id = td.transaction_id
                 LEFT JOIN Product p ON td.product_id = p.id
        WHERE t.status IN ('PAID', 'PROCESS')
        GROUP BY t.id
        ORDER BY t.id ASC
    `;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const formattedRows = (rows || []).map(row => {
            try { row.items = JSON.parse(row.items_json); } catch (e) { row.items = []; }
            delete row.items_json;
            return row;
        });

        res.json({ data: formattedRows });
    });
});

// 3. GET: Ambil Riwayat Semua Transaksi (History)
router.get('/history', (req, res) => {
    const query = `
        SELECT t.*,
               json_group_array(
                       json_object('name', p.name, 'quantity', td.quantity, 'price', td.price)
               ) as items_json
        FROM [Transaction] t
                 LEFT JOIN TransactionDetail td ON t.id = td.transaction_id
                 LEFT JOIN Product p ON td.product_id = p.id
        GROUP BY t.id
        ORDER BY t.id DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const formattedRows = (rows || []).map(row => {
            try { row.items = JSON.parse(row.items_json); } catch (e) { row.items = []; }
            delete row.items_json;
            return row;
        });

        res.json({ data: formattedRows });
    });
});

// 4. GET: Ambil Log Keuangan (FinancialLog)
router.get('/financial-logs', (req, res) => {
    const query = `SELECT * FROM FinancialLog ORDER BY id DESC`;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows || [] });
    });
});

// 5. GET: Ambil Ringkasan Omset
router.get('/stats', (req, res) => {
    const query = `
        SELECT 
            COALESCE(SUM(total_amount), 0) as total_omset,
            COUNT(id) as total_transactions
        FROM [Transaction]
        WHERE status != 'CANCELLED'
    `;

    db.get(query, [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || { total_omset: 0, total_transactions: 0 });
    });
});

// 6. PUT: Update Status Pesanan (PAID -> PROCESS -> COMPLETED)
router.put('/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const query = `UPDATE [Transaction] SET status = ? WHERE id = ?`;
    db.run(query, [status, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `Status pesanan berhasil diubah menjadi ${status}` });
    });
});

module.exports = router;