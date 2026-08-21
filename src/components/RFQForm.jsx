import React, { useState } from 'react'
import { useTranslation } from '../i18n'
import { submitRFQ } from '../api'
import '../styles/components/rfq.css'

export default function RFQForm({ productId, productName, auth, onSuccess }) {
  const { t } = useTranslation()
  const [showRFQ, setShowRFQ] = useState(false)
  const [rfqForm, setRfqForm] = useState({
    quantity: 1,
    unit: 'pcs',
    target_price: '',
    delivery_timeline: '30-60 days',
    special_requirements: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmitRFQ = async (event) => {
    event.preventDefault()
    if (!auth?.access) {
      alert(t('rfq.loginRequired', 'Please log in to request a quotation'))
      return
    }

    setSubmitting(true)
    try {
      await submitRFQ(auth.access, {
        product_id: productId,
        quantity: rfqForm.quantity,
        unit: rfqForm.unit,
        target_price: rfqForm.target_price,
        delivery_timeline: rfqForm.delivery_timeline,
        special_requirements: rfqForm.special_requirements,
      })
      setSuccessMsg(t('rfq.success', 'Quotation request submitted! Suppliers will respond within 24 hours.'))
      setRfqForm({
        quantity: 1,
        unit: 'pcs',
        target_price: '',
        delivery_timeline: '30-60 days',
        special_requirements: '',
      })
      setShowRFQ(false)
      setTimeout(() => setSuccessMsg(''), 5000)
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Failed to submit RFQ:', err)
      alert(t('rfq.error', 'Failed to submit quotation request'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rfq-container">
      <button
        type="button"
        className="button button-outline"
        onClick={() => setShowRFQ(!showRFQ)}
      >
        📋 {t('rfq.requestQuotation', 'Request Quotation')}
      </button>

      {showRFQ && (
        <div className="rfq-form-overlay">
          <div className="rfq-form-modal">
            <div className="rfq-form-header">
              <h3>{t('rfq.title', 'Request for Quotation')}</h3>
              <button type="button" className="close-btn" onClick={() => setShowRFQ(false)}>×</button>
            </div>

            {successMsg && <div className="success-msg">{successMsg}</div>}

            <form onSubmit={handleSubmitRFQ}>
              <p className="rfq-product-name">{t('rfq.productLabel', 'Product:')} <strong>{productName}</strong></p>

              <div className="rfq-form-grid">
                <div className="form-group">
                  <label>{t('rfq.quantity', 'Quantity')}</label>
                  <input
                    type="number"
                    min="1"
                    value={rfqForm.quantity}
                    onChange={(e) => setRfqForm({ ...rfqForm, quantity: parseInt(e.target.value, 10) || 1 })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t('rfq.unit', 'Unit')}</label>
                  <select
                    value={rfqForm.unit}
                    onChange={(e) => setRfqForm({ ...rfqForm, unit: e.target.value })}
                  >
                    <option value="pcs">{t('rfq.unit.pcs', 'Pieces')}</option>
                    <option value="boxes">{t('rfq.unit.boxes', 'Boxes')}</option>
                    <option value="kg">{t('rfq.unit.kg', 'Kilograms')}</option>
                    <option value="meters">{t('rfq.unit.meters', 'Meters')}</option>
                    <option value="sets">{t('rfq.unit.sets', 'Sets')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t('rfq.targetPrice', 'Target Price (per unit)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={rfqForm.target_price}
                    onChange={(e) => setRfqForm({ ...rfqForm, target_price: e.target.value })}
                    placeholder={t('rfq.optionalPlaceholder', 'Optional')}
                  />
                </div>

                <div className="form-group">
                  <label>{t('rfq.deliveryTimeline', 'Delivery Timeline')}</label>
                  <select
                    value={rfqForm.delivery_timeline}
                    onChange={(e) => setRfqForm({ ...rfqForm, delivery_timeline: e.target.value })}
                  >
                    <option value="7-15 days">{t('rfq.timeline.7-15', '7-15 days')}</option>
                    <option value="15-30 days">{t('rfq.timeline.15-30', '15-30 days')}</option>
                    <option value="30-60 days">{t('rfq.timeline.30-60', '30-60 days')}</option>
                    <option value="60-90 days">{t('rfq.timeline.60-90', '60-90 days')}</option>
                    <option value="90+ days">{t('rfq.timeline.90plus', '90+ days')}</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>{t('rfq.specialRequirements', 'Special Requirements')}</label>
                <textarea
                  value={rfqForm.special_requirements}
                  onChange={(e) => setRfqForm({ ...rfqForm, special_requirements: e.target.value })}
                  placeholder={t('rfq.specialPlaceholder', 'Custom colors, packaging, certifications, etc.')}
                  rows={3}
                />
              </div>

              <div className="rfq-info">
                <p>💡 <strong>{t('rfq.proTipTitle', 'Pro Tip:')}</strong> {t('rfq.proTipBody', 'Larger quantities often qualify for volume discounts. Suppliers will contact you within 24 hours with quotes.')}</p>
              </div>

              <div className="rfq-actions">
                <button type="button" className="button button-secondary" onClick={() => setShowRFQ(false)}>
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" className="button button-primary" disabled={submitting}>
                  {submitting ? t('rfq.submitting', 'Submitting...') : t('rfq.sendRequest', 'Send Quotation Request')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
