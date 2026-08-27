const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        namaVendor: {
            type: String,
            required: [true, 'Nama vendor wajib diisi'],
            trim: true,
        },
        kategori: {
            type: String,
            required: [true, 'Kategori vendor wajib diisi'],
        },
        deskripsi: {
            type: String,
            default: '',
        },
        alamat: {
            type: String,
            required: [true, 'Alamat vendor wajib diisi'],
        },
        kota: {
      type: String,
      required: [true, 'Kota wajib diisi'],
    },
    website: {
      type: String,
      default: '',
    },
    instagram: {
      type: String,
      default: '',
    },
    minOrder: {
      type: String,
      required: [true, 'Minimal order wajib diisi'],
    },
    jamOperasional: {
      type: String,
      required: [true, 'Jam operasional wajib diisi'],
    },
    metodePembayaran: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['waiting_approval', 'approved', 'rejected'],
      default: 'waiting_approval',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vendor', vendorSchema);