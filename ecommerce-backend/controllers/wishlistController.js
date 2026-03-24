const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.find({ user: req.user.id })
      .populate('product')
      .sort({ addedAt: -1 });

    res.json({
      success: true,
      count: wishlist.length,
      data: wishlist,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist/:productId
// @access  Private
const addToWishlist = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.user.id;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if already in wishlist
    const existingItem = await Wishlist.findOne({
      user: userId,
      product: productId,
    });

    if (existingItem) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    // Add to wishlist
    const wishlistItem = await Wishlist.create({
      user: userId,
      product: productId,
    });

    await wishlistItem.populate('product');

    res.status(201).json({
      success: true,
      data: wishlistItem,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.user.id;

    const wishlistItem = await Wishlist.findOneAndDelete({
      user: userId,
      product: productId,
    });

    if (!wishlistItem) {
      return res.status(404).json({ message: 'Product not found in wishlist' });
    }

    res.json({
      success: true,
      message: 'Product removed from wishlist',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check if product is in user's wishlist
// @route   GET /api/wishlist/check/:productId
// @access  Private
const checkWishlistStatus = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.user.id;

    const wishlistItem = await Wishlist.findOne({
      user: userId,
      product: productId,
    });

    res.json({
      success: true,
      inWishlist: !!wishlistItem,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistStatus,
};