// server.js

// 1. Load Dependencies
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // ✅ Import CORS
const scheduleCleanup = require('./utils/cleanupJob');

// --- PENTING ---
// Mengambil variabel-variabel dari file .env
dotenv.config(); 

const app = express();

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
// Asumsi: Anda memiliki rute untuk Autentikasi dan Resep (Recipes)
app.use('/api/auth', require('./routes/auth')); 
// app.use('/api/recipes', require('./routes/recipes')); // Jika rute ini ada, aktifkan

// 3. Koneksi ke MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB berhasil terhubung!'))
    .catch(err => console.error('❌ Koneksi MongoDB Gagal:', err.message)); 

// 4. Endpoint Test (Untuk Health Check dan uji koneksi)
app.get('/', (req, res) => {
    res.send('Server SajiLe Backend Berjalan!');
});

app.get('/healthz', (req, res) => {
    // Endpoint yang ideal untuk Health Check Render
    res.status(200).send('OK');
});


// 5. Start Server
// Render akan menggunakan variabel lingkungan PORT untuk menentukan port
app.listen(PORT, () => console.log(`🚀 Server berjalan di http://localhost:${PORT}`));