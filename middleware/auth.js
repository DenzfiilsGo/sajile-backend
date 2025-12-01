// File: saji-backend/middleware/auth.js

const jwt = require('jsonwebtoken');

// Middleware untuk memverifikasi JWT
module.exports = function(req, res, next) {
    // 1. Ambil token dari header
    // Token biasanya dikirim dalam format: Authorization: Bearer <token>
    const token = req.header('x-auth-token'); 

    // 2. Cek jika tidak ada token
    if (!token) {
        // Status 401: Unauthorized (Tidak Sah)
        return res.status(401).json({ msg: 'Tidak ada token, otorisasi ditolak.' });
    }

    try {
        // 3. Verifikasi token
        // jwt.verify akan memecahkan token menggunakan JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Tambahkan user dari payload token ke objek request
        // Ini memungkinkan kita mengakses user.id dan user.role di route berikutnya
        req.user = decoded.user;
        
        // Lanjutkan ke fungsi route berikutnya
        next();

    } catch (err) {
        // Jika token tidak valid (misal: kadaluarsa atau secret salah)
        res.status(401).json({ msg: 'Token tidak valid.' });
    }
};