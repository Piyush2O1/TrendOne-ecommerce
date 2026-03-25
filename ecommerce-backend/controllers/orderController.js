const Order = require('../models/Order');
const Cart = require('../models/Cart');

const REQUIRED_SHIPPING_FIELDS = ['street', 'city', 'state', 'zipCode', 'country'];

const isValidShippingAddress = (shippingAddress = {}) => (
  REQUIRED_SHIPPING_FIELDS.every((field) => (
    typeof shippingAddress[field] === 'string' && shippingAddress[field].trim()
  ))
);

// @desc    Place order from cart
// @route   POST /api/orders
// @access  Private
const placeOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress } = req.body;

    if (!isValidShippingAddress(shippingAddress)) {
      return res.status(400).json({ message: 'Please provide a complete shipping address' });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    for (const item of cart.items) {
      if (!item.product) {
        return res.status(400).json({ message: 'One or more cart items are no longer available' });
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({ message: 'Cart contains an invalid quantity' });
      }

      if (item.quantity > item.product.stock) {
        return res.status(400).json({
          message: `${item.product.name} only has ${item.product.stock} item(s) left in stock`,
        });
      }
    }

    // Calculate total price and prepare order products
    let totalPrice = 0;
    const orderProducts = cart.items.map((item) => {
      const productTotal = item.product.price * item.quantity;
      totalPrice += productTotal;

      return {
        product: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
      };
    });

    // Create order
    const order = new Order({
      user: userId,
      products: orderProducts,
      totalPrice,
      shippingAddress,
    });

    const createdOrder = await order.save();

    // Populate product details in response
    await createdOrder.populate('user', 'name email');

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user or user is admin
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  placeOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
};
