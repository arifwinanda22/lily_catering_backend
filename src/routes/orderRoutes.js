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
const { protect } = require('../middlewares/authMiddleware');

// Endpoint User
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);

// Endpoint Vendor
router.get('/vendor-orders', protect, getVendorOrders);
router.patch('/:id/tracking', protect, updateOrderTracking);
router.patch('/:id/confirm-payment', protect, confirmDirectPayment);

// Endpoint Detail Umum
router.get('/:id', protect, getOrderById);

module.exports = router;