const snap = require('../config/midtrans');
const Order = require('../models/orderModel');
const User = require('../models/userModel');


const createPaymentToken = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'orderId wajib dikirim',
      });
    }

    // 1. Ambil data order dari database beserta data user pemesan
    const order = await Order.findById(orderId).populate('userId', 'name email phone');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan',
      });
    }

    // 2. Susun parameter transaksi Midtrans
    const parameter = {
      transaction_details: {
        order_id: order.orderId, // Format custom ID (ORD-XXXXXX)
        gross_amount: Number(order.totalBiaya),
      },
      customer_details: {
        first_name: order.userId?.name || 'Pelanggan',
        email: order.userId?.email || 'customer@mail.com',
        phone: order.userId?.phone || '08123456789',
      },
      item_details: order.items.map((item) => ({
        id: item._id ? item._id.toString() : item.namaMenu.substring(0, 20),
        price: Number(item.harga),
        quantity: Number(item.porsi),
        name: item.namaMenu.substring(0, 50),
      })),
    };

    // 3. Minta Snap Token dari Midtrans
    const transaction = await snap.createTransaction(parameter);

    // 4. Simpan token ke dokumen order (opsional, untuk tracking riwayat)
    order.paymentToken = transaction.token;
    order.paymentRedirectUrl = transaction.redirect_url;
    await order.save();

    res.status(200).json({
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Gagal membuat sesi pembayaran',
    });
  }
};

// @desc    2. Webhook Notification Handler (Dipanggil Otomatis oleh Server Midtrans)
// @route   POST /api/payments/notification
// @access  Public (Midtrans Callback)
const handleNotification = async (req, res) => {
  try {
    const statusResponse = await snap.transaction.notification(req.body);

    const orderCustomId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    // Cari order berdasarkan custom ID (ORD-XXXXXX)
    const order = await Order.findOne({ orderId: orderCustomId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order tidak ditemukan',
      });
    }

    // Logika Sinkronisasi Status Pembayaran
    if (transactionStatus === 'capture') {
      if (fraudStatus === 'accept') {
        order.paymentStatus = 'Lunas';
      }
    } else if (transactionStatus === 'settlement') {
      order.paymentStatus = 'Lunas';
      order.tracking.logs.unshift({
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        text: `Pembayaran via Gateway (${statusResponse.payment_type?.toUpperCase() || 'GATEWAY'}) telah berhasil dikonfirmasi.`,
      });
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      order.paymentStatus = 'Gagal';
      order.status = 'Dibatalkan';
      order.tracking.logs.unshift({
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        text: 'Batas waktu pembayaran habis atau transaksi dibatalkan oleh gateway.',
      });
    } else if (transactionStatus === 'pending') {
      order.paymentStatus = 'Menunggu Pembayaran';
    }

    await order.save();
    return res.status(200).json({
      success: true,
      message: 'Status order berhasil disinkronisasi',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPaymentToken,
  handleNotification,
};