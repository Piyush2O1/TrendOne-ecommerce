import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './WishlistButton.css';

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({ productId, className = '' }) => {
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkWishlistStatus();
    }
  }, [user, productId]);

  const checkWishlistStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      };

      const response = await axios.get(
        `/api/wishlist/check/${productId}`,
        config
      );
      setInWishlist(response.data.inWishlist);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      alert('Please login to add items to wishlist');
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

      if (inWishlist) {
        // Remove from wishlist
        await axios.delete(`/api/wishlist/${productId}`, config);
        setInWishlist(false);
      } else {
        // Add to wishlist
        await axios.post(`/api/wishlist/${productId}`, {}, config);
        setInWishlist(true);
      }
    } catch (error: any) {
      console.error('Error updating wishlist:', error);
      alert(error.response?.data?.message || 'Failed to update wishlist');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Don't show button if not logged in
  }

  return (
    <button
      onClick={toggleWishlist}
      disabled={loading}
      className={`wishlist-btn ${inWishlist ? 'active' : ''} ${className}`}
      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {loading ? '...' : '♥'}
    </button>
  );
};

export default WishlistButton;