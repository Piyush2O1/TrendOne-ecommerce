import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ProductForm from '../components/ProductForm';
import './AdminDashboard.css';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  createdAt: string;
}

type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'failed';

interface Order {
  _id: string;
  user: User;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  products: any[];
}

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

interface ProductsResponse {
  products: Product[];
}

const ORDER_STATUSES: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'failed'];

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'products' | 'orders'>('overview');
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchProducts = async (): Promise<Product[]> => {
    const { data } = await axios.get<ProductsResponse>('/api/products');
    return data.products;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [usersRes, productsRes, ordersRes] = await Promise.all([
        axios.get<User[]>('/api/auth/users'),
        fetchProducts(),
        axios.get<Order[]>('/api/orders/admin/all'),
      ]);

      const usersData = usersRes.data;
      const productsData = productsRes;
      const ordersData = ordersRes.data;

      // Calculate stats
      const totalRevenue = ordersData.reduce((sum: number, order: Order) => sum + order.totalPrice, 0);

      setStats({
        totalUsers: usersData.length,
        totalProducts: productsData.length,
        totalOrders: ordersData.length,
        totalRevenue,
      });

      setUsers(usersData);
      setProducts(productsData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await axios.put(`/api/orders/${orderId}`, { status });
      // Refresh orders
      const ordersRes = await axios.get<Order[]>('/api/orders/admin/all');
      setOrders(ordersRes.data);
      alert('Order status updated successfully!');
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const deleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`/api/products/${productId}`);
        // Refresh products
        const productsData = await fetchProducts();
        setProducts(productsData);
        setStats((current) => ({
          ...current,
          totalProducts: productsData.length,
        }));
        alert('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      }
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleProductSave = async () => {
    // Refresh products list
    const productsData = await fetchProducts();
    setProducts(productsData);

    // Refresh stats
    const usersRes = await axios.get<User[]>('/api/auth/users');
    const ordersRes = await axios.get<Order[]>('/api/orders/admin/all');

    const usersData = usersRes.data;
    const ordersData = ordersRes.data;
    const totalRevenue = ordersData.reduce((sum: number, order: Order) => sum + order.totalPrice, 0);

    setStats({
      totalUsers: usersData.length,
      totalProducts: productsData.length,
      totalOrders: ordersData.length,
      totalRevenue,
    });
  };

  const handleCloseProductForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="admin-dashboard">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {user.name}!</p>
      </div>

      <div className="dashboard-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          Users ({stats.totalUsers})
        </button>
        <button
          className={activeTab === 'products' ? 'active' : ''}
          onClick={() => setActiveTab('products')}
        >
          Products ({stats.totalProducts})
        </button>
        <button
          className={activeTab === 'orders' ? 'active' : ''}
          onClick={() => setActiveTab('orders')}
        >
          Orders ({stats.totalOrders})
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Users</h3>
                <div className="stat-number">{stats.totalUsers}</div>
              </div>
              <div className="stat-card">
                <h3>Total Products</h3>
                <div className="stat-number">{stats.totalProducts}</div>
              </div>
              <div className="stat-card">
                <h3>Total Orders</h3>
                <div className="stat-number">{stats.totalOrders}</div>
              </div>
              <div className="stat-card">
                <h3>Total Revenue</h3>
                <div className="stat-number">₹{stats.totalRevenue.toLocaleString()}</div>
              </div>
            </div>

            <div className="recent-orders">
              <h3>Recent Orders</h3>
              <div className="orders-table">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order._id}>
                        <td>{order._id.slice(-8)}</td>
                        <td>{order.user.name}</td>
                        <td>₹{order.totalPrice}</td>
                        <td>
                          <span className={`status ${order.status}`}>{order.status}</span>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <h3>All Users</h3>
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role ${user.role}`}>{user.role}</span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="products-section">
            <div className="section-header">
              <h3>All Products</h3>
              <button className="add-product-btn" onClick={handleAddProduct}>Add New Product</button>
            </div>
            <div className="products-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>₹{product.price}</td>
                      <td>{product.stock}</td>
                      <td>
                        <button className="edit-btn" onClick={() => handleEditProduct(product)}>Edit</button>
                        <button
                          className="delete-btn"
                          onClick={() => deleteProduct(product._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-section">
            <h3>All Orders</h3>
            <div className="orders-table">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Products</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td>{order._id.slice(-8)}</td>
                      <td>{order.user.name}</td>
                      <td>{order.products.length} items</td>
                      <td>₹{order.totalPrice}</td>
                      <td>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order._id, e.target.value as OrderStatus)}
                          className="status-select"
                        >
                          {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button className="view-btn">View Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showProductForm && (
        <ProductForm
          product={editingProduct}
          onClose={handleCloseProductForm}
          onSave={handleProductSave}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
