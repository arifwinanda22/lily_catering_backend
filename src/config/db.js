// src/config/db.js
const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

const connectDB = async () => {
  try {
    console.log('⏳ Mencoba menghubungkan ke database...');
    
    // Validasi dasar
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI belum didefinisikan di file .env');
    }

    // Perintah koneksi Mongoose
    const conn = await mongoose.connect(MONGODB_URI);

    console.log(`-----------------------------------------------`);
    console.log(`✅ MongoDB Terhubung ke Host: ${conn.connection.host}`);
    console.log(`Database yang digunakan: ${conn.connection.name}`);
    console.log(`-----------------------------------------------`);
  } catch (error) {
    console.error(`❌ Error Koneksi Database: ${error.message}`);
    // Jika koneksi DB gagal saat startup, matikan proses aplikasi
    process.exit(1); 
  }
};

module.exports = connectDB;