import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ReviewForm from '../components/ReviewForm';
import ReviewsList from '../components/ReviewsList';
import './ProductDetail.css';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  ratingsAverage: number;
  ratingsQuantity: number;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { user } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/products/${id}`);
      setProduct(response.data);
    } catch (err) {
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      alert('Please login to add items to cart');
      return;
    }

    if (!product) return;

    try {
      await addToCart(product._id);
      alert('Product added to cart!');
    } catch (err) {
      alert('Failed to add product to cart');
    }
  };

  const handleReviewAdded = () => {
    // Refresh product data to update ratings
    fetchProduct();
    setShowReviewForm(false);
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <span key={index} className={`star ${index < Math.floor(rating) ? 'filled' : ''}`}>
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="loading">Loading product...</div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="error">{error || 'Product not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="product-detail">
          <div className="product-image">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} />
            ) : (
              <div className="no-image">No Image Available</div>
            )}
          </div>

          <div className="product-info">
            <h1>{product.name}</h1>
            <div className="product-rating">
              {renderStars(product.ratingsAverage)}
              <span className="rating-text">
                {product.ratingsAverage.toFixed(1)} ({product.ratingsQuantity} reviews)
              </span>
            </div>
            <p className="product-category">Category: {product.category}</p>
            <p className="product-description">{product.description}</p>
            <div className="product-price">₹{product.price}</div>
            <div className="product-stock">
              {product.stock > 0 ? (
                <span className="in-stock">In Stock ({product.stock} available)</span>
              ) : (
                <span className="out-of-stock">Out of Stock</span>
              )}
            </div>

            <div className="product-actions">
              <button
                onClick={handleAddToCart}
                className="add-to-cart-btn"
                disabled={product.stock === 0}
              >
                Add to Cart
              </button>
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="write-review-btn"
              >
                {showReviewForm ? 'Cancel Review' : 'Write Review'}
              </button>
            </div>
          </div>
        </div>

        {showReviewForm && (
          <div className="review-section">
            <ReviewForm productId={product._id} onReviewAdded={handleReviewAdded} />
          </div>
        )}

        <div className="reviews-section">
          <ReviewsList productId={product._id} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;