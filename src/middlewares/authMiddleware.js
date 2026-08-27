const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { JWT_SECRET } = require('../config/env');

// Middleware untuk memverifikasi JWT Token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User tidak ditemukan atau sesi tidak valid',
        });
      }

      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid atau sudah kadaluarsa',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak, token otorisasi tidak ditemukan',
    });
  }
};

// Middleware untuk membatasi akses khusus role Admin
const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Akses terlarang: Hanya Admin yang diizinkan mengakses fitur ini',
  });
};

module.exports = {
  protect,
  authorizeAdmin,
};