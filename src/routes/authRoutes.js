const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'kopi_hitam_kopi_susu_123_super_rahasia';

// Jalur Login berbasis Username
router.post('/login', (req, res) => {
    const {username, password} = req.body;

    if (!username || !password) {
        return res.status(400).json({message: 'Username dan Password wajib diisi!'});
    }

    const query = `SELECT *
                   FROM User
                   WHERE username = ?`;
    db.get(query, [username], async (err, user) => {
        if (err) return res.status(500).json({error: err.message});
        if (!user) return res.status(400).json({message: 'Username tidak ditemukan!'});

        // Cek kecocokan password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) return res.status(400).json({message: 'Password salah!'});

        // Validasi hak akses Admin
        if (user.role !== 'admin') {
            return res.status(403).json({message: 'Akses ditolak! Anda bukan Admin.'});
        }

        // Buat token akses JWT
        const token = jwt.sign(
            {id: user.id, username: user.username, role: user.role},
            JWT_SECRET,
            {expiresIn: '1d'}
        );

        res.json({message: 'Login sukses!', token, role: user.role});
    });
});

module.exports = router;