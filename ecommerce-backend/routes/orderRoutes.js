const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

router.route('/').post(protect, placeOrder).get(protect, getOrders);
router.route('/:id').get(protect, getOrderById).put(protect, admin, updateOrderStatus);
router.get('/admin/all', protect, admin, getAllOrders);

module.exports = router;