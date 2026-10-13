const express = require('express');
const router = express.Router();
const {
  createOrUpdateProfile,
  getAllVendorsForAdmin,
  updateApprovalStatus,
  getPublicVendors,
  getVendorMenus,
  addVendorMenu,
  getVendorProfile, // <-- Pastikan fungsi ini ditambahkan di sini!
  getMyMenus, // <-- Pastikan fungsi ini ditambahkan di sini!
} = require('../controllers/vendorController');
const { protect, authorizeAdmin } = require('../middlewares/authMiddleware');

// Endpoint publik/vendor yang sudah login
router.post('/profile', protect, createOrUpdateProfile);
router.get('/profile', protect, getVendorProfile);
router.get('/public', getPublicVendors);
router.get('/:id/menus', getVendorMenus);
router.post('/menus', protect, addVendorMenu);
router.get('/my-menus', protect, getMyMenus);

// Endpoint KHUSUS ADMIN (Dilindungi protect & authorizeAdmin)
router.get('/admin/all', protect, authorizeAdmin, getAllVendorsForAdmin);
router.patch('/admin/:id/approval', protect, authorizeAdmin, updateApprovalStatus);
router.patch('/:id/approval', protect, authorizeAdmin, updateApprovalStatus);

module.exports = router;