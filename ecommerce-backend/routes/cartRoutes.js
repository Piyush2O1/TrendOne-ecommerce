const express = require('express');
const router = express.Router();
const { addToCart, removeFromCart, getCart } = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.route('/').post(protect, addToCart).get(protect, getCart);
router.route('/:productId').delete(protect, removeFromCart);

module.exports = router;