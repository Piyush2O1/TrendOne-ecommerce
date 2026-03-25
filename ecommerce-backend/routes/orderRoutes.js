const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
} = require('../controllers/orderController');
const { protect, isAdmin } = require('../middleware/auth');

router.route('/').post(protect, placeOrder).get(protect, getOrders);
router.route('/:id').get(protect, getOrderById).put(protect, isAdmin, updateOrderStatus);
router.get('/admin/all', protect, isAdmin, getAllOrders);

module.exports = router;
