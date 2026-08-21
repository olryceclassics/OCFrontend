import React, { useEffect, useState } from 'react'
import { useTranslation } from '../i18n'
import { Link, useNavigate } from 'react-router-dom'
import { getWishlist, removeFromWishlist } from '../api'
import { formatCurrency, useCurrency } from '../currency'
import '../styles/pages/wishlist.css'

export default function WishlistPage({ auth }) {
  const navigate = useNavigate()
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const { currency, rate } = useCurrency()

  useEffect(() => {
    if (!auth?.access) {
      navigate('/login')
      return
    }

    const loadWishlist = async () => {
      try {
        const data = await getWishlist(auth.access)
        setWishlist(data.results || data || [])
      } catch (err) {
        console.error('Failed to load wishlist:', err)
      } finally {
        setLoading(false)
      }
    }
    loadWishlist()
  }, [auth, navigate])

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId, auth.access)
      setWishlist((prev) => prev.filter((item) => item.id !== productId))
    } catch (err) {
      console.error('Failed to remove from wishlist:', err)
    }
  }

  const { t } = useTranslation()

  if (loading) return <div className="loading">{t('wishlist.loading','Loading wishlist...')}</div>

  return (
    <div className="wishlist-page">
      <header className="wishlist-header">
        <h1>{t('wishlist.title','My Saved Products')}</h1>
        <p>{t('wishlist.subtitle',"Products you've bookmarked for later")}</p>
      </header>

      {wishlist.length > 0 ? (
        <div className="wishlist-grid">
          {wishlist.map((item) => (
            <div key={item.id} className="wishlist-item">
              <Link to={`/product/${item.slug || item.id}`} className="wishlist-card">
                <div className="product-image" style={{ backgroundImage: `url(${item.image_url})` }} />
                <div className="product-info">
                  <h3>{t(String(item.name), String(item.name))}</h3>
                  {item.supplier_name && <p className="supplier">{item.supplier_name}</p>}
                  <p className="price">{formatCurrency(item.price, currency, rate)}</p>
                  {item.in_stock ? (
                    <span className="in-stock">{t('wishlist.inStock','In Stock')}</span>
                  ) : (
                    <span className="out-of-stock">{t('wishlist.outOfStock','Out of Stock')}</span>
                  )}
                </div>
              </Link>
              <button
                className="remove-btn"
                onClick={() => handleRemove(item.id)}
                title={t('wishlist.removeTitle','Remove from wishlist')}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-wishlist">
          <div className="empty-icon">♡</div>
          <h2>{t('wishlist.emptyTitle','Your wishlist is empty')}</h2>
          <p>{t('wishlist.emptyBody','Start saving products to your wishlist for quick access later.')}</p>
          <Link to="/shop" className="button button-primary">
            {t('wishlist.continue','Continue Shopping')}
          </Link>
        </div>
      )}
    </div>
  )
}
