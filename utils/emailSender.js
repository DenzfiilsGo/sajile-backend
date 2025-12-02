// File: saji-backend/utils/emailSender.js

// Import library Resend
const { Resend } = require('resend');

// 1. Inisialisasi Resend dengan API Key dari Environment Variables
// Menggunakan RESEND_API_KEY
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Mengirim email verifikasi ke pengguna menggunakan Resend API.
 * Proses ini menggunakan API HTTP, yang lebih cepat dan lebih andal.
 * @param {string} email - Alamat email tujuan.
 * @param {string} verificationLink - Link verifikasi yang unik.
 */
const sendVerificationEmail = async (email, verificationLink) => {
    
    // Objek pesan (format Resend)
    const msg = {
        // 'from' harus menggunakan format "Nama <email@anda.com>"
        from: `SajiLe Verification <${process.env.EMAIL_USER}>`, 
        to: [email], // Resend menerima array email tujuan
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
        // ⭐ PERUBAHAN KRUSIAL: Menggunakan resend.emails.send() ⭐
        const { data, error } = await resend.emails.send(msg);

        if (error) {
             console.error(`[EMAIL-RESEND] GAGAL: Gagal mengirim email verifikasi ke ${email}. Error:`, error);
             return false;
        }

        console.log(`[EMAIL-RESEND] Sukses: Email verifikasi berhasil dikirim ke ${email}. ID: ${data.id}`);
        return true;
        
    } catch (error) {
        // Menangkap error level koneksi
        console.error(`[EMAIL-RESEND] KRITIS GAGAL: Error saat memanggil Resend API:`, error.message);
        return false;
    }
};

module.exports = { sendVerificationEmail };