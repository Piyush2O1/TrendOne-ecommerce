import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProductForm from '../components/ProductForm';
import { useAuth } from '../context/AuthContext';
import { fetchAllProducts, getProductSellerId, type ProductRecord } from '../utils/productApi';
import './MyProducts.css';

const MyProducts: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);

  useEffect(() => {
    if (user?.role === 'seller') {
      void fetchMyProducts();
    }
  }, [user]);

  const fetchMyProducts = async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const allProducts = await fetchAllProducts();
      setProducts(
        allProducts.filter((product) => getProductSellerId(product) === user.id)
      );
    } catch (fetchError) {
      console.error('Error fetching seller products:', fetchError);
      setError('Failed to load your products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product: ProductRecord) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleCloseProductForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const handleProductSave = async () => {
    await fetchMyProducts();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Delete this product?')) {
      return;
    }

    try {
      await axios.delete(`/api/products/${productId}`);
      await fetchMyProducts();
      alert('Product deleted successfully');
    } catch (deleteError) {
      console.error('Error deleting product:', deleteError);
      alert('Failed to delete product');
    }
  };

  if (user?.role !== 'seller') {
    return (
      <div className="my-products-page">
        <div className="my-products-empty">
          <h2>Seller Access Required</h2>
          <p>This page is only available to seller accounts.</p>
        </div>
      </div>
    );
  }

  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const categoryCount = new Set(products.map((product) => product.category)).size;

  return (
    <div className="my-products-page">
      <div className="seller-hero">
        <div>
          <h1>My Products</h1>
          <p>Manage the catalog you created without exposing admin-only controls.</p>
        </div>
        <button className="add-product-btn" onClick={handleAddProduct}>
          Add New Product
        </button>
      </div>

      <div className="seller-stat-grid">
        <div className="seller-stat-card">
          <span className="seller-stat-label">My Products</span>
          <strong>{products.length}</strong>
        </div>
        <div className="seller-stat-card">
          <span className="seller-stat-label">Total Stock</span>
          <strong>{totalStock}</strong>
        </div>
        <div className="seller-stat-card">
          <span className="seller-stat-label">Categories</span>
          <strong>{categoryCount}</strong>
        </div>
      </div>

      <div className="my-products-panel">
        <div className="section-header">
          <h2>Your Catalog</h2>
          <span className="seller-panel-meta">Only products you created appear here.</span>
        </div>

        {loading ? (
          <div className="loading">Loading your products...</div>
        ) : error ? (
          <div className="my-products-empty">
            <p>{error}</p>
            <button className="add-product-btn" onClick={() => void fetchMyProducts()}>
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="my-products-empty">
            <h3>No products yet</h3>
            <p>Create your first product to start managing your seller catalog.</p>
            <button className="add-product-btn" onClick={handleAddProduct}>
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="products-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>INR {product.price}</td>
                    <td>{product.stock}</td>
                    <td>
                      {product.createdAt
                        ? new Date(product.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => handleEditProduct(product)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => void handleDeleteProduct(product._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default MyProducts;
