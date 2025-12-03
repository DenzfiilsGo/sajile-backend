// File: saji-backend/controllers/authController.js

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// BARU: Impor library untuk verifikasi
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/emailSender'); // TIDAK ADA PERUBAHAN DI SINI

// URL Frontend dari Environment Variables (HARUS DITAMBAHKAN DI RENDER)
// Contoh: https://sajile.netlify.app
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'; 


// Fungsi untuk proses Registrasi Pengguna
exports.register = async (req, res) => {
    // 1. Ekstrak data dari body request
    const { username, email, password } = req.body;

    try {
        // 2. Cek apakah pengguna sudah ada (berdasarkan email)
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'Pengguna dengan email ini sudah terdaftar.' });
        }

        // 3. BUAT TOKEN VERIFIKASI UNIK
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // Kadaluarsa dalam 24 jam

        // 4. Buat instance User baru dengan status verifikasi
        user = new User({
            username,
            email,
            password,
            isVerified: false, // Default: belum terverifikasi
            verificationToken, // Simpan token
            verificationTokenExpires, // Simpan tanggal kadaluarsa
        });

        // 5. Hash Password sebelum disimpan
        const salt = await bcrypt.genSalt(10); 
        user.password = await bcrypt.hash(password, salt);

        await user.save(); // Simpan user ke database

        // 6. PERBAIKAN KRUSIAL: Ambil host publik dari Render (x-forwarded-host)
        const apiHost = req.headers['x-forwarded-host'] || req.headers.host; 
        
        // Host yang digunakan untuk link verifikasi HARUS host API Anda (sajile-backend.onrender.com)
        // Kita gunakan req.protocol di depannya (misalnya http atau https)
        const verificationLink = `${req.protocol}://${apiHost}/api/auth/verify/${verificationToken}`;

        // 7. KIRIM EMAIL VERIFIKASI
        const emailSent = await sendVerificationEmail(email, verificationLink);

        if (emailSent) {
            // Respon sukses
            return res.status(201).json({
                msg: 'Registrasi berhasil! Silakan cek email Anda untuk verifikasi akun.',
                user: { id: user._id, username: user.username, email: user.email, isVerified: user.isVerified },
            });
        } else {
            // Jika gagal kirim email, hapus user
            await User.deleteOne({ _id: user._id }); 
            return res.status(500).json({ msg: 'Gagal mengirim email verifikasi. Registrasi dibatalkan. Silakan coba lagi nanti.' });
        }

    } catch (err) {
        console.error(err.message);

        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }

        res.status(500).send('Server Error');
    }
};

// Fungsi untuk proses Login Pengguna
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Cek apakah pengguna terdaftar
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Kredensial tidak valid: Email atau Password salah.' });
        }

        // BARU: 2. Cek status verifikasi
        if (!user.isVerified) {
            return res.status(401).json({ msg: 'Akun Anda belum diverifikasi. Silakan cek email Anda.' });
        }

        // 3. Bandingkan Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Kredensial tidak valid: Email atau Password salah.' });
        }

        // 4. Buat Payload untuk Token
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        // 5. Buat dan Kirim Token JWT
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, role: user.role, msg: 'Login berhasil!' });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// FUNGSI UTAMA: Verifikasi Akun dari link email (DIMODIFIKASI UNTUK AUTO-LOGIN)
exports.verifyAccount = async (req, res) => {
    const token = req.params.token;

    try {
        console.log(`[VERIFY ACCOUNT] Menerima token: ${token.substring(0, 10)}...`);

        // 1. Cari user berdasarkan token dan pastikan belum kadaluarsa
        // Kita gunakan kueri pertama tanpa membatasi waktu kedaluwarsa dulu untuk melihat mengapa gagal
        const user = await User.findOne({
            verificationToken: token,
        });

        if (!user) {
            // Log ke konsol backend
            console.warn(`[VERIFY ACCOUNT] GAGAL: Token tidak ditemukan di database.`);
            // Redirect dengan pesan error umum (Token invalid/salah)
            return res.redirect(`${FRONTEND_URL}/html/daftar_atau_login.html?status=verification_failed&error=token_invalid`);
        }

        // 2. Cek apakah token sudah kedaluwarsa setelah pengguna ditemukan
        if (user.verificationTokenExpires < Date.now()) {
            // Log ke konsol backend
            console.warn(`[VERIFY ACCOUNT] GAGAL: Token untuk user ${user.email} sudah kedaluwarsa.`);
            
            // Redirect dengan pesan error spesifik (Token expired)
            return res.redirect(`${FRONTEND_URL}/html/daftar_atau_login.html?status=verification_failed&error=token_expired`);
        }
        
        // 3. AKUN BERHASIL DIVERIFIKASI
        user.isVerified = true;
        user.verificationToken = undefined; // Hapus token
        user.verificationTokenExpires = undefined; // Hapus waktu kedaluwarsa
        await user.save();
        console.log(`[VERIFY ACCOUNT] SUKSES: Akun user ${user.email} berhasil diverifikasi.`);

        // 4. Berikan Token Login (JWT) untuk auto-login
        const payload = {
            user: {
                id: user.id,
                role: user.role,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' }, 
            (err, loginToken) => { // Ganti nama variabel menjadi loginToken agar tidak ambigu
                if (err) {
                    console.error('[VERIFY ACCOUNT] GAGAL membuat Token Login:', err.message);
                    return res.redirect(`${FRONTEND_URL}/html/daftar_atau_login.html?error=jwt_generation_failed`);
                }
                
                // 5. BERHASIL: Redirect ke halaman utama frontend dengan token di URL
                res.redirect(`${FRONTEND_URL}/index.html?token=${loginToken}&status=verified`);
            }
        );

    } catch (err) {
        console.error('[VERIFY ACCOUNT] Internal Server Error:', err.message);
        // Jika ada error internal server (misalnya masalah Mongoose), arahkan kembali ke frontend
        res.redirect(`${FRONTEND_URL}/html/daftar_atau_login.html?error=server_issue`);
    }
};

// Fungsi untuk mendapatkan data user yang sedang login
exports.getAuthUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); 
        res.json(user);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};