const Vendor = require('../models/vendorModel');
const User = require('../models/userModel');
const Menu = require('../models/menuModel');

// @desc    Ambil Publik Vendor yang sudah Approved
// @route   GET /api/vendor/public
// @access  Public
const getPublicVendors = async (req, res) => {
  try {
    const { kategori, search } = req.query;
    const query = { status: 'approved' };

    if (kategori && kategori !== 'Semua') {
      query.kategori = kategori;
    }

    if (search) {
      query.namaVendor = { $regex: search,$options: 'i' };
    }

    const vendors = await Vendor.find(query).select(
      'namaVendor kategori alamat kota deskripsi minOrder jamOperasional'
    );

    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat katalog vendor' });
  }
};


// @desc    Ambil Profil Vendor yang Sedang Login
// @route   GET /api/vendor/profile
// @access  Private (Role Vendor)
const getVendorProfile = async (req, res) => {
  try {
    const vendorProfile = await Vendor.findOne({ userId: req.user.id });
    
    if (!vendorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Profil vendor belum ditemukan',
      });
    }

    res.status(200).json({
      success: true,
      data: vendorProfile,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat profil vendor' });
  }
};


// @desc    Ambil Menu dari Vendor Tertentu
// @route   GET /api/vendor/:id/menus
// @access  Public
const getVendorMenus = async (req, res) => {
  try {
    const menus = await Menu.find({ vendorId: req.params.id, isAvailable: true });
    res.status(200).json({
      success: true,
      count: menus.length,
      data: menus,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat daftar menu' });
  }
};

// @desc    Submit / Lengkapi Profil Vendor
// @route   POST /api/vendor/profile
// @access  Private (Role Vendor)
const createOrUpdateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      namaVendor,
      kategori,
      alamat,
      kota,
      telepon,
      email: emailBisnis,
      deskripsi,
      website,
      instagram,
      minOrder,
      jamOperasional,
      metodePembayaran,
    } = req.body;

    // Update atau buat profil vendor dengan status 'waiting_approval'
    const vendorProfile = await Vendor.findOneAndUpdate(
      { userId },
      {
        userId,
        namaVendor,
        kategori,
        alamat,
        kota,
        telepon,
        emailBisnis,
        deskripsi,
        website,
        instagram,
        minOrder,
        jamOperasional,
        metodePembayaran,
        status: 'waiting_approval',
      },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    // Sinkronisasi status di koleksi User
    await User.findByIdAndUpdate(userId, {
      vendorStatus: 'waiting_approval',
      isVerified: false,
    });

    res.status(200).json({
      success: true,
      message: 'Profil vendor berhasil disimpan dan menunggu verifikasi admin',
      data: vendorProfile,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Terjadi kesalahan server' });
  }
};

// @desc    Admin: Ambil semua vendor (bisa filter ?status=waiting_approval)
// @route   GET /api/vendor/admin/all
// @access  Private (Admin Only)
const getAllVendorsForAdmin = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const vendors = await Vendor.find(filter)
      .populate('userId', 'name username email phone isVerified vendorStatus')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: vendors.length,
      data: vendors,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data vendor' });
  }
};

// @desc    Admin: Approve atau Reject Vendor
// @route   PATCH /api/vendor/admin/:id/approval
// @access  Private (Admin Only)

const updateApprovalStatus = async (req, res) => {
  try {
    const { id } = req.params; // ID dari user
    const { status } = req.body; // 'approved' atau 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status tidak valid. Gunakan 'approved' atau 'rejected'",
      });
    }

    // 1. Update status pada koleksi User
    const user = await User.findByIdAndUpdate(
      id,
      {
        isVerified: status === 'approved',
        vendorStatus: status,
      },
      { returnDocument: 'after' }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Akun user/vendor tidak ditemukan',
      });
    }

    // 2. [WAJIB ADA] Update juga status pada koleksi Vendor agar sinkron dengan User
    const updatedVendor = await Vendor.findOneAndUpdate(
      { userId: user._id },
      { status: status },
      { returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: `Status vendor ${user.name} berhasil diubah menjadi: ${status}`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        vendorStatus: user.vendorStatus,
        vendorProfileStatus: updatedVendor ? updatedVendor.status : null,
      },
    });
  } catch (error) {
    console.error(`Approval Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat memproses approval',
    });
  }
};

// @desc    Vendor: Tambah Menu Hidangan
// @route   POST /api/vendor/menu
// @access  Private (Role Vendor)
const addVendorMenu = async (req, res) => {
  try {
    const { namaMenu, harga, deskripsi, kategori } = req.body;

    // 1. Cari profil vendor berdasarkan akun user yang login
    const vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Profil vendor belum ditemukan untuk akun ini',
      });
    }

    // 2. Simpan hidangan baru
    const menu = await Menu.create({
      vendorId: vendor._id,
      namaMenu,
      harga,
      deskripsi: deskripsi || '',
      kategori: kategori || 'Nasi Box',
      isAvailable: true,
    });

    res.status(201).json({
      success: true,
      message: 'Menu hidangan berhasil ditambahkan!',
      data: menu,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Ambil Menu milik Vendor yang Sedang Login
// @route   GET /api/vendor/my-menus
// @access  Private (Role Vendor)
const getMyMenus = async (req, res) => {
  try {
    // 1. Cari profil vendor berdasarkan user ID yang login dari token
    const vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor tidak ditemukan' });
    }

    // 2. Ambil semua menu berdasarkan vendorId tersebut
    const menus = await Menu.find({ vendorId: vendor._id });
    
    res.status(200).json({
      success: true,
      count: menus.length,
      data: menus,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat menu vendor' });
  }
};

module.exports = {
  createOrUpdateProfile,
  getAllVendorsForAdmin,
  updateApprovalStatus,
  getPublicVendors,
  getVendorMenus,
  addVendorMenu,
  getVendorProfile,
  getMyMenus,
};