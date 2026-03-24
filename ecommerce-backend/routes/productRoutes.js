const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');

// Include review routes
const reviewRouter = require('./reviewRoutes');
router.use('/:productId/reviews', reviewRouter);

router.route('/').get(getProducts).post(protect, createProduct);
router.route('/:id').get(getProductById).put(protect, updateProduct).delete(protect, admin, deleteProduct);

module.exports = router;