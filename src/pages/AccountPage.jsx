import React, { useState, useEffect } from 'react'
import { useTranslation } from '../i18n'
import { getMyOrders, getOrderDetail } from '../api'
import { formatCurrency, useCurrency } from '../currency'
import '../styles/pages/account.css'

export default function AccountPage({ auth }) {
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const { currency, rate } = useCurrency()
  const { t } = useTranslation()

  useEffect(() => {
    const loadOrders = async () => {
      try {
        if (auth?.access) {
          const data = await getMyOrders(auth.access)
          setOrders(data)
        }
      } catch (err) {
        console.error('Failed to load orders:', err)
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [auth])

  const handleSelectOrder = async (order) => {
    try {
      const detail = await getOrderDetail(order.id, auth.access)
      setSelectedOrder(detail)
    } catch (err) {
      console.error('Failed to load order detail:', err)
    }
  }

  return (
    <div className="account-page">
      <h1>{t('account.title', 'My account')}</h1>

      <div className="account-section">
        <h2>{t('account.profile', 'Profile')}</h2>
        <div className="profile-info">
          <p>
            <strong>{auth?.user?.first_name || ''} {auth?.user?.last_name || ''}</strong>
            <br />
            {auth?.user?.email}
          </p>
        </div>
      </div>

      <div className="account-section">
        <h2>{t('account.paymentMethods', 'Payment methods')}</h2>
        <div className="payment-method-list">
          <span className="payment-pill">{t('account.card', 'Card')}</span>
          <span className="payment-pill">{t('account.mpesa', 'M-Pesa')}</span>
          <span className="payment-pill">{t('account.bankTransfer', 'Bank transfer')}</span>
          <span className="payment-pill active">{t('account.wallet', 'Wallet')}</span>
        </div>
      </div>

      <div className="account-section">
        <h2>{t('account.orderHistory', 'Order history')}</h2>
        {loading ? (
          <div className="loading">{t('account.loading', 'Loading orders...')}</div>
        ) : orders.length > 0 ? (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-item" onClick={() => handleSelectOrder(order)}>
                <div className="order-info">
                  <p className="order-number">{t('account.orderNumber', 'Order')} #{order.id}</p>
                  <p className="order-date">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="order-status">
                  <p className={`status ${order.status}`}>{order.status}</p>
                </div>
                <div className="order-total">
                  <p>{formatCurrency(order.total, currency, rate)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>{t('account.empty', "You haven't placed any orders yet.")}</p>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="order-detail-modal">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setSelectedOrder(null)}>×</button>
            <h3>{t('account.orderNumber', 'Order')} #{selectedOrder.id}</h3>
            <p>{t('account.status', 'Status')}: {selectedOrder.status}</p>
            <p>{t('account.total', 'Total')}: {formatCurrency(selectedOrder.total, currency, rate)}</p>
            {selectedOrder.tracking_number && (
              <p>{t('account.tracking', 'Tracking')}: {selectedOrder.tracking_number}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
