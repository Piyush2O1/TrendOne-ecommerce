import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Orders.css';

interface Order {
  _id: string;
  products: Array<{
    product: {
      _id: string;
      name: string;
    };
    name: string;
    price: number;
    quantity: number;
  }>;
  totalPrice: number;
  status: string;
  createdAt: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      setOrders(response.data);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'paid': return 'status-paid';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'failed': return 'status-failed';
      default: return 'status-default';
    }
  };

  if (!user) {
    return (
      <div className="orders-page">
        <div className="container">
          <p>Please login to view your orders</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading">Loading orders...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="orders-page">
      <div className="container">
        <h1>My Orders</h1>
        {orders.length === 0 ? (
          <div className="no-orders">
            <p>You haven't placed any orders yet</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>Order #{order._id.slice(-8)}</h3>
                    <p>Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className={`order-status ${getStatusColor(order.status)}`}>
                    {order.status.toUpperCase()}
                  </div>
                </div>

                <div className="order-items">
                  {order.products.map((item, index) => (
                    <div key={index} className="order-item">
                      <div className="item-details">
                        <h4>{item.name}</h4>
                        <p>Quantity: {item.quantity}</p>
                        <p>Price: ₹{item.price}</p>
                      </div>
                      <div className="item-total">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-footer">
                  <div className="shipping-address">
                    <h4>Shipping Address:</h4>
                    <p>{order.shippingAddress.street}</p>
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                  <div className="order-total">
                    <strong>Total: ₹{order.totalPrice}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;