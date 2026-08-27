const express = require('express');
const router = express.Router();
const {
  createMenu,
  getMyMenus,
  updateMenu,
  deleteMenu,
restockMenu,
} = require('../controllers/menuController');
const { protect } = require('../middlewares/authMiddleware');

// Semua aksi pengelolaan menu membutuhkan token login vendor
router.use(protect);

router.post('/', createMenu);
router.get('/my-menus', getMyMenus);
router.put('/:id', updateMenu);
router.delete('/:id', deleteMenu);
router.patch('/:id/restock', restockMenu);  
module.exports = router;