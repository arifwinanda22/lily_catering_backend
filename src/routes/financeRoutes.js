const express = require('express');
const router = express.Router();
const {
  getVendorFinancialReport,
  createExpense,
} = require('../controllers/financeController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/vendor-report', getVendorFinancialReport);
router.post('/expenses', createExpense);

module.exports = router;