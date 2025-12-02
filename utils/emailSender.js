// File: saji-backend/utils/emailSender.js

const nodemailer = require('nodemailer');

// 1. Konfigurasi Transporter (Menggunakan kredensial dari .env)
const transporter = nodemailer.createTransport({
    // service: 'gmail' adalah konfigurasi cepat untuk server Gmail
    service: 'gmail', 
    auth: {
        // EMAIL_USER & EMAIL_PASS diambil dari .env
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
    },
    // ⭐ TAMBAHKAN DUA PROPERTI INI ⭐
    timeout: 30000,     // Beri waktu 30 detik untuk inisialisasi koneksi.
    socketTimeout: 60000 // Beri waktu 60 detik untuk transaksi data (lebih aman).
});

/**
 * Mengirim email verifikasi ke pengguna.
 * @param {string} email - Alamat email tujuan.
 * @param {string} verificationLink - Link verifikasi yang unik.
 */
const sendVerificationEmail = async (email, verificationLink) => {
    const mailOptions = {
        // Nama pengirim yang dilihat pengguna
        from: `SajiLe Verification <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verifikasi Akun SajiLe Anda',
        html: `
            <h1>Selamat Datang di SajiLe!</h1>
            <p>Terima kasih telah mendaftar. Silakan klik tombol di bawah ini untuk mengaktifkan akun Anda:</p>
            <a href="${verificationLink}" style="padding: 10px 20px; background-color: #2ecc71; color: white; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Verifikasi Akun Sekarang
            </a>
            <p style="margin-top: 20px;">Link ini berlaku selama 24 jam. Jika Anda tidak mendaftar, abaikan email ini.</p>
            <p>Hormat kami,<br>Tim SajiLe</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Sukses: Email verifikasi berhasil dikirim ke ${email}`);
        return true;
    } catch (error) {
        console.error(`[EMAIL] GAGAL: Gagal mengirim email verifikasi ke ${email}. Error:`, error.message);
        return false;
    }
};

module.exports = { sendVerificationEmail };