import React, { useEffect, useState } from 'react'
import { useTranslation } from '../i18n'
import { Link } from 'react-router-dom'
import { createTradeAlert, getMyTradeAlerts, getCategories } from '../api'
import '../styles/pages/trade-alerts.css'

export default function TradeAlertsPage({ auth }) {
  const [alerts, setAlerts] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ keywords: '', category: '', min_price: '', max_price: '' })
  const { t } = useTranslation()
  const localize = (value, fallback) => t(String(value), String(fallback ?? value))
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!auth?.access) return
    load()
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth])

  const load = async () => {
    setLoading(true)
    try {
      const data = await getMyTradeAlerts(auth.access)
      setAlerts(data.results || data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const cats = await getCategories()
      setCategories(cats || [])
    } catch (err) {
      console.error('Failed to load categories', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createTradeAlert(auth.access, {
        keywords: form.keywords,
        category: form.category || null,
        min_price: form.min_price || null,
        max_price: form.max_price || null,
      })
      setForm({ keywords: '', category: '', min_price: '', max_price: '' })
      await load()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="trade-alerts-page">
      <header className="page-header">
        <div>
          <h1>{t('trade.title','Trade Alerts')}</h1>
          <p>{t('trade.subtitle','Create alerts to get notified when matching products are listed.')}</p>
        </div>
      </header>

      {!auth?.access ? (
        <section className="empty-state">
          <h3>{t('trade.signInNeeded','Sign in to manage trade alerts')}</h3>
          <p>{t('trade.signInNeededBody','Trade alerts require an account so we can deliver matching opportunities.')}</p>
          <Link to="/login" className="button button-primary">{t('trade.signIn','Sign in')}</Link>
        </section>
      ) : (
        <>
          <section className="create-alert">
            <form onSubmit={handleSubmit} className="alert-form">
              <input type="text" placeholder={t('trade.keywordsPlaceholder','Keywords (e.g. wireless charger)')} value={form.keywords} onChange={(e)=>setForm({...form, keywords: e.target.value})} />
              <select value={form.category} onChange={(e)=>setForm({...form, category: e.target.value})}>
                <option value="">{t('trade.anyCategory','Any category')}</option>
                {categories.map(c=> <option key={c.id} value={c.id}>{localize(c.name)}</option>)}
              </select>
              <div className="price-row">
                <input type="number" placeholder={t('trade.minPrice','Min price')} value={form.min_price} onChange={(e)=>setForm({...form, min_price: e.target.value})} />
                <input type="number" placeholder={t('trade.maxPrice','Max price')} value={form.max_price} onChange={(e)=>setForm({...form, max_price: e.target.value})} />
              </div>
              <button className="button button-primary" disabled={submitting}>{submitting ? t('trade.creating','Creating...') : t('trade.createAlert','Create alert')}</button>
            </form>
          </section>

          <section className="alerts-list">
            {loading ? <div className="loading">{t('trade.loadingAlerts','Loading alerts...')}</div> : (
              alerts.length>0 ? (
                <div className="alerts-grid">
                  {alerts.map(a=> (
                    <div key={a.id} className="alert-card">
                      <h4>{a.keywords || t('trade.anyLabel','Any')}</h4>
                      <p>{t('trade.categoryLabel','Category')}: {a.category?.name ? localize(a.category.name) : t('trade.anyLabel','Any')}</p>
                      <p>{t('trade.priceLabel','Price')}: {a.min_price || '—'} - {a.max_price || '—'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <h3>{t('trade.emptyTitle','No active trade alerts')}</h3>
                  <p>{t('trade.emptyBody','Create alerts to receive notifications about new matching listings.')}</p>
                </div>
              )
            )}
          </section>
        </>
      )}
    </div>
  )
}
