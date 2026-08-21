import React, { useEffect, useState } from 'react'
import { useTranslation } from '../i18n'
import { useNavigate, Link } from 'react-router-dom'
import { getInquiryBasket, addInquiryBasketItem, removeInquiryBasketItem, sendInquiryBasket } from '../api'
import '../styles/pages/inquiry-basket.css'

export default function InquiryBasketPage({ auth }) {
  const navigate = useNavigate()
  const [basket, setBasket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!auth?.access) {
      navigate('/login')
      return
    }
    loadBasket()
  }, [auth, navigate])

  const loadBasket = async () => {
    setLoading(true)
    try {
      const data = await getInquiryBasket(auth.access)
      setBasket(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setAdding(true)
    try {
      await addInquiryBasketItem(auth.access, { product_id: productId, quantity })
      setProductId('')
      setQuantity(1)
      await loadBasket()
    } catch (err) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (itemId) => {
    try {
      await removeInquiryBasketItem(auth.access, { item_id: itemId })
      await loadBasket()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSend = async () => {
    try {
      await sendInquiryBasket(auth.access)
      await loadBasket()
      alert('Inquiry basket sent to suppliers.')
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <div className="loading">Loading inquiry basket...</div>

  const { t } = useTranslation()

  return (
    <div className="inquiry-basket-page">
      <header className="page-header">
        <div>
          <h1>{t('inquiry.title','Inquiry Basket')}</h1>
          <p>{t('inquiry.subtitle','Collect products you want to inquire about and send a single inquiry to multiple suppliers.')}</p>
        </div>
        <div className="page-actions">
          <Link to="/shop" className="button button-secondary">{t('inquiry.browse','Browse products')}</Link>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      <section className="basket-actions">
        <form onSubmit={handleAdd} className="add-form">
          <input type="text" placeholder={t('inquiry.addPlaceholder','Product ID to add')} value={productId} onChange={(e) => setProductId(e.target.value)} required />
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10)||1)} />
          <button className="button button-primary" disabled={adding}>{adding ? t('common.adding','Adding...') : t('inquiry.add','Add')}</button>
        </form>

        <div className="send-actions">
          <button className="button button-primary" onClick={handleSend} disabled={!basket || (basket.items && basket.items.length===0)}>{t('inquiry.send','Send inquiry to suppliers')}</button>
        </div>
      </section>

      <section className="basket-list">
        {basket && basket.items && basket.items.length>0 ? (
          <div className="items">
            {basket.items.map(item => (
              <div key={item.id} className="basket-item">
                <div className="left">
                  <div className="product-name">{item.product?.name || ('Product #' + (item.product_id || item.product))}</div>
                  <div className="meta">Qty: {item.quantity}</div>
                </div>
                <div className="actions">
                  <button className="button button-secondary" onClick={() => handleRemove(item.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>Your inquiry basket is empty</h3>
            <p>Add products from the product page or paste a product id above.</p>
          </div>
        )}
      </section>
    </div>
  )
}
