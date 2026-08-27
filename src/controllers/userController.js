const User = require('../models/userModel');

// GET /api/user/profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// PUT /api/user/profile
const updateUserProfile = async (req, res) => {
  try {
    const { name, jabatan, perusahaan, email, telepon, alamat } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email sudah terdaftar pada akun lain' });
      }
      user.email = email.toLowerCase();
    }

    if (name !== undefined) user.name = name;
    if (jabatan !== undefined) user.position = jabatan;
    if (perusahaan !== undefined) user.company = perusahaan;
    if (telepon !== undefined) user.phone = telepon;
    if (alamat !== undefined) user.address = alamat;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profil perusahaan berhasil diperbarui',
      data: {
        id: updatedUser._id,
        nama: updatedUser.name,
        jabatan: updatedUser.position,
        perusahaan: updatedUser.company,
        email: updatedUser.email,
        telepon: updatedUser.phone,
        alamat: updatedUser.address,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Gagal memperbarui profil' });
  }
};

module.exports = { getUserProfile, updateUserProfile };