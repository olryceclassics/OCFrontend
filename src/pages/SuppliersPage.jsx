import React, { useEffect, useState } from 'react'
import { useTranslation } from '../i18n'
import { Link } from 'react-router-dom'
import { getSuppliers } from '../api'
import '../styles/pages/suppliers.css'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { t } = useTranslation()
  const localize = (value, fallback) => t(String(value), String(fallback ?? value))
  const [error, setError] = useState(null)

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async (query = '') => {
    setLoading(true)
    setError(null)
    try {
      const params = { page_size: 40 }
      if (query) params.search = query
      const data = await getSuppliers(params)
      setSuppliers(data.results || data || [])
    } catch (err) {
      console.error('Failed to load suppliers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = async (event) => {
    event.preventDefault()
    await loadSuppliers(search.trim())
  }

  const verifiedCount = suppliers.filter((supplier) => supplier.is_verified).length
  const totalProducts = suppliers.reduce((sum, supplier) => sum + (supplier.total_products || 0), 0)
  const averageResponse = suppliers.length
    ? Math.round(suppliers.reduce((sum, supplier) => sum + (supplier.response_rate || 0), 0) / suppliers.length)
    : 0
  const topSuppliers = suppliers.filter((supplier) => supplier.is_verified).slice(0, 3)

  return (
    <div className="suppliers-page">
      <header className="page-header">
        <div>
          <h1>{t('suppliers.title','Supplier directory')}</h1>
          <p>{t('suppliers.subtitle','Browse verified suppliers and connect instantly with marketplace partners.')}</p>
        </div>
        <form className="supplier-search" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            placeholder={t('suppliers.searchPlaceholder','Search suppliers by name or location')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="button button-primary" type="submit">{t('suppliers.searchButton','Search')}</button>
        </form>
      </header>

      {error && <div className="error-message">{error}</div>}

      <section className="supplier-metrics">
        <div>
          <strong>{suppliers.length}</strong>
          <span>{t('suppliers.metrics.listed','Suppliers listed')}</span>
        </div>
        <div>
          <strong>{verifiedCount}</strong>
          <span>{t('suppliers.metrics.verified','Verified suppliers')}</span>
        </div>
        <div>
          <strong>{totalProducts}</strong>
          <span>{t('suppliers.metrics.products','Products available')}</span>
        </div>
        <div>
          <strong>{averageResponse}%</strong>
          <span>{t('suppliers.metrics.avgResponse','Avg response rate')}</span>
        </div>
      </section>

      {loading ? (
        <div className="loading">{t('suppliers.loading','Loading suppliers…')}</div>
      ) : suppliers.length > 0 ? (
        <>
          {topSuppliers.length > 0 && (
            <section className="supplier-spotlight">
              <h2>{t('suppliers.topVerified','Top verified suppliers')}</h2>
              <div className="supplier-list supplier-list-highlight">
                {topSuppliers.map((supplier) => (
                  <article key={supplier.id} className="supplier-card supplier-card-highlight">
                    <div className="supplier-card-main">
                      <div className="supplier-avatar">{localize(supplier.company_name)?.[0]?.toUpperCase() || 'S'}</div>
                      <div>
                        <h2>
                          <Link to={`/supplier/${supplier.id}`}>{localize(supplier.company_name)}</Link>
                        </h2>
                        <p className="supplier-meta">
                          {supplier.city || t('suppliers.unknownCity','Unknown city')}, {supplier.country || t('suppliers.unknownCountry','Unknown country')}
                        </p>
                      </div>
                    </div>
                    <div className="supplier-badges">
                      {supplier.is_verified && <span className="badge verified">{t('suppliers.badges.verified','Verified')}</span>}
                      {supplier.response_rate != null && <span className="badge">{supplier.response_rate}% {t('suppliers.badges.response','response')}</span>}
                      {supplier.total_products != null && <span className="badge">{supplier.total_products} {t('suppliers.badges.products','products')}</span>}
                    </div>
                    <div className="supplier-actions">
                      <Link className="button button-primary" to={`/supplier/${supplier.id}`}>{t('suppliers.viewSupplier','View supplier')}</Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <div className="supplier-list">
            {suppliers.map((supplier) => (
              <article key={supplier.id} className="supplier-card">
                <div className="supplier-card-main">
                  <div className="supplier-avatar">{localize(supplier.company_name)?.[0]?.toUpperCase() || 'S'}</div>
                  <div>
                    <h2>
                      <Link to={`/supplier/${supplier.id}`}>{localize(supplier.company_name)}</Link>
                    </h2>
                    <p className="supplier-meta">
                      {supplier.city || t('suppliers.unknownCity','Unknown city')}, {supplier.country || t('suppliers.unknownCountry','Unknown country')}
                    </p>
                    <p className="supplier-description">{supplier.description || t('suppliers.descriptionFallback','Trusted supplier with fast response and flexible MOQ.')}</p>
                  </div>
                </div>

                <div className="supplier-badges">
                  {supplier.is_verified && <span className="badge verified">{t('suppliers.badges.verified','Verified')}</span>}
                  {supplier.response_rate != null && <span className="badge">{supplier.response_rate}% {t('suppliers.badges.response','response')}</span>}
                  {supplier.total_products != null && <span className="badge">{supplier.total_products} {t('suppliers.badges.products','products')}</span>}
                </div>

                <div className="supplier-actions">
                  <Link className="button button-secondary" to={`/supplier/${supplier.id}`}>{t('suppliers.viewSupplier','View supplier')}</Link>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <h2>{t('suppliers.emptyTitle','No suppliers found')}</h2>
          <p>{t('suppliers.emptyBody','Try a different search phrase or browse product categories to find the right seller.')}</p>
        </div>
      )}
    </div>
  )
}
