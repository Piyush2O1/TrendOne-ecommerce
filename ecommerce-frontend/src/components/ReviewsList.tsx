import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './ReviewsList.css';

interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewsListProps {
  productId: string;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ productId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/products/${productId}/reviews`);
      setReviews(response.data.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <span key={index} className={`star ${index < rating ? 'filled' : ''}`}>
        ★
      </span>
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className="reviews-loading">Loading reviews...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="no-reviews">
        <p>No reviews yet. Be the first to review this product!</p>
      </div>
    );
  }

  return (
    <div className="reviews-list">
      <h3>Customer Reviews ({reviews.length})</h3>
      <div className="reviews-container">
        {reviews.map((review) => (
          <div key={review._id} className="review-item">
            <div className="review-header">
              <div className="review-user">
                <strong>{review.user.name}</strong>
              </div>
              <div className="review-rating">
                {renderStars(review.rating)}
                <span className="rating-number">({review.rating}/5)</span>
              </div>
            </div>
            <div className="review-date">
              {formatDate(review.createdAt)}
            </div>
            <div className="review-comment">
              {review.comment}
            </div>
            {user && user.id === review.user._id && (
              <div className="review-actions">
                <button className="edit-review-btn">Edit</button>
                <button className="delete-review-btn">Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewsList;