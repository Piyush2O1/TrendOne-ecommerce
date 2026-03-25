const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, isSeller } = require('../middleware/auth');

// Include review routes
const reviewRouter = require('./reviewRoutes');
router.use('/:productId/reviews', reviewRouter);

router.route('/').get(getProducts).post(protect, isSeller, createProduct);
router.route('/:id').get(getProductById).put(protect, isSeller, updateProduct).delete(protect, isSeller, deleteProduct);

module.exports = router;
