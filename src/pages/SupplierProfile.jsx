import React, { useEffect, useState } from 'react'
import { useTranslation } from '../i18n'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getSupplier, getSupplierProducts, sendInquiry } from '../api'
import { formatCurrency, useCurrency } from '../currency'
import { shouldShowShippedTag } from '../countryConfig'
import RotatingProductImage from '../components/RotatingProductImage'
import '../styles/pages/supplier.css'

export default function SupplierProfile({ auth }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [supplier, setSupplier] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [inquiryForm, setInquiryForm] = useState({ subject: '', message: '' })
  const [inquiryLoading, setInquiryLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const { currency, rate, country: selectedCountry } = useCurrency()
  const { t } = useTranslation()

  useEffect(() => {
    const loadSupplier = async () => {
      try {
        const supplierData = await getSupplier(id)
        setSupplier(supplierData)

        const productsData = await getSupplierProducts(id, { page_size: 12 })
        setProducts(productsData.results || productsData || [])
      } catch (err) {
        console.error('Failed to load supplier:', err)
      } finally {
        setLoading(false)
      }
    }
    loadSupplier()
  }, [id])

  const handleSendInquiry = async (event) => {
    event.preventDefault()
    if (!auth?.access) {
      navigate('/login')
      return
    }

    setInquiryLoading(true)
    try {
      await sendInquiry(auth.access, {
        supplier_id: id,
        subject: inquiryForm.subject,
        message: inquiryForm.message,
      })
      setSuccessMsg('Inquiry sent successfully!')
      setInquiryForm({ subject: '', message: '' })
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      console.error('Failed to send inquiry:', err)
    } finally {
      setInquiryLoading(false)
    }
  }

  if (loading) return <div className="loading">{t('common.loadingSupplier','Loading supplier profile...')}</div>
  if (!supplier) return <div className="error">{t('supplier.notFound','Supplier not found')}</div>

  return (
    <div className="supplier-profile">
      <section className="supplier-header">
        <div className="supplier-banner" style={{ backgroundColor: '#e8f1ff' }} />
        <div className="supplier-info">
          <div className="supplier-avatar">{supplier.company_name?.[0]?.toUpperCase() || 'S'}</div>
          <div className="supplier-details">
            <h1>{supplier.company_name}</h1>
            <div className="supplier-badges">
              {supplier.is_verified && <span className="badge badge-verified">{t('supplier.verified','✓ Verified Supplier')}</span>}
              {supplier.years_in_business && <span className="badge">{t('supplier.since','Since')} {supplier.years_in_business}</span>}
              {supplier.response_rate && <span className="badge">{supplier.response_rate}% {t('supplier.responseRate','Response Rate')}</span>}
            </div>
            <div className="supplier-highlights">
              <span className="trust-pill">{t('supplier.highlight.fastQuote','Fast quote response')}</span>
              <span className="trust-pill">{t('supplier.highlight.tradeAssurance','Trade assurance')}</span>
              <span className="trust-pill">{t('supplier.highlight.customProduction','Custom production ready')}</span>
            </div>
            <p className="supplier-description">{supplier.description}</p>
            <div className="supplier-stats">
              <div>
                <strong>{supplier.total_products || 0}</strong>
                <span>{t('supplier.stats.products','Products')}</span>
              </div>
              <div>
                <strong>{supplier.total_buyers || 0}</strong>
                <span>{t('supplier.stats.buyers','Buyers')}</span>
              </div>
              <div>
                <strong>{supplier.avg_rating || 'N/A'}</strong>
                <span>{t('supplier.stats.rating','Rating')}</span>
              </div>
            </div>
          </div>
            <div className="supplier-actions">
            <button
              className="button button-primary"
              onClick={() => document.getElementById('inquiry-form').scrollIntoView({ behavior: 'smooth' })}
            >
              {t('supplier.actions.sendInquiry','Send Inquiry')}
            </button>
            <button className="button button-secondary">
              ♡ {t('supplier.actions.addToAlerts','Add to Trade Alerts')}
            </button>
          </div>
        </div>
      </section>

      <section className="supplier-details-section">
        <div className="details-grid">
          <div className="detail-card">
            <h3>Business Type</h3>
            <p>{supplier.business_type || 'Manufacturer & Exporter'}</p>
          </div>
          <div className="detail-card">
            <h3>{t('supplier.location','Location')}</h3>
            <p>{supplier.city}, {supplier.country}</p>
          </div>
          <div className="detail-card">
            <h3>{t('supplier.productCategories','Product Categories')}</h3>
            <p>{supplier.categories || t('supplier.productCategoriesFallback','Apparel, Accessories')}</p>
          </div>
          <div className="detail-card">
            <h3>{t('supplier.languages','Languages')}</h3>
            <p>{supplier.languages || t('supplier.languagesFallback','English, Chinese')}</p>
          </div>
        </div>
      </section>

      <section className="supplier-products">
        <h2>{t('supplier.productsTitle', 'Products from this supplier')}</h2>
        {products.length > 0 ? (
          <div className="product-grid">
            {products.map((product) => (
              <Link key={product.id} to={`/product/${product.slug || product.id}`} className="product-card">
                <RotatingProductImage imageUrl={product.image_url} additionalImages={product.additional_images} alt={localize(product.name)} className="product-image" />
                <div className="product-details">
                  <h3>{localize(product.name)}</h3>
                  {shouldShowShippedTag(product, selectedCountry) && <span className="product-badge shipped-badge">{t('product.shippingTag', 'Shipped')}</span>}
                  <p className="price">{formatCurrency(product.price, currency, rate)}</p>
                  {product.moq && <p className="moq">{t('supplier.moqLabel','MOQ:')} {product.moq}</p>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p>{t('supplier.noProducts', 'No products available at the moment.')}</p>
        )}
      </section>

      <section className="inquiry-section" id="inquiry-form">
        <div className="inquiry-card">
          <h2>{t('supplier.inquiryTitle', 'Send Inquiry to {{name}}', { name: supplier.company_name })}</h2>
          {successMsg && <div className="success-msg">{successMsg}</div>}
          <form onSubmit={handleSendInquiry}>
            <div className="form-group">
              <label>{t('supplier.subject', 'Subject')}</label>
              <input
                type="text"
                value={inquiryForm.subject}
                onChange={(e) => setInquiryForm({ ...inquiryForm, subject: e.target.value })}
                placeholder={t('supplier.subjectPlaceholder', 'What would you like to know?')}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('supplier.message', 'Message')}</label>
              <textarea
                value={inquiryForm.message}
                onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                placeholder={t('supplier.messagePlaceholder', 'Details about your inquiry...')}
                rows={5}
                required
              />
            </div>
            <button
              type="submit"
              className="button button-primary"
              disabled={inquiryLoading}
            >
              {inquiryLoading ? t('supplier.sending', 'Sending...') : t('supplier.actions.sendInquiry', 'Send Inquiry')}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
