
require('dotenv').config();


// src/index.js
const express = require('express');
const cors = require('cors');
const { PORT } = require('./config/env');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const userRoutes = require('./routes/userRoutes')
const orderRoutes = require('./routes/orderRoutes');
const menuRoutes = require('./routes/menuRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const financeRoutes = require('./routes/financeRoutes');

// 1. Hubungkan Database
connectDB();

// 2. Inisialisasi Express APP (Wajib sebelum app.use)
const app = express();

// 3. Middlewares Global
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// 4. Integrasi Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/user', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/finance', financeRoutes);

// 5. Route Testing Dasar
app.get('/', (req, res) => {
  res.send("API Lily's Catering Backend Running...");
});

// 6. Menjalankan Server
app.listen(PORT, () => {
  console.log(`🚀 Server backend berjalan di port: ${PORT}`);
});