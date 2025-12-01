// server.js

// 1. Load Dependencies
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const scheduleCleanup = require('./utils/cleanupJob');

// --- PENTING ---
// Mengambil variabel-variabel dari file .env (Harus di awal!)
dotenv.config(); 

const app = express();

scheduleCleanup();

const PORT = process.env.PORT || 5000;
// Mengambil URI dari file .env
const MONGODB_URI = process.env.MONGODB_URI; 

// 2. Middleware
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));

// 3. Koneksi ke MongoDB
// Menggunakan URI yang diambil dari .env
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB berhasil terhubung!'))
    // Jika koneksi gagal, pesan error yang detail akan ditampilkan
    .catch(err => console.error('❌ Koneksi MongoDB Gagal:', err.message)); 

// 4. Endpoint Test
app.get('/', (req, res) => {
    res.send('Server SajiLe Backend Berjalan!');
});

// 5. Rute Autentikasi (Belum diaktifkan)
// const authRoutes = require('./routes/auth');
// app.use('/api/auth', authRoutes); 

// 6. Start Server
app.listen(PORT, () => console.log(`🚀 Server berjalan di http://localhost:${PORT}`));