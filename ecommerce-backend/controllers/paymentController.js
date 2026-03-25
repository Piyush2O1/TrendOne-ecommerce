const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Check if Razorpay is properly configured
const isRazorpayConfigured = process.env.RAZORPAY_KEY_ID && 
                            process.env.RAZORPAY_KEY_SECRET && 
                            process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id';

let razorpay;
if (isRazorpayConfigured) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const finalizeSuccessfulPayment = async ({ orderId, userId, razorpayOrderId, razorpayPaymentId }) => {
  const session = await Order.startSession();

  try {
    let finalizedOrder;

    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);

      if (!order) {
        throw createHttpError(404, 'Order not found');
      }

      if (order.user.toString() !== userId) {
        throw createHttpError(403, 'Not authorized');
      }

      if (order.status !== 'pending') {
        throw createHttpError(400, 'Order is already processed');
      }

      if (!order.razorpayOrderId || order.razorpayOrderId !== razorpayOrderId) {
        throw createHttpError(400, 'Payment order mismatch');
      }

      for (const item of order.products) {
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.product,
            stock: { $gte: item.quantity },
          },
          {
            $inc: { stock: -item.quantity },
          },
          {
            new: true,
            session,
          }
        );

        if (!updatedProduct) {
          throw createHttpError(
            409,
            `${item.name} is no longer available in the requested quantity`
          );
        }
      }

      order.status = 'paid';
      order.razorpayPaymentId = razorpayPaymentId;
      order.paidAt = new Date();
      await order.save({ session });

      await Cart.findOneAndUpdate(
        { user: userId },
        { $set: { items: [] } },
        { session }
      );

      finalizedOrder = order;
    });

    return finalizedOrder;
  } finally {
    await session.endSession();
  }
};

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user
    if (order.user.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if order is already paid
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order is already processed' });
    }

    for (const item of order.products) {
      const product = await Product.findById(item.product).select('stock name');

      if (!product) {
        return res.status(400).json({ message: `${item.name} is no longer available` });
      }

      if (product.stock < item.quantity) {
        return res.status(409).json({
          message: `${product.name} only has ${product.stock} item(s) left in stock`,
        });
      }
    }

    if (!isRazorpayConfigured) {
      // Mock payment for testing
      const mockOrderId = `mock_order_${Date.now()}_${orderId}`;
      order.razorpayOrderId = mockOrderId;
      await order.save();

      return res.json({
        orderId: mockOrderId,
        amount: Math.round(order.totalPrice * 100),
        currency: 'INR',
        key: 'mock_key_for_testing',
        isMock: true,
      });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(order.totalPrice * 100), // Razorpay expects amount in paisa
      currency: 'INR',
      receipt: `order_${orderId}`,
      payment_capture: 1, // Auto capture
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Update order with Razorpay order ID
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ message: 'Payment order creation failed' });
  }
};

// @desc    Verify payment
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order is already processed' });
    }

    if (!order.razorpayOrderId) {
      return res.status(400).json({ message: 'Payment order not initialized' });
    }

    if (!isRazorpayConfigured) {
      // Mock payment verification for testing
      if (razorpay_order_id === order.razorpayOrderId && razorpay_payment_id) {
        const updatedOrder = await finalizeSuccessfulPayment({
          orderId,
          userId: req.user.id,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
        });

        return res.json({
          success: true,
          message: 'Mock payment verified successfully (Testing Mode)',
          order: updatedOrder,
        });
      } else {
        order.status = 'failed';
        await order.save();
        return res.status(400).json({
          success: false,
          message: 'Mock payment verification failed',
        });
      }
    }

    // Verify signature
    if (razorpay_order_id !== order.razorpayOrderId) {
      return res.status(400).json({ message: 'Payment order mismatch' });
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      const updatedOrder = await finalizeSuccessfulPayment({
        orderId,
        userId: req.user.id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      });

      res.json({
        success: true,
        message: 'Payment verified successfully',
        order: updatedOrder,
      });
    } else {
      // Payment verification failed
      order.status = 'failed';
      await order.save();

      res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

// @desc    Get payment status
// @route   GET /api/payment/status/:orderId
// @access  Private
const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user or user is admin
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      orderId: order._id,
      status: order.status,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      paidAt: order.paidAt,
      totalPrice: order.totalPrice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentStatus,
};
