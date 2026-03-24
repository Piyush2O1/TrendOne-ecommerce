import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import WishlistButton from '../components/WishlistButton';
import './Products.css';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
}

interface ProductsResponse {
  products: Product[];
  pages: number;
}

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'books', label: 'Books' },
  { value: 'home-garden', label: 'Home & Garden' },
  { value: 'sports-fitness', label: 'Sports & Fitness' },
  { value: 'appliances', label: 'Appliances' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'beauty-personal-care', label: 'Beauty & Personal Care' },
  { value: 'toys-games', label: 'Toys & Games' },
  { value: 'automotive', label: 'Automotive' },
] as const;

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { user } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, [page, searchTerm, categoryFilter, minPrice, maxPrice, ratingFilter, sort]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 12,
      };

      if (searchTerm) params.keyword = searchTerm;
      if (categoryFilter && categoryFilter !== 'all') params.category = categoryFilter;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (ratingFilter) params.rating = ratingFilter;
      if (sort) params.sort = sort;

      const response = await axios.get<ProductsResponse>('/api/products', { params });
      setProducts(response.data.products);
      setTotalPages(response.data.pages || 1);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const handleAddToCart = async (productId: string) => {
    if (!user) {
      alert('Please login to add items to cart');
      return;
    }

    try {
      await addToCart(productId);
      alert('Product added to cart!');
    } catch (err) {
      alert('Failed to add product to cart');
    }
  };

  const applyFilters = () => {
    setPage(1);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setMinPrice('');
    setMaxPrice('');
    setRatingFilter('');
    setSort('newest');
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  if (initialLoad) return <div className="loading">Loading products...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="products-page">
      <div className="container">
        <h1>Products</h1>
        {loading && <div className="loading">Updating products...</div>}
        <div className="products-filters">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Min price"
            value={minPrice}
            min={0}
            onChange={(e) => setMinPrice(e.target.value)}
          />

          <input
            type="number"
            placeholder="Max price"
            value={maxPrice}
            min={0}
            onChange={(e) => setMaxPrice(e.target.value)}
          />

          <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
            <option value="">Any rating</option>
            <option value="1">1+ stars</option>
            <option value="2">2+ stars</option>
            <option value="3">3+ stars</option>
            <option value="4">4+ stars</option>
            <option value="4.5">4.5+ stars</option>
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>

          <button onClick={applyFilters} className="filter-btn">Apply</button>
          <button onClick={resetFilters} className="reset-btn">Reset</button>
        </div>

        <div className="products-grid">
          {products.map((product) => (
            <div key={product._id} className="product-card">
              <div className="product-card-media">
                <Link to={`/products/${product._id}`} className="product-link">
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="product-image"
                    />
                  )}
                </Link>

                <span className="product-badge">NEW</span>
                <span className="product-badge-off">30% OFF</span>
              </div>
              <div className="product-info">
                <Link to={`/products/${product._id}`} className="product-link">
                  <h3>{product.name}</h3>
                </Link>
                <p className="product-description">{product.description}</p>
                <p className="product-category">Category: {product.category}</p>
                <p className="product-stock">Stock: {product.stock}</p>
                <div className="product-footer">
                  <span className="product-price">₹{product.price}</span>
                  <div className="product-actions">
                    <WishlistButton productId={product._id} />
                    <Link to={`/products/${product._id}`} className="view-details-btn">
                      View Details
                    </Link>
                    <button
                      onClick={() => handleAddToCart(product._id)}
                      className="add-to-cart-btn"
                      disabled={product.stock === 0}
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pagination">
          <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Products;
