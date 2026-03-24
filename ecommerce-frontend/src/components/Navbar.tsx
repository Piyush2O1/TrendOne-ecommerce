import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          E-Commerce
        </Link>

        <ul className="navbar-menu">
          <li>
            <Link to="/products">Products</Link>
          </li>
          {user && (
            <>
              <li>
                <Link to="/orders">Orders</Link>
              </li>
              {user.role === 'admin' && (
                <li>
                  <Link to="/admin" className="admin-link">Admin Dashboard</Link>
                </li>
              )}
              <li>
                <Link to="/cart" className="cart-link">
                  Cart
                  {cartItemCount > 0 && (
                    <span className="cart-count">{cartItemCount}</span>
                  )}
                </Link>
              </li>
            </>
          )}
        </ul>

        <div className="navbar-auth">
          {user ? (
            <div className="user-menu">
              <span>Welcome, {user.name}</span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="auth-link">
                Login
              </Link>
              <Link to="/signup" className="auth-link signup">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;