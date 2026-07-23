const jwt = require('jsonwebtoken');

// 1. Middleware utama: Memeriksa apakah user membawa token JWT yang valid
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <TOKEN>"

    if (!token) {
        return res.status(401).json({ message: 'Akses ditolak! Kamu harus login terlebih dahulu.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // Menyimpan data user (id & role) dari isi token
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token tidak valid atau sudah kedaluwarsa!' });
    }
};

// 2. Middleware tambahan: Memastikan yang mengakses HANYA ADMIN
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // Jika role adalah admin, izinkan lewat
    } else {
        return res.status(403).json({ message: 'Akses ditolak! Fitur ini khusus untuk Admin.' });
    }
};

module.exports = { authenticateToken, requireAdmin };