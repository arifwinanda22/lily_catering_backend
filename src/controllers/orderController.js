const Order = require('../models/orderModel');
const Vendor = require('../models/vendorModel');

// @desc    1. User: Membuat Pesanan Baru (Checkout)
// @route   POST /api/orders
// @access  Private (Role: User / Corporate Client)
const createOrder = async (req, res) => {
  try {
    const {
      vendorId,
      items,
      totalBiaya,
      tanggalKirim,
      lokasiPengiriman,
      metodePembayaran,
    } = req.body;

    if (!vendorId || !items || items.length === 0 || !totalBiaya || !tanggalKirim || !lokasiPengiriman || !metodePembayaran) {
      return res.status(400).json({
        success: false,
        message: 'Mohon lengkapi semua field formulir pemesanan',
      });
    }

    // Generate Order ID Unik (contoh: ORD-849201)
    const customOrderId = `ORD-${Date.now().toString().slice(-6)}`;

    const initialLogText =
      metodePembayaran === 'Bayar Langsung ke Vendor'
        ? 'Pesanan dibuat. Menunggu proses masak dan pembayaran langsung ke pihak Dapur/Kurir.'
        : 'Pesanan berhasil dibuat. Menunggu konfirmasi jadwal dari pihak Dapur.';

    const order = await Order.create({
      orderId: customOrderId,
      userId: req.user.id,
      vendorId,
      items,
      totalBiaya,
      tanggalKirim,
      lokasiPengiriman,
      metodePembayaran,
      paymentStatus: 'Menunggu Pembayaran',
      status: 'Aktif',
      tracking: {
        driverName: 'Menunggu Driver',
        driverPhone: '-',
        logs: [
          {
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
            text: initialLogText,
          },
        ],
      },
    });

    res.status(201).json({
      success: true,
      message: 'Pesanan katering berhasil dibuat',
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Gagal membuat pesanan' });
  }
};

// @desc    2. User: Mengambil Riwayat & Tagihan Pesanan Sendiri
// @route   GET /api/orders/my-orders
// @access  Private (Role: User)
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('vendorId', 'namaVendor kategori alamat kota telepon')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil riwayat pesanan' });
  }
};

// @desc    3. Vendor: Mengambil Semua Pesanan yang Masuk ke Dapurnya
// @route   GET /api/orders/vendor-orders
// @access  Private (Role: Vendor)
const getVendorOrders = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Profil vendor belum ditemukan' });
    }

    const orders = await Order.find({ vendorId: vendor._id })
      .populate('userId', 'name email phone company address')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar pesanan masuk' });
  }
};

// @desc    4. Detail Pesanan & Tracking Terkini (User & Vendor)
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('vendorId', 'namaVendor kategori alamat kota telepon')
      .populate('userId', 'name email phone company address');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat detail pesanan' });
  }
};

// @desc    5. Vendor: Update Status Logistik & Informasi Kurir
// @route   PATCH /api/orders/:id/tracking
// @access  Private (Role: Vendor)
const updateOrderTracking = async (req, res) => {
  try {
    const { driverName, driverPhone, logText, status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    if (driverName) order.tracking.driverName = driverName;
    if (driverPhone) order.tracking.driverPhone = driverPhone;
    if (status) order.status = status; // 'Aktif', 'Selesai', 'Dibatalkan'

    if (logText) {
      order.tracking.logs.unshift({
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        text: logText,
      });
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Status pengiriman kurir berhasil diperbarui',
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui tracking' });
  }
};

// @desc    6. Vendor / Admin: Konfirmasi Pembayaran Langsung (Direct Payment)
// @route   PATCH /api/orders/:id/confirm-payment
// @access  Private (Role: Vendor / Admin)
const confirmDirectPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    order.paymentStatus = 'Lunas';
    order.tracking.logs.unshift({
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      text: 'Pembayaran langsung telah diverifikasi dan dikonfirmasi lunas oleh pihak Dapur/Vendor.',
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Status pembayaran berhasil diubah menjadi Lunas',
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengonfirmasi pembayaran' });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getVendorOrders,
  getOrderById,
  updateOrderTracking,
  confirmDirectPayment,
};