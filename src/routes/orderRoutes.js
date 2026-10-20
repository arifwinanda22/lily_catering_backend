const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getVendorOrders,
  getOrderById,
  updateOrderTracking,
  confirmDirectPayment,
} = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddleware'); // Pastikan auth middleware diimpor

// 1. Rute Dasar (POST)
router.post('/', protect, createOrder);

// 2. Rute Statis KHUSUS (HARUS DI ATAS Rute /:id)
router.get('/my-orders', protect, getMyOrders);
router.get('/vendor-orders', protect, getVendorOrders); // <--- LETAKKAN DI SINI!

// 3. Rute Dinamis dengan Parameter /:id (HARUS DI BAWAH)
router.get('/:id', protect, getOrderById);
router.patch('/:id/tracking', protect, updateOrderTracking); // Jika rute ini ada
router.patch('/:id/confirm-payment', protect, confirmDirectPayment); // Jika rute ini ada

module.exports = router;