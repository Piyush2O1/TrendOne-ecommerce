const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistStatus,
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getWishlist);

router.route('/:productId')
  .post(protect, addToWishlist)
  .delete(protect, removeFromWishlist);

router.route('/check/:productId')
  .get(protect, checkWishlistStatus);

module.exports = router;