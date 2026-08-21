import React, { useState, useEffect } from 'react'
import { useTranslation } from '../i18n'
import { Link, useNavigate } from 'react-router-dom'
import { getWallet } from '../api'
import { formatCurrency, useCurrency } from '../currency'
import '../styles/pages/checkout.css'

const paymentOptions = [
  {
    value: 'card',
    label: 'Credit / Debit Card',
    detail: 'Visa, Mastercard, and other cards',
  },
  {
    value: 'mpesa',
    label: 'M-Pesa',
    detail: 'Fast mobile payment for Kenyan buyers',
  },
  {
    value: 'bank',
    label: 'Bank Transfer',
    detail: 'Direct bank deposit or transfer',
  },
  {
    value: 'wallet',
    label: 'Olryce Wallet',
    detail: 'Pay using your wallet balance',
  },
]

export default function CheckoutPage({ auth, cartItems, subtotal, tax, shipping, total, onSubmit }) {
  const navigate = useNavigate()
  const { currency, rate } = useCurrency()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: auth?.user?.email || '',
    phone: auth?.user?.phone || '',
    address: '',
    city: '',
    postalCode: '',
    paymentMethod: 'card',
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [wallet, setWallet] = useState(null)
  const [bankPaymentInfo, setBankPaymentInfo] = useState(null)

  useEffect(() => {
    if (!auth?.access) {
      navigate('/login')
      return
    }

    const loadWallet = async () => {
      try {
        const data = await getWallet(auth.access)
        setWallet(data)
      } catch (err) {
        console.error('Failed to load wallet:', err)
      }
    }

    loadWallet()
  }, [auth, navigate])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!cartItems.length) {
      setError(t('checkout.cartEmpty', 'Your cart is empty'))
      setLoading(false)
      return
    }

    try {
      const result = await onSubmit(form)
      if (result?.bank_payment) {
        setBankPaymentInfo({
          ...result.bank_payment,
          order_number: result.order?.order_number,
          total_amount: result.order?.total_amount,
        })
      } else if (result) {
        navigate('/account')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!auth?.access) {
    return (
      <div className="checkout-page">
        <div className="login-prompt">
          <h2>{t('checkout.signInPromptTitle', 'Sign in to checkout')}</h2>
          <p>{t('checkout.signInPromptBody', 'You need an account to place orders')}</p>
          <Link to="/login" className="button button-primary">{t('checkout.signInOrRegister', 'Sign in or register')}</Link>
        </div>
      </div>
    )
  }

  const { t } = useTranslation()
  const localize = (value, fallback = value) => {
    if (value == null || value === '') return fallback ?? ''
    return t(String(value), String(fallback ?? value))
  }

  return (
    <div className="checkout-page">
      <h1>{t('checkout.title', 'Checkout')}</h1>

      <div className="checkout-container">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2>{t('checkout.shippingInfo', 'Shipping information')}</h2>

          <div className="form-row">
            <div className="form-group">
              <label>{t('checkout.firstName', 'First name')}</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('checkout.lastName', 'Last name')}</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t('checkout.email', 'Email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('checkout.phone', 'Phone')}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('checkout.address', 'Address')}</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('checkout.city', 'City')}</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('checkout.postalCode', 'Postal code')}</label>
              <input
                type="text"
                value={form.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                required
              />
            </div>
          </div>

          <h2>{t('checkout.paymentMethod', 'Payment method')}</h2>
          <div className="payment-method-options">
            {paymentOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`payment-option ${form.paymentMethod === option.value ? 'selected' : ''}`}
                onClick={() => handleChange('paymentMethod', option.value)}
              >
                <span>{option.label}</span>
                <small>{option.detail}</small>
              </button>
            ))}
          </div>

          {form.paymentMethod === 'wallet' && wallet && (
            <div className="payment-info">
              {t('checkout.walletBalance', 'Wallet balance')}: <strong>{formatCurrency(wallet.available_balance || wallet.balance || 0, currency, rate)}</strong>
            </div>
          )}

          {form.paymentMethod === 'mpesa' && (
            <div className="payment-info">
              {t('checkout.mpesaPrompt', 'You will receive a payment prompt on')} <strong>{form.phone || t('checkout.yourNumber', 'your number')}</strong>.
            </div>
          )}

          {form.paymentMethod === 'bank' && (
            <div className="payment-info">
              {t('checkout.bankDetails', 'Bank details will be shared after checkout for the transfer.')}
            </div>
          )}

          {bankPaymentInfo && (
            <div className="bank-payment-instructions">
              <h3>{t('checkout.bankPaymentInstructions', 'Bank payment instructions')}</h3>
              <p>{t('checkout.bankPaymentMessage', 'Your order is created. Please complete the bank transfer using your bank and wait for payment confirmation.')}</p>
              <p><strong>{t('checkout.orderNumber', 'Order number')}:</strong> {bankPaymentInfo.order_number}</p>
              <p><strong>{t('checkout.amountDue', 'Amount due')}:</strong> {formatCurrency(bankPaymentInfo.total_amount, currency, rate)}</p>
              <p><strong>{t('checkout.transactionId', 'Transaction ID')}:</strong> {bankPaymentInfo.transaction_id || t('checkout.notAvailable', 'Not available')}</p>
              <p>{t('checkout.bankCallbackNote', 'Once the bank confirms payment, we will update your order status automatically.')}</p>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="button button-primary" disabled={loading || !!bankPaymentInfo}>
            {loading ? t('checkout.processing', 'Processing...') : `${t('checkout.placeOrder', 'Place order')} - ${formatCurrency(total, currency, rate)}`}
          </button>
        </form>

        <aside className="checkout-summary">
          <h2>{t('checkout.orderSummary', 'Order summary')}</h2>

          <div className="summary-items">
            {cartItems.map(item => (
              <div key={item.id} className="summary-item">
                <div>
                  <p className="item-name">{localize(item.name)}</p>
                  <p className="item-qty">{t('checkout.quantityLabel', 'Qty: {{quantity}}', { quantity: item.quantity })}</p>
                </div>
                <p className="item-price">{formatCurrency(item.price * item.quantity, currency, rate)}</p>
              </div>
            ))}
          </div>

          <div className="summary-totals">
            <div className="total-row">
              <span>{t('cart.subtotal', 'Subtotal')}</span>
              <span>{formatCurrency(subtotal, currency, rate)}</span>
            </div>
            <div className="total-row">
              <span>{t('cart.shipping', 'Shipping')}</span>
              <span>{formatCurrency(shipping, currency, rate)}</span>
            </div>
            <div className="total-row">
              <span>{t('cart.tax', 'Tax (7%)')}</span>
              <span>{formatCurrency(tax, currency, rate)}</span>
            </div>
            <div className="total-row final">
              <span>{t('cart.total', 'Total')}</span>
              <span>{formatCurrency(total, currency, rate)}</span>
            </div>
          </div>

          <Link to="/cart" className="button button-secondary">{t('checkout.backToCart', 'Back to cart')}</Link>
        </aside>
      </div>
    </div>
  )
}
