// src/models/expenseModel.js
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    judulPengeluaran: {
      type: String,
      required: [true, 'Nama pengeluaran wajib diisi'],
      trim: true,
    },
    kategori: {
      type: String,
      enum: [
        'Bahan Baku & Dapur',
        'Logistik & Transport Kurir',
        'Gas & Utilitas Dapur',
        'Gaji & Tenaga Harian',
        'Lainnya',
      ],
      default: 'Bahan Baku & Dapur',
    },
    nominal: {
      type: Number,
      required: [true, 'Nominal biaya wajib diisi'],
    },
    tanggal: {
      type: Date,
      default: Date.now,
    },
    catatan: {
      type: String,
    },
  },
  { timestamps: true }
);

// PASTIKAN BARIS INI TIDAK MENGGUNAKAN KURUNG KURAWAL { }
module.exports = mongoose.model('Expense', expenseSchema);