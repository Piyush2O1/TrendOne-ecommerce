import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Checkout.css';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Checkout: React.FC = () => {
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  const totalPrice = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      alert('Please login to place an order');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    // Validate shipping address
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state ||
        !shippingAddress.zipCode || !shippingAddress.country) {
      alert('Please fill in all shipping address fields');
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      };

      // Place the order
      const orderResponse = await axios.post('/api/orders',
        { shippingAddress },
        config
      );

      const order = orderResponse.data;

      // Create Razorpay order
      const paymentResponse = await axios.post('/api/payment/create-order',
        { orderId: order._id },
        config
      );

      const { orderId: razorpayOrderId, amount, currency, key, isMock } = paymentResponse.data;

      if (isMock) {
        // Mock payment for testing
        const mockResponse = {
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: `mock_pay_${Date.now()}`,
          razorpay_signature: 'mock_signature_for_testing',
        };

        // Simulate successful payment
        setTimeout(async () => {
          try {
            await axios.post('/api/payment/verify', {
              razorpay_order_id: mockResponse.razorpay_order_id,
              razorpay_payment_id: mockResponse.razorpay_payment_id,
              razorpay_signature: mockResponse.razorpay_signature,
              orderId: order._id,
            });

            clearCart();
            alert('Mock payment successful! Order placed. (Testing Mode)');
            navigate('/orders');
          } catch (error) {
            alert('Mock payment verification failed');
          }
        }, 2000); // Simulate payment processing delay

        alert('Redirecting to mock payment... (Testing Mode)');
        return;
      }

      // Initialize Razorpay
      const options = {
        key,
        amount,
        currency,
        name: 'E-Commerce Store',
        description: 'Purchase from E-Commerce Store',
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          try {
            // Verify payment
            await axios.post('/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order._id,
            });

            clearCart();
            alert('Payment successful! Order placed.');
            navigate('/orders');
          } catch (error) {
            alert('Payment verification failed');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#3399cc',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Order placement failed:', error);
      alert('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="checkout-page">
        <div className="container">
          <p>Please login to checkout</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container">
          <p>Your cart is empty</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>Checkout</h1>
        <div className="checkout-content">
          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.product._id} className="checkout-item">
                  <div className="item-info">
                    <h4>{item.product.name}</h4>
                    <p>Quantity: {item.quantity}</p>
                    <p>Price: ₹{item.product.price}</p>
                  </div>
                  <div className="item-total">
                    ₹{item.product.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>
            <div className="total-amount">
              <strong>Total: ₹{totalPrice}</strong>
            </div>
          </div>

          <div className="shipping-form">
            <h2>Shipping Address</h2>
            <form>
              <div className="form-group">
                <label htmlFor="street">Street Address</label>
                <input
                  type="text"
                  id="street"
                  name="street"
                  value={shippingAddress.street}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={shippingAddress.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="state">State</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={shippingAddress.state}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="zipCode">ZIP Code</label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={shippingAddress.zipCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="country">Country</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={shippingAddress.country}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </form>

            <button
              onClick={handlePlaceOrder}
              className="place-order-btn"
              disabled={loading}
            >
              {loading ? 'Processing...' : `Pay ₹${totalPrice}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;