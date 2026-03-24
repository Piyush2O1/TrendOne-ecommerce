const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getPaymentStatus,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/status/:orderId', protect, getPaymentStatus);

module.exports = router;