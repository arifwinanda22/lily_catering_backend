const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Vendor ID wajib ada'],
    },
    namaMenu: {
      type: String,
      required: [true, 'Nama menu wajib diisi'],
      trim: true,
    },
    harga: {
      type: Number,
      required: [true, 'Harga wajib diisi'],
    },
    stok: {
        type: Number,
        default: 100
    },
    deskripsi: {
      type: String,
      default: '',
    },
    kategori: {
      type: String,
      default: 'Nasi Box',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Menu', menuSchema);