const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    items: [
      {
        namaMenu: { type: String, required: true },
        harga: { type: Number, required: true },
        porsi: { type: Number, required: true },
      },
    ],
    totalBiaya: {
      type: Number,
      required: true,
    },
    tanggalKirim: {
      type: String,
      required: true,
    },
    lokasiPengiriman: {
      type: String,
      required: true,
    },
    metodePembayaran: {
      type: String,
      enum: [
        'Transfer Bank',
        'QRIS',
        'Invoice Bulanan',
        'Virtual Account',
        'Bayar Langsung ke Vendor', 
      ],
      required: true,
    },
    // Status Khusus Pembayaran
    paymentStatus: {
      type: String,
      enum: ['Menunggu Pembayaran', 'Dibayar ke Vendor', 'Lunas', 'Gagal'],
      default: 'Menunggu Pembayaran',
    },
    // Bukti bayar atau catatan pelunasan langsung
    paymentProof: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['Aktif', 'Selesai', 'Dibatalkan'],
      default: 'Aktif',
    },
    tracking: {
      driverName: { type: String, default: 'Belum Ditugaskan' },
      driverPhone: { type: String, default: '-' },
      logs: [
        {
          time: { type: String },
          text: { type: String },
        },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);