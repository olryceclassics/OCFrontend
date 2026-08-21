import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getMyRFQs, getRFQDetail } from '../api'
import { useTranslation } from '../i18n'
import '../styles/pages/my-rfqs.css'

export default function MyRFQsPage({ auth }) {
  const navigate = useNavigate()
  const [rfqs, setRfqs] = useState([])
  const [selectedRfq, setSelectedRfq] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    if (!auth?.access) {
      navigate('/login')
      return
    }

    const loadRfqs = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getMyRFQs(auth.access)
        setRfqs(data.results || data || [])
        if (data.results && data.results.length > 0) {
          setSelectedRfq(data.results[0])
        }
      } catch (err) {
        console.error('Failed to load RFQ requests:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadRfqs()
  }, [auth, navigate])

  useEffect(() => {
    if (!selectedRfq || !auth?.access) return

    const loadDetails = async () => {
      setDetailLoading(true)
      try {
        const detail = await getRFQDetail(selectedRfq.id, auth.access)
        setSelectedRfq(detail)
      } catch (err) {
        console.error('Failed to load RFQ detail:', err)
      } finally {
        setDetailLoading(false)
      }
    }
    loadDetails()
  }, [selectedRfq?.id, auth])

  return (
    <div className="rfq-page">
      <header className="page-header">
        <div>
          <h1>{t('rfq.title','Request for quotations')}</h1>
          <p>{t('rfq.subtitle','Track your quotation requests and supplier responses in one place.')}</p>
        </div>
        <div className="page-actions">
          <Link to="/shop" className="button button-secondary">{t('rfq.browse','Browse products')}</Link>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">{t('rfq.loading','Loading your quotation requests…')}</div>
      ) : rfqs.length > 0 ? (
        <div className="rfq-grid">
          <aside className="rfq-sidebar">
            <h2>{t('rfq.yourRfqs','Your RFQs')}</h2>
            <div className="rfq-list">
              {rfqs.map((rfq) => (
                <button
                  key={rfq.id}
                  className={`rfq-item ${selectedRfq?.id === rfq.id ? 'active' : ''}`}
                  onClick={() => setSelectedRfq(rfq)}
                >
                  <strong>{rfq.product_name || `${t('rfq.product','Product')} #${rfq.product}`}</strong>
                  <span>{rfq.supplier_name || t('rfq.supplier','Supplier')}</span>
                  <small>{new Date(rfq.created_at).toLocaleDateString()}</small>
                  <span className={`status-pill ${rfq.status?.toLowerCase() || 'open'}`}>{rfq.status || t('rfq.pending','Pending')}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="rfq-detail-panel">
            {selectedRfq ? (
              <div className="rfq-detail-card">
                <div className="detail-header">
                  <div>
                    <h2>{selectedRfq.product_name || `${t('rfq.rfq','RFQ')} #${selectedRfq.id}`}</h2>
                    <p>{t('rfq.supplierLabel','Supplier')}: {selectedRfq.supplier_name || t('rfq.unknown','Unknown')}</p>
                  </div>
                  <span className={`status-pill ${selectedRfq.status?.toLowerCase() || 'open'}`}>{selectedRfq.status || t('rfq.pending','Pending')}</span>
                </div>

                {detailLoading ? (
                  <div className="loading">Loading details…</div>
                ) : (
                  <div className="rfq-details">
                    <div className="detail-row">
                        <strong>{t('rfq.quantity','Quantity')}</strong>
                        <span>{selectedRfq.quantity}</span>
                      </div>
                      <div className="detail-row">
                        <strong>{t('rfq.unit','Unit')}</strong>
                        <span>{selectedRfq.unit}</span>
                      </div>
                      <div className="detail-row">
                        <strong>{t('rfq.targetPrice','Target price')}</strong>
                        <span>{selectedRfq.target_price || t('rfq.na','N/A')}</span>
                      </div>
                      <div className="detail-row">
                        <strong>{t('rfq.timeline','Timeline')}</strong>
                        <span>{selectedRfq.delivery_timeline || t('rfq.flexible','Flexible')}</span>
                      </div>
                      <div className="detail-row">
                        <strong>{t('rfq.notes','Notes')}</strong>
                        <span>{selectedRfq.special_requirements || t('rfq.noSpecial','No special requirements')}</span>
                      </div>
                      <div className="detail-row">
                        <strong>{t('rfq.requested','Requested')}</strong>
                        <span>{new Date(selectedRfq.created_at).toLocaleString()}</span>
                      </div>
                  </div>
                )}

                <div className="detail-footer">
                  <Link className="button button-secondary" to={`/supplier/${selectedRfq.supplier}`}>{t('rfq.viewSupplier','View supplier')}</Link>
                  <Link className="button button-primary" to={`/product/${selectedRfq.product}`}>{t('rfq.viewProduct','View product')}</Link>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <h2>{t('rfq.selectRequest','Select a request to review details')}</h2>
                <p>{t('rfq.historyHelp','Your RFQ history will appear here once you submit a quotation request from a product page.')}</p>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="empty-state">
          <h2>{t('rfq.noRequests','No quotation requests yet')}</h2>
          <p>{t('rfq.noRequestsBody','Use the product detail page to request quotes from suppliers or browse products to start sourcing.')}</p>
          <Link to="/shop" className="button button-primary">{t('rfq.browse','Browse products')}</Link>
        </div>
      )}
    </div>
  )
}
