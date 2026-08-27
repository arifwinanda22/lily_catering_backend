const express = require('express');
const router = express.Router();
const { createPaymentToken, handleNotification } = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

// Endpoint untuk frontend mengambil Snap Token
router.post('/create-token', protect, createPaymentToken);

// Webhook endpoint (Jangan gunakan middleware protect karena dipanggil oleh server Midtrans)
router.post('/notification', handleNotification);

module.exports = router;