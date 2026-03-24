const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

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

    if (!isRazorpayConfigured) {
      // Mock payment for testing
      const mockOrderId = `mock_order_${Date.now()}_${orderId}`;
      order.razorpayOrderId = mockOrderId;
      await order.save();

      return res.json({
        orderId: mockOrderId,
        amount: order.totalPrice * 100,
        currency: 'INR',
        key: 'mock_key_for_testing',
        isMock: true,
      });
    }

    // Create Razorpay order
    const options = {
      amount: order.totalPrice * 100, // Razorpay expects amount in paisa
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

    if (!isRazorpayConfigured) {
      // Mock payment verification for testing
      if (razorpay_order_id && razorpay_order_id.startsWith('mock_order_')) {
        order.status = 'paid';
        order.razorpayPaymentId = `mock_payment_${Date.now()}`;
        order.paidAt = Date.now();
        await order.save();

        return res.json({
          success: true,
          message: 'Mock payment verified successfully (Testing Mode)',
          order,
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
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      // Payment verified successfully
      order.status = 'paid';
      order.razorpayPaymentId = razorpay_payment_id;
      order.paidAt = Date.now();
      await order.save();

      res.json({
        success: true,
        message: 'Payment verified successfully',
        order,
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