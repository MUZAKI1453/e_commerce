const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Files dari folder 'public'
app.use(express.static(path.join(__dirname, '../public')));

// Import Routes
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/auth', authRoutes);

// Direct Route ke Halaman Back-Office
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Jalankan Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`☕ Server berjalan di http://localhost:${PORT}`);
});