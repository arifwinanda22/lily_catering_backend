const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const Vendor = require('../models/vendorModel');
const Expense = require('../models/expenseModel');

// @desc    Ambil Analitik & Laporan Keuangan Lengkap Vendor
// @route   GET /api/finance/vendor-report
// @access  Private (Vendor)
const getVendorFinancialReport = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor tidak ditemukan' });
    }

    const vendorObjectId = new mongoose.Types.ObjectId(vendor._id);

    // 1. Total Pendapatan Lunas (Gross Revenue)
    const revenueSummary = await Order.aggregate([
      {
        $match: {
          vendorId: vendorObjectId,
          paymentStatus: 'Lunas',
        },
      },
      {
        $group: {
          _id: null,
          totalOmset: { $sum: '$totalBiaya' },
          totalPesananLunas: { $sum: 1 },
        },
      },
    ]);

    const totalOmset = revenueSummary[0]?.totalOmset || 0;
    const totalPesananLunas = revenueSummary[0]?.totalPesananLunas || 0;

    // 2. Breakdown Berdasarkan Metode Pembayaran
    const paymentMethodBreakdown = await Order.aggregate([
      {
        $match: {
          vendorId: vendorObjectId,
          paymentStatus: 'Lunas',
        },
      },
      {
        $group: {
          _id: '$metodePembayaran',
          totalNominal: { $sum: '$totalBiaya' },
          jumlahTransaksi: { $sum: 1 },
        },
      },
      {
        $project: {
          metode: '$_id',
          totalNominal: 1,
          jumlahTransaksi: 1,
          _id: 0,
        },
      },
    ]);

    // 3. Total Modal / Pengeluaran
    const expenseSummary = await Expense.aggregate([
      {
        $match: { vendorId: vendorObjectId },
      },
      {
        $group: {
          _id: null,
          totalPengeluaran: { $sum: '$nominal' },
        },
      },
    ]);

    const totalPengeluaran = expenseSummary[0]?.totalPengeluaran || 0;

    // 4. Breakdown Pengeluaran per Kategori
    const expensesByCategory = await Expense.aggregate([
      { $match: { vendorId: vendorObjectId } },
      {
        $group: {
          _id: '$kategori',
          total: { $sum: '$nominal' },
        },
      },
      {
        $project: {
          kategori: '$_id',
          total: 1,
          _id: 0,
        },
      },
    ]);

    // 5. Data Grafik Tren Omset Bulanan
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          vendorId: vendorObjectId,
          paymentStatus: 'Lunas',
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          omset: { $sum: '$totalBiaya' },
          transaksi: { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
      {
        $project: {
          bulan: '$_id',
          omset: 1,
          transaksi: 1,
          _id: 0,
        },
      },
    ]);

    // 6. Hitung Estimasi Laba Bersih
    // Estimasi biaya potongan Payment Gateway (flat rata-rata ~1.5% atau fee Midtrans)
    const estimasiFeeGateway = totalOmset * 0.015;
    const pendapatanBersih = totalOmset - estimasiFeeGateway;
    const labaBersih = pendapatanBersih - totalPengeluaran;

    res.status(200).json({
      success: true,
      data: {
        ringkasan: {
          totalOmsetKotor: totalOmset,
          potonganGateway: estimasiFeeGateway,
          pendapatanBersih,
          totalModalPengeluaran: totalPengeluaran,
          labaBersih,
          totalPesananLunas,
        },
        laporanPerMetodeBayar: paymentMethodBreakdown,
        laporanPengeluaranPerKategori: expensesByCategory,
        grafikOmsetBulanan: monthlyRevenue,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Catat Pengeluaran Baru
// @route   POST /api/finance/expenses
// @access  Private (Vendor)
const createExpense = async (req, res) => {
  try {
    const { judulPengeluaran, kategori, nominal, catatan } = req.body;

    const vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor tidak ditemukan' });
    }

    const expense = await Expense.create({
      vendorId: vendor._id,
      judulPengeluaran,
      kategori,
      nominal,
      catatan,
    });

    res.status(201).json({
      success: true,
      message: 'Pengeluaran berhasil dicatat',
      data: expense,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getVendorFinancialReport,
  createExpense,
};