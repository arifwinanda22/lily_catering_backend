// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Definisi endpoint
// Path lengkapnya akan menjadi: /api/auth/register
router.post('/register', authController.register);

// Path lengkapnya akan menjadi: /api/auth/login
router.post('/login', authController.login);

module.exports = router;