// src/models/userModel.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nama wajib diisi'],
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Username wajib diisi'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email wajib diisi'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Password wajib diisi'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      // DAFTARKAN SEMUA ROLE YANG DIGUNAKAN SISTEM DI SINI
      enum: ['user', 'corporate_client', 'vendor', 'admin'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    vendorStatus: {
      type: String,
      enum: ['pending_profile', 'waiting_approval', 'approved', 'rejected'],
      default: 'pending_profile',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);