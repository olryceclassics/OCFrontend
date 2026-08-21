import React, { useEffect, useState } from 'react'
import { useTranslation } from '../i18n'
import { Link, useNavigate } from 'react-router-dom'
import { formatCurrency, useCurrency } from '../currency'
import '../styles/pages/cart.css'

export default function CartPage({ cartItems = [], onQuantityChange, onRemove, subtotal, tax, shipping, total }) {
  const navigate = useNavigate()
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const { currency, rate } = useCurrency()

  const applyCoupon = () => {
    // Placeholder for coupon logic
    if (couponCode === 'SAVE10') {
      setDiscount(subtotal * 0.1)
    } else {
      alert('Invalid coupon code')
    }
  }

  const { t } = useTranslation()
  const localize = (value, fallback = value) => {
    if (value == null || value === '') return fallback ?? ''
    return t(String(value), String(fallback ?? value))
  }

  return (
    <div className="cart-page">
      <h1>{t('cart.title', 'Shopping cart')}</h1>

      {cartItems.length > 0 ? (
        <div className="cart-container">
          <div className="cart-items">
            <table className="cart-table">
              <thead>
                <tr>
                  <th>{t('cart.product', 'Product')}</th>
                  <th>{t('cart.price', 'Price')}</th>
                  <th>{t('cart.quantity', 'Quantity')}</th>
                  <th>{t('cart.total', 'Total')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map(item => (
                  <tr key={item.id}>
                    <td className="product-cell">
                      <img src={item.image} alt={localize(item.name)} className="thumb" />
                      <div>
                        <p className="product-name">{localize(item.name)}</p>
                        <p className="sku">SKU: {item.sku}</p>
                      </div>
                    </td>
                    <td>{formatCurrency(item.price, currency, rate)}</td>
                    <td>
                      <div className="quantity-control">
                        <button onClick={() => onQuantityChange(item.id, item.quantity - 1)}>−</button>
                        <input type="number" value={item.quantity} readOnly />
                        <button onClick={() => onQuantityChange(item.id, item.quantity + 1)}>+</button>
                      </div>
                    </td>
                    <td className="total-cell">{formatCurrency(item.price * item.quantity, currency, rate)}</td>
                    <td>
                      <button className="remove-btn" onClick={() => onRemove(item.id)}>{t('cart.remove', 'Remove')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="coupon-section">
              <input 
                type="text" 
                placeholder={t('cart.couponPlaceholder', 'Enter coupon code')} 
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <button className="button button-secondary" onClick={applyCoupon}>{t('cart.applyCoupon', 'Apply coupon')}</button>
            </div>
          </div>

          <div className="cart-summary">
            <h3>{t('cart.orderSummary', 'Order summary')}</h3>
            
            <div className="summary-row">
              <span>{t('cart.subtotal', 'Subtotal')}</span>
              <span>{formatCurrency(subtotal, currency, rate)}</span>
            </div>

            {discount > 0 && (
              <div className="summary-row discount">
                <span>{t('cart.discount', 'Discount')}</span>
                <span>{formatCurrency(-discount, currency, rate)}</span>
              </div>
            )}

            <div className="summary-row">
              <span>{t('cart.shipping', 'Shipping')}</span>
              <span>{formatCurrency(shipping, currency, rate)}</span>
            </div>

            <div className="summary-row">
              <span>{t('cart.tax', 'Tax (7%)')}</span>
              <span>{formatCurrency(tax, currency, rate)}</span>
            </div>

            <div className="summary-row total">
              <span>{t('cart.total', 'Total')}</span>
              <span>{formatCurrency(total - discount, currency, rate)}</span>
            </div>

            <button className="button button-primary" onClick={() => navigate('/checkout')}>
              {t('cart.proceed', 'Proceed to checkout')}
            </button>

            <Link to="/shop" className="continue-shopping">{t('cart.continueShopping', 'Continue shopping')}</Link>
          </div>
        </div>
      ) : (
        <div className="empty-cart">
          <h2>{t('cart.empty', 'Your cart is empty')}</h2>
          <p>{t('cart.startShopping', 'Start shopping to add items to your cart')}</p>
          <Link to="/shop" className="button button-primary">{t('cart.continueShopping', 'Continue shopping')}</Link>
        </div>
      )}
    </div>
  )
}
