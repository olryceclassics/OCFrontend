import React, { useState } from 'react'
import { useTranslation } from '../i18n'
import { submitReview } from '../api'
import '../styles/components/reviews.css'

export default function ProductReviews({ productId, reviews = [], averageRating = 0, auth }) {
  const { t } = useTranslation()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', content: '' })
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmitReview = async (event) => {
    event.preventDefault()
    if (!auth?.access) {
      alert(t('reviews.loginRequired', 'Please log in to leave a review'))
      return
    }

    setSubmitting(true)
    try {
      await submitReview(productId, auth.access, {
        rating: reviewForm.rating,
        title: reviewForm.title,
        content: reviewForm.content,
      })
      setSuccessMsg(t('reviews.success', 'Review submitted successfully!'))
      setReviewForm({ rating: 5, title: '', content: '' })
      setShowReviewForm(false)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      console.error('Failed to submit review:', err)
      alert(t('reviews.error', 'Failed to submit review'))
    } finally {
      setSubmitting(false)
    }
  }

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))

  return (
    <div className="product-reviews">
      <div className="reviews-header">
        <h2>{t('reviews.title', 'Customer Reviews')}</h2>
        <button
          className="button button-secondary"
          onClick={() => setShowReviewForm(!showReviewForm)}
        >
          {showReviewForm ? t('common.cancel', 'Cancel') : t('reviews.write', '✎ Write Review')}
        </button>
      </div>

      <div className="reviews-summary">
        <div className="rating-box">
          <div className="big-rating">{averageRating.toFixed(1)}</div>
          <div className="stars">
            {'★'.repeat(Math.floor(averageRating))}
            {'☆'.repeat(5 - Math.floor(averageRating))}
          </div>
          <p className="review-count">{t('reviews.count', 'Based on {{count}} reviews', { count: reviews.length })}</p>
        </div>

        <div className="rating-distribution">
          {ratingDistribution.map((item) => (
            <div key={item.star} className="distribution-row">
              <span className="star-label">{item.star} ★</span>
              <div className="bar">
                <div
                  className="bar-fill"
                  style={{
                    width: `${reviews.length > 0 ? (item.count / reviews.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="count">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {showReviewForm && (
        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="form-group">
            <label>{t('reviews.rating', 'Rating')}</label>
            <select
              value={reviewForm.rating}
              onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value, 10) })}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} {t('reviews.stars', 'Stars')}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{t('reviews.titleLabel', 'Title')}</label>
            <input
              type="text"
              value={reviewForm.title}
              onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
              placeholder={t('reviews.titlePlaceholder', 'Brief title for your review')}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('reviews.contentLabel', 'Your Review')}</label>
            <textarea
              value={reviewForm.content}
              onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
              placeholder={t('reviews.contentPlaceholder', 'Share your experience with this product')}
              rows={4}
              required
            />
          </div>

          <button type="submit" className="button button-primary" disabled={submitting}>
            {submitting ? t('common.submitting', 'Submitting...') : t('reviews.submit', 'Submit Review')}
          </button>
          {successMsg && <p className="success-msg">{successMsg}</p>}
        </form>
      )}

      <div className="reviews-list">
        {reviews && reviews.length > 0 ? (
          reviews.map((review, idx) => (
            <div key={idx} className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  <strong>{review.reviewer_name || t('reviews.anonymous', 'Anonymous')}</strong>
                  <span className="review-date">{review.created_at ? new Date(review.created_at).toLocaleDateString() : t('reviews.recently', 'Recently')}</span>
                </div>
                <div className="review-rating">
                  {'★'.repeat(review.rating)}
                  {'☆'.repeat(5 - review.rating)}
                </div>
              </div>
              <h4>{review.title}</h4>
              <p>{review.content}</p>
              {review.verified_purchase && <span className="verified-badge">✓ {t('reviews.verifiedPurchase', 'Verified Purchase')}</span>}
            </div>
          ))
        ) : (
          <p className="no-reviews">{t('reviews.empty', 'No reviews yet. Be the first to review this product!')}</p>
        )}
      </div>
    </div>
  )
}
