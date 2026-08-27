const mongoose = require('mongoose');
const Menu = require('../models/menuModel');
const Vendor = require('../models/vendorModel');

// @desc    1. Tambah Menu Baru
// @route   POST /api/menus
// @access  Private (Vendor)
const createMenu = async (req, res) => {
  try {
    const { namaMenu, kategori, harga, stok, deskripsi, isAvailable } = req.body;

    const vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Profil vendor tidak ditemukan' });
    }

    const menu = await Menu.create({
      vendorId: vendor._id,
      namaMenu,
      kategori,
      harga,
      stok: stok !== undefined ? stok : 100,
      deskripsi: deskripsi || '',
      isAvailable: isAvailable !== undefined ? isAvailable : true,
    });

    res.status(201).json({
      success: true,
      message: 'Menu hidangan berhasil ditambahkan',
      data: menu,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    2. Ambil Semua Menu Milik Vendor yang Sedang Login (Untuk Tab Kelola Menu)
// @route   GET /api/menus/my-menus
// @access  Private (Vendor)
const getMyMenus = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Profil vendor tidak ditemukan' });
    }

    const menus = await Menu.find({ vendorId: vendor._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: menus.length,
      data: menus,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat menu vendor' });
  }
};

// @desc    3. Update Detail Menu (Digunakan Form Modal 'Edit Menu')
// @route   PUT /api/menus/:id
// @access  Private (Vendor)
const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { namaMenu, kategori, harga, stok, deskripsi, isAvailable } = req.body;

    // Validasi apakah ID valid format ObjectId
    if (!mongoose.Types.ObjectId.isValid(id.trim())) {
      return res.status(400).json({ success: false, message: 'Format ID menu tidak valid' });
    }

    // 1. Cari menu
    const menu = await Menu.findById(id.trim());
    if (!menu) {
      return res.status(404).json({ success: false, message: 'Menu tidak ditemukan' });
    }

    // 2. Verifikasi kepemilikan vendor
    const vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor || menu.vendorId.toString() !== vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak: Anda bukan pemilik menu ini',
      });
    }

    // 3. Update field yang dikirim
    if (namaMenu !== undefined) menu.namaMenu = namaMenu;
    if (kategori !== undefined) menu.kategori = kategori;
    if (harga !== undefined) menu.harga = harga;
    if (stok !== undefined) menu.stok = stok;
    if (deskripsi !== undefined) menu.deskripsi = deskripsi;
    if (isAvailable !== undefined) menu.isAvailable = isAvailable;

    const updatedMenu = await menu.save();

    res.status(200).json({
      success: true,
      message: 'Perubahan menu berhasil disimpan',
      data: updatedMenu,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    4. Hapus Menu
// @route   DELETE /api/menus/:id
// @access  Private (Vendor)
const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;

    const menu = await Menu.findById(id);
    if (!menu) {
      return res.status(404).json({ success: false, message: 'Menu tidak ditemukan' });
    }

    const vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor || menu.vendorId.toString() !== vendor._id.toString()) {
      return res.status(403).json({ success: false, message: 'Akses ditolak: Anda bukan pemilik menu ini' });
    }

    await menu.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Menu berhasil dihapus dari katalog',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const restockMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { jumlahTambah } = req.body; // Jumlah porsi yang ingin ditambahkan

    if (!jumlahTambah || jumlahTambah <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Jumlah penambahan stok harus lebih besar dari 0',
      });
    }

    const menu = await Menu.findById(id);
    if (!menu) {
      return res.status(404).json({ success: false, message: 'Menu tidak ditemukan' });
    }

    // Verifikasi kepemilikan vendor
    const vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor || menu.vendorId.toString() !== vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak: Anda bukan pemilik menu ini',
      });
    }

    // Tambahkan stok dan aktifkan kembali jika sebelumnya habis
    menu.stok += Number(jumlahTambah);
    menu.isAvailable = true;

    await menu.save();

    res.status(200).json({
      success: true,
      message: `Berhasil menambah ${jumlahTambah} porsi. Stok sekarang: ${menu.stok}`,
      data: menu,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createMenu,
  getMyMenus,
  updateMenu,
  restockMenu,
  deleteMenu,
};