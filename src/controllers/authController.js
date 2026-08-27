const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

// Helper function untuk generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// @desc    Login User & Generate Real JWT Token
// @route   POST /api/auth/login
// @desc    Login Handler dengan Status Verifikasi
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { identifier, email, username, password } = req.body;
    const userIdentifier = identifier || email || username;

    if (!userIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/Username dan password wajib diisi',
      });
    }

    const user = await User.findOne({
      $or: [
        { email: userIdentifier.toLowerCase() },
        { username: userIdentifier },
      ],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Akun tidak ditemukan atau password salah',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Akun tidak ditemukan atau password salah',
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        vendorStatus: user.vendorStatus,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// @desc    Register User Baru
// @route   POST /api/auth/register

// Di dalam fungsi register pada src/controllers/authController.js
const register = async (req, res) => {
  try {
    const { fullname, username, email, phone, password, role } = req.body;

    // Pastikan role yang disimpan valid dan sesuai enum
    let assignedRole = 'user';
    if (role === 'vendor') {
      assignedRole = 'vendor';
    } else if (role === 'corporate_client') {
      assignedRole = 'corporate_client';
    } else if (role === 'admin') {
      assignedRole = 'admin';
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: fullname,
      username,
      email,
      phone: phone || '',
      password: hashedPassword,
      role: assignedRole,
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  login,
  register,
};