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
  onReviewsChanged?: () => void;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ productId, onReviewsChanged }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/products/${productId}/reviews`);
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

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    };
  };

  const handleStartEdit = (review: Review) => {
    setEditingReviewId(review._id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditRating(5);
    setEditComment('');
  };

  const handleSaveEdit = async (reviewId: string) => {
    if (!editComment.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      setActionLoading(true);
      await axios.put(
        `/api/products/${productId}/reviews/${reviewId}`,
        {
          rating: editRating,
          comment: editComment.trim(),
        },
        getAuthConfig()
      );

      handleCancelEdit();
      await fetchReviews();
      onReviewsChanged?.();
      alert('Review updated successfully');
    } catch (error: any) {
      console.error('Error updating review:', error);
      alert(error.response?.data?.message || 'Failed to update review');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('Delete this review?')) {
      return;
    }

    try {
      setActionLoading(true);
      await axios.delete(
        `/api/products/${productId}/reviews/${reviewId}`,
        getAuthConfig()
      );

      if (editingReviewId === reviewId) {
        handleCancelEdit();
      }

      await fetchReviews();
      onReviewsChanged?.();
      alert('Review deleted successfully');
    } catch (error: any) {
      console.error('Error deleting review:', error);
      alert(error.response?.data?.message || 'Failed to delete review');
    } finally {
      setActionLoading(false);
    }
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
            {editingReviewId === review._id ? (
              <>
                <div className="review-header">
                  <div className="review-user">
                    <strong>{review.user.name}</strong>
                  </div>
                  <div className="review-rating">
                    <select
                      value={editRating}
                      onChange={(event) => setEditRating(Number(event.target.value))}
                      disabled={actionLoading}
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <option key={value} value={value}>
                          {value}/5
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="review-date">
                  {formatDate(review.createdAt)}
                </div>
                <div className="review-comment">
                  <textarea
                    value={editComment}
                    onChange={(event) => setEditComment(event.target.value)}
                    rows={4}
                    disabled={actionLoading}
                  />
                </div>
                <div className="review-actions">
                  <button
                    className="edit-review-btn"
                    onClick={() => handleSaveEdit(review._id)}
                    disabled={actionLoading}
                  >
                    Save
                  </button>
                  <button
                    className="delete-review-btn"
                    onClick={handleCancelEdit}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
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
                    <button
                      className="edit-review-btn"
                      onClick={() => handleStartEdit(review)}
                      disabled={actionLoading}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-review-btn"
                      onClick={() => handleDelete(review._id)}
                      disabled={actionLoading}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewsList;
