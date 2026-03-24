import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="home">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to E-Commerce</h1>
          <p>Discover amazing products at great prices</p>
          <div className="hero-buttons">
            <Link to="/products" className="btn btn-primary">
              Shop Now
            </Link>
            {!user && (
              <Link to="/signup" className="btn btn-secondary">
                Join Us
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <h2>Why Choose Us?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Quality Products</h3>
              <p>We offer only the best quality products from trusted brands.</p>
            </div>
            <div className="feature-card">
              <h3>Fast Delivery</h3>
              <p>Quick and reliable shipping to get your orders to you fast.</p>
            </div>
            <div className="feature-card">
              <h3>Secure Payments</h3>
              <p>Safe and secure payment processing with multiple options.</p>
            </div>
            <div className="feature-card">
              <h3>24/7 Support</h3>
              <p>Our customer support team is always here to help you.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;