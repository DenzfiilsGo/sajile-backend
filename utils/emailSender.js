// File: saji-backend/utils/emailSender.js

// Import library Nodemailer
const nodemailer = require('nodemailer');

// 1. Konfigurasi Transporter dengan SMTP Pool
// Transporter ini dibuat HANYA SEKALI saat server dimulai.
// Pool: true akan menjaga koneksi SMTP tetap hidup untuk penggunaan berulang (anti-timeout).
const transporter = nodemailer.createTransport({
    pool: true, 
    host: 'smtp.gmail.com',
    port: 465, 
    secure: true, // Menggunakan SSL (wajib untuk port 465)
    auth: {
        user: process.env.EMAIL_USER, // denzfiils999@gmail.com
        pass: process.env.EMAIL_PASS, // Password Aplikasi Gmail Anda
    },
});

/**
 * Mengirim email verifikasi ke pengguna menggunakan Nodemailer (via pool SMTP yang persisten).
 * @param {string} email - Alamat email tujuan.
 * @param {string} verificationLink - Link verifikasi yang unik.
 * @returns {boolean} - True jika pengiriman berhasil, False jika gagal.
 */
const sendVerificationEmail = async (email, verificationLink) => {
    
    // Objek pesan
    const mailOptions = {
        // Alamat Pengirim
        from: `SajiLe Verification <${process.env.EMAIL_USER}>`,
        to: email, // Email tujuan
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
        // Menggunakan transporter pool untuk mengirim email
        const info = await transporter.sendMail(mailOptions);
        
        console.log(`[EMAIL-SMTP-POOL] Sukses: Email dikirim ke ${email}. Response ID: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error(`[EMAIL-SMTP-POOL] GAGAL KRITIS: Gagal mengirim email verifikasi ke ${email}. Error:`, error.message);
        
        if (error.code === 'EAUTH') {
             console.error('Pesan: Periksa EMAIL_PASS di Render. Kemungkinan Password Aplikasi Gmail salah atau sudah kadaluarsa.');
        }

        return false;
    }
};

module.exports = { sendVerificationEmail };