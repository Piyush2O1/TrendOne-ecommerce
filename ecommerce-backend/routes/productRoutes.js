const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, isAdmin } = require('../middleware/auth');

// Include review routes
const reviewRouter = require('./reviewRoutes');
router.use('/:productId/reviews', reviewRouter);

router.route('/').get(getProducts).post(protect, isAdmin, createProduct);
router.route('/:id').get(getProductById).put(protect, isAdmin, updateProduct).delete(protect, isAdmin, deleteProduct);

module.exports = router;
