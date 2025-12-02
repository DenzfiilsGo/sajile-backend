// server.js

// 1. Load Dependencies
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); 
const scheduleCleanup = require('./utils/cleanupJob');

// --- PENTING ---
// Mengambil variabel-variabel dari file .env
dotenv.config(); 

const app = express();

// Menjalankan tugas pembersihan terjadwal (seperti menghapus token kadaluarsa)
scheduleCleanup();

// Gunakan process.env.PORT (Render) atau fallback ke 5000 (Local)
const PORT = process.env.PORT || 5000;
// Mengambil URI dari file .env
const MONGODB_URI = process.env.MONGODB_URI; 

// 2. Middleware
app.use(express.json());

// ⭐ KONFIGURASI KRUSIAL: Middleware CORS
// Mengizinkan semua domain (origin) untuk mengakses API Anda.
app.use(cors()); 

// Import Routes
app.use('/api/auth', require('./routes/auth')); 
// app.use('/api/recipes', require('./routes/recipes')); // Jika rute ini ada, aktifkan

// 3. Koneksi ke MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB berhasil terhubung!'))
    .catch(err => console.error('❌ Koneksi MongoDB Gagal:', err.message)); 

// 4. Endpoint Test (Health Check dan Keep-Alive)
// Endpoint utama, untuk memverifikasi server berjalan
app.get('/', (req, res) => {
    res.send('Server SajiLe Backend Berjalan!');
});

// ⭐ TAMBAHAN BARU: Endpoint Health Check Khusus untuk Cron Job ⭐
// Endpoint ini akan dipanggil oleh layanan pihak ketiga untuk menjaga server tetap aktif (Keep-Alive)
app.get('/api/healthcheck', (req, res) => {
    // Memberikan respons status 200 OK
    res.status(200).json({ status: 'OK', service: 'SajiLe Backend' });
});


// 5. Start Server
// Render akan menggunakan variabel lingkungan PORT untuk menentukan port
app.listen(PORT, () => console.log(`🚀 Server berjalan di http://localhost:${PORT}`));