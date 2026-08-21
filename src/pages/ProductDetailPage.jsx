import React, { useEffect, useState } from 'react'
import { useTranslation } from '../i18n'
import { useParams, Link } from 'react-router-dom'
import { getProduct, getProducts, getProductReviews, addToWishlist, addInquiryBasketItem } from '../api'
import { formatCurrency, useCurrency } from '../currency'
import { shouldShowShippedTag } from '../countryConfig'
import RFQForm from '../components/RFQForm'
import ProductReviews from '../components/ProductReviews'
import '../styles/pages/product-detail.css'

export default function ProductDetailPage({ auth, onAddToCart, onAddToWishlist }) {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [related, setRelated] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [avgRating, setAvgRating] = useState(0)
  const [wishlistMessage, setWishlistMessage] = useState('')
  const [inquiryMessage, setInquiryMessage] = useState('')
  const [addingInquiry, setAddingInquiry] = useState(false)
  const { currency, rate, country: selectedCountry } = useCurrency()
  const { t } = useTranslation()
  const localize = (value, fallback = value) => {
    if (value == null || value === '') return fallback ?? ''
    return t(String(value), String(fallback ?? value))
  }

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await getProduct(slug)
        setProduct(data)
        
        if (data.category) {
          const relatedProducts = await getProducts({ category: data.category })
          setRelated((relatedProducts.results || relatedProducts).filter(p => p.id !== data.id).slice(0, 4))
        }

        // Load reviews
        try {
          const reviewsData = await getProductReviews(data.id)
          const reviewsList = reviewsData.results || reviewsData || []
          setReviews(reviewsList)
          if (reviewsList.length > 0) {
            const avg = reviewsList.reduce((sum, r) => sum + r.rating, 0) / reviewsList.length
            setAvgRating(avg)
          }
        } catch (err) {
          console.error('Failed to load reviews:', err)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [slug])

  if (loading) return <div className="loading">{t('common.loading', 'Loading...')}</div>
  if (error) return <div className="error">{error}</div>
  if (!product) return <div className="error">{t('product.notFound', 'Product not found')}</div>

  const handleAddToCart = () => {
    onAddToCart(product, quantity)
    setQuantity(1)
  }

  const handleAddToWishlist = async () => {
    if (!auth?.access) {
      setWishlistMessage(t('product.loginToSave', 'Please log in to save products'))
      setTimeout(() => setWishlistMessage(''), 3000)
      return
    }

    try {
      await addToWishlist(product.id, auth.access)
      setWishlistMessage(t('product.addedToWishlist', 'Added to wishlist!'))
      setTimeout(() => setWishlistMessage(''), 3000)
    } catch (err) {
      setWishlistMessage(t('product.failedWishlist', 'Failed to add to wishlist'))
      setTimeout(() => setWishlistMessage(''), 3000)
    }
  }

  const handleAddToInquiryBasket = async () => {
    if (!auth?.access) {
      setInquiryMessage(t('product.loginToInquiry', 'Please log in to add items to your inquiry basket'))
      setTimeout(() => setInquiryMessage(''), 3000)
      return
    }

    setAddingInquiry(true)
    try {
      await addInquiryBasketItem(auth.access, { product_id: product.id, quantity })
      setInquiryMessage(t('product.addedToInquiry', 'Added to inquiry basket'))
      setTimeout(() => setInquiryMessage(''), 3000)
    } catch (err) {
      setInquiryMessage(err.message || t('product.failedInquiry', 'Failed to add to inquiry basket'))
      setTimeout(() => setInquiryMessage(''), 3000)
    } finally {
      setAddingInquiry(false)
    }
  }

  const quickFacts = [
    { label: t('product.spec.category', 'Category'), value: product.category_name || t('product.general', 'General'), link: product.category ? `/shop?category=${encodeURIComponent(product.category)}` : null },
    { label: t('product.spec.moq', 'MOQ'), value: product.moq ? product.moq : t('product.flexible', 'Flexible') },
    { label: t('product.spec.stock', 'Stock'), value: product.stock > 0 ? `${product.stock} ${t('product.units', 'units')}` : t('product.outOfStock', 'Out of stock') },
    { label: t('product.spec.leadTime', 'Lead time'), value: product.lead_time || t('product.leadDefault', '5-15 days') },
  ]

  const productHighlights = [
    product.is_verified ? t('product.highlights.oemReady','OEM-ready quote') : t('product.highlights.buyerProtection','Buyer protection'),
    product.stock > 0 ? t('product.highlights.fastFulfillment','Fast fulfillment') : t('product.highlights.requestAvailability','Request availability'),
    product.is_low_stock ? t('product.highlights.lowStock','Low stock alert') : t('product.highlights.stableInventory','Stable inventory'),
  ]

  return (
    <div className="product-detail-page">
      <div className="product-detail">
        <div className="product-image-section">
          <img src={product.image_url} alt={localize(product.name)} className="main-image" />
          {product.supplier_name && (
            <Link to={`/supplier/${product.supplier_id || ''}`} className="supplier-link">
              <span>📦 {product.supplier_name}</span>
            </Link>
          )}
        </div>

        <div className="product-info-section">
          <div className="breadcrumb">
            <Link to="/">{t('nav.home','Home')}</Link> / <Link to="/shop">{t('nav.shop','Shop')}</Link> / {localize(product.name)}
          </div>

          <h1>{localize(product.name)}</h1>
          {product.category_name && (
            <p className="category"><Link to={`/shop?category=${product.category}`}>{localize(product.category_name)}</Link></p>
          )}

          <div className="rating">
            <span className="stars">{'★'.repeat(Math.floor(avgRating))}{'☆'.repeat(5 - Math.floor(avgRating))}</span>
            <span className="review-count">({reviews.length} {t('product.reviews','reviews')})</span>
          </div>

          {product.is_verified && <span className="verified-badge">{t('product.verifiedSeller','✓ Verified Seller')}</span>}

          <div className="product-highlights">
            {productHighlights.map((highlight) => (
              <span key={highlight} className="highlight-pill detail-highlight">{highlight}</span>
            ))}
          </div>

          <div className="product-spec-grid">
            {quickFacts.map((fact) => (
              <div key={fact.label} className="spec-card">
                <span className="spec-label">{fact.label}</span>
                {fact.link ? (
                  <Link to={fact.link} className="spec-value">{fact.value}</Link>
                ) : (
                  <span className="spec-value">{fact.value}</span>
                )}
              </div>
            ))}
          </div>

          <div className="price-section">
            <p className="price">{formatCurrency(product.price, currency, rate)}</p>
            {shouldShowShippedTag(product, selectedCountry) && <span className="product-badge shipped-badge">{t('product.shippingTag','Shipped')}</span>}
            {product.moq && <p className="moq">{t('product.minimumOrder','Minimum Order:')} {product.moq}</p>}
            {product.is_low_stock && <p className="low-stock">{t('product.lowStock','Low stock')}</p>}
            {!product.stock && <p className="out-of-stock">{t('product.outOfStock','Out of stock')}</p>}
          </div>

          <p className="description">{product.description}</p>

          <div className="purchase-section">
            <div className="quantity-control">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
              <input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} min="1" max={product.stock} />
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
            </div>

            <button 
              className="button button-primary" 
              onClick={handleAddToCart}
              disabled={!product.stock}
            >
              {product.stock ? t('product.addToCart','Add to cart') : t('product.outOfStock','Out of stock')}
            </button>

            <button 
              className="button button-secondary" 
              onClick={handleAddToInquiryBasket}
              disabled={addingInquiry || !product.stock}
            >
              {addingInquiry ? t('common.adding','Adding...') : t('product.addToInquiry','Add to inquiry basket')}
            </button>

            <button 
              className="button button-outline" 
              onClick={handleAddToWishlist}
            >
              ♡ {t('product.saveForLater','Save for later')}
            </button>

            {wishlistMessage && <p className="wishlist-msg">{wishlistMessage}</p>}
            {inquiryMessage && <p className="wishlist-msg">{inquiryMessage}</p>}
          </div>

          <RFQForm productId={product.id} productName={localize(product.name)} auth={auth} />

          <div className="shipping-info">
            <p>🚚 {t('product.shippingInfo.freeOver', 'Free shipping on orders over $50')}</p>
            <p>✓ {t('product.shippingInfo.returns', '30-day returns')}</p>
            <p>🔒 {t('product.shippingInfo.secureCheckout', 'Secure checkout')}</p>
            {product.supplier_name && <p>📧 {t('product.shippingInfo.contact','Contact')} <strong>{product.supplier_name}</strong> {t('product.shippingInfo.withQuestions','with questions')}</p>}
          </div>
        </div>
      </div>

      <div className="product-reviews-section">
        <ProductReviews productId={product.id} reviews={reviews} averageRating={avgRating} auth={auth} />
      </div>

      {related.length > 0 && (
        <section className="related-products">
          <h3>{t('product.relatedProducts','Related products')}</h3>
          <div className="product-grid">
            {related.map(p => (
              <Link key={p.id} to={`/product/${p.slug || p.id}`} className="product-card">
                <div className="product-image" style={{backgroundImage: `url(${p.image_url})`}} />
                <h4>{localize(p.name)}</h4>
                <p className="price">{formatCurrency(p.price, currency, rate)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

