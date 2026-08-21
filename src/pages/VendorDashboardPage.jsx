import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  adjustVendorInventory,
  bulkUploadVendorProducts,
  createVendorProduct,
  createVendorStaff,
  deleteVendorProduct,
  getVendorDashboard,
  getVendorFinance,
  getVendorAnalytics,
  getVendorWallet,
  createVendorPayoutRequest,
  getVendorInventory,
  getVendorOrders,
  getVendorProducts,
  getVendorProfile,
  getVendorStaff,
  getVendorCustomers,
  getVendorInstallmentPlans,
  createVendorInstallmentPlan,
  updateVendorInstallmentPlan,
  getVendorCoupons,
  createVendorCoupon,
  updateVendorCoupon,
  getVendorCampaigns,
  createVendorCampaign,
  updateVendorCampaign,
  getVendorAdPlacements,
  createVendorAdPlacement,
  getVendorNotificationSettings,
  createVendorNotificationSetting,
  updateVendorNotificationSetting,
  getVendorConversations,
  createVendorConversation,
  sendVendorConversationMessage,
  getVendorReturns,
  createVendorReturn,
  updateVendorReturn,
  getVendorRefunds,
  createVendorRefund,
  updateVendorRefund,
  getVendorReviews,
  getVendorReviewAnalytics,
  createVendorCustomer,
  updateVendorCustomer,
  updateVendorProfile,
  respondVendorReview,
  reportVendorReview,
  moderateVendorReview,
  vendorBulkOrderAction,
  vendorOrderAction,
} from '../api'
import '../styles/pages/vendor-dashboard.css'
import { useTranslation } from '../i18n'
import { formatCurrency as formatCurrencyShared, useCurrency } from '../currency'

const emptyForm = {
  name: '',
  sku: '',
  barcode: '',
  price: '',
  stock: '',
  reserved_stock: '',
  low_stock_threshold: '',
  reorder_point: '',
  warehouse_code: '',
  warehouse_location: '',
  batch_number: '',
  batch_expiry_date: '',
  description: '',
  category: '',
  brand: '',
  tags: '',
  seo_title: '',
  seo_description: '',
  video_url: '',
  additional_images: '',
  sizes: '',
  colors: '',
  materials: '',
  is_featured: false,
  image: null,
}

const emptyInventoryForm = {
  product_id: '',
  quantity: '',
  reason: 'manual_adjustment',
  note: '',
}

// use shared formatter via context (wrapped below)

const customerGroupOptions = ['Wholesale', 'Repeat buyer', 'Priority', 'New']

const staffPermissionCatalog = {
  manager: [
    'orders.view',
    'orders.manage',
    'inventory.manage',
    'catalog.manage',
    'staff.manage',
  ],
  inventory: [
    'inventory.view',
    'inventory.manage',
    'stock.adjust',
  ],
  support: [
    'orders.view',
    'support.view',
    'support.respond',
    'returns.manage',
  ],
  accountant: [
    'finance.view',
    'payouts.view',
    'orders.view',
  ],
}

const staffRoleMeta = {
  manager: {
    label: 'Store Manager',
    description: 'Can oversee orders, catalog, inventory, and team operations.',
  },
  inventory: {
    label: 'Inventory Officer',
    description: 'Can manage stock levels, adjustments, and inventory visibility.',
  },
  support: {
    label: 'Customer Support Agent',
    description: 'Can handle customer conversations, orders, and returns.',
  },
  accountant: {
    label: 'Accountant',
    description: 'Can review finance, payouts, and order summaries.',
  },
}

export default function VendorDashboardPage({ auth }) {
  const { t } = useTranslation()
  const [stats, setStats] = useState(null)
  const [financeData, setFinanceData] = useState(null)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [walletData, setWalletData] = useState(null)
  const [vendorProfile, setVendorProfile] = useState(null)
  const [inventory, setInventory] = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [staffMembers, setStaffMembers] = useState([])
  const [customerRecords, setCustomerRecords] = useState([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerNoteDraft, setCustomerNoteDraft] = useState('')
  const [customerMessageDraft, setCustomerMessageDraft] = useState('')
  const [reviews, setReviews] = useState([])
  const [reviewAnalytics, setReviewAnalytics] = useState(null)
  const [selectedReviewId, setSelectedReviewId] = useState(null)
  const [reviewResponseDraft, setReviewResponseDraft] = useState('')
  const [reviewReportDraft, setReviewReportDraft] = useState('')
  const [selectedOrderIds, setSelectedOrderIds] = useState([])
  const [orderActionMessage, setOrderActionMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('overview')
  const [productForm, setProductForm] = useState(emptyForm)
  const [editingProductId, setEditingProductId] = useState(null)
  const [storeForm, setStoreForm] = useState({
    store_name: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    physical_address: '',
    postal_code: '',
    city: '',
    country: '',
    website_url: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    whatsapp_url: '',
    store_policies: '',
    shipping_policy: '',
    return_policy: '',
    vacation_mode: false,
    store_logo: null,
    store_banner: null,
  })
  const [inventoryForm, setInventoryForm] = useState(emptyInventoryForm)
  const [staffForm, setStaffForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'manager',
    permissions: [...staffPermissionCatalog.manager],
  })
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [walletRequestForm, setWalletRequestForm] = useState({ amount: '', method: 'mpesa', note: '' })
  const [walletMessage, setWalletMessage] = useState('')
  const [installmentPlans, setInstallmentPlans] = useState([])

  const { currency, rate } = useCurrency()
  const formatCurrency = (v) => formatCurrencyShared(v, currency, rate)
  const [coupons, setCoupons] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [adPlacements, setAdPlacements] = useState([])
  const [notificationSettings, setNotificationSettings] = useState([])
  const [conversations, setConversations] = useState([])
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const [conversationDraft, setConversationDraft] = useState({
    subject: '',
    conversation_type: 'customer',
    order: '',
    content: '',
    attachment: null,
  })
  const [messageDraft, setMessageDraft] = useState('')
  const [conversationError, setConversationError] = useState('')
  const [conversationLoading, setConversationLoading] = useState(false)
  const [returns, setReturns] = useState([])
  const [refunds, setRefunds] = useState([])
  const [selectedReturnId, setSelectedReturnId] = useState(null)
  const [returnForm, setReturnForm] = useState({ order: '', product: '', customer: '', reason: '', status: 'pending' })
  const [refundForm, setRefundForm] = useState({ return_request: '', amount: '', reason: '' })
  const [returnsError, setReturnsError] = useState('')
  const [returnsLoading, setReturnsLoading] = useState(false)
  const [installmentForm, setInstallmentForm] = useState({ title: '', terms: '', status: 'active', downpayment_percent: 0, months: 3 })
  const [couponForm, setCouponForm] = useState({ code: '', description: '', discount_type: 'percentage', promotion_type: 'discount', value: '', expires_at: '', usage_limit: '', bogo_product: '', bogo_quantity: 1 })
  const [campaignForm, setCampaignForm] = useState({ name: '', campaign_type: 'holiday_sale', description: '', start_date: '', end_date: '', flash_sale: false, discount_percent: '' })
  const [adForm, setAdForm] = useState({ name: '', placement_type: 'product', product: '', budget: '', start_date: '', end_date: '', status: 'active' })
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [selectedCouponId, setSelectedCouponId] = useState(null)
  const [selectedCampaignId, setSelectedCampaignId] = useState(null)

  useEffect(() => {
    if (!auth?.access) return

    const load = async () => {
      setLoading(true)
      try {
        const [dashboard, financeSummary, analyticsSummary, profileData, inventoryData, productData, ordersData, staffData, reviewsData, reviewStats, walletSummary, notificationSettingsData] = await Promise.all([
          getVendorDashboard(auth.access),
          getVendorFinance(auth.access),
          getVendorAnalytics(auth.access),
          getVendorProfile(auth.access),
          getVendorInventory(auth.access),
          getVendorProducts(auth.access),
          getVendorOrders(auth.access),
          getVendorStaff(auth.access),
          getVendorReviews(auth.access),
          getVendorReviewAnalytics(auth.access),
          getVendorWallet(auth.access),
          getVendorNotificationSettings(auth.access).catch(() => []),
        ])
        setStats(dashboard)
        setFinanceData(financeSummary || null)
        setAnalyticsData(analyticsSummary || null)
        setWalletData(walletSummary || null)
        setNotificationSettings(Array.isArray(notificationSettingsData) ? notificationSettingsData : [])
        setVendorProfile(profileData)
        setInventory(inventoryData || null)
        setProducts(productData || [])
        setOrders(ordersData || [])
        setReviews(reviewsData || [])
        setReviewAnalytics(reviewStats || null)
        // attempt to load persisted vendor customer records from backend
        try {
          const serverCustomers = await getVendorCustomers(auth.access)
          if (Array.isArray(serverCustomers) && serverCustomers.length) {
            const mapped = serverCustomers.map((c) => ({
              id: c.customer_key || c.id,
              name: c.name || '',
              email: c.email || '',
              phone: c.phone || '',
              notes: c.notes || [],
              groups: c.groups || [],
              vip: Boolean(c.vip),
              loyaltyPoints: Number(c.loyalty_points || 0),
              communication: c.communication || [],
            }))
            setCustomerRecords(mapped)
            if (!selectedCustomerId && mapped.length) setSelectedCustomerId(mapped[0].id)
          }
        } catch (err) {
          // ignore backend errors and fall back to client-side derived records
        }
        setStaffMembers(staffData || [])
        setStoreForm({
          store_name: profileData.store_name || '',
          description: profileData.description || '',
          contact_email: profileData.contact_email || '',
          contact_phone: profileData.contact_phone || '',
          physical_address: profileData.physical_address || '',
          postal_code: profileData.postal_code || '',
          city: profileData.city || '',
          country: profileData.country || '',
          website_url: profileData.website_url || '',
          facebook_url: profileData.facebook_url || '',
          instagram_url: profileData.instagram_url || '',
          twitter_url: profileData.twitter_url || '',
          whatsapp_url: profileData.whatsapp_url || '',
          store_policies: profileData.store_policies || '',
          shipping_policy: profileData.shipping_policy || '',
          return_policy: profileData.return_policy || '',
          vacation_mode: profileData.vacation_mode || false,
          store_logo: null,
          store_banner: null,
        })
        try {
          const [plans, serverCoupons, serverCampaigns, serverAds] = await Promise.all([
            getVendorInstallmentPlans(auth.access).catch(() => []),
            getVendorCoupons(auth.access).catch(() => []),
            getVendorCampaigns(auth.access).catch(() => []),
            getVendorAdPlacements(auth.access).catch(() => []),
          ])
          setInstallmentPlans(Array.isArray(plans) ? plans : [])
          setCoupons(Array.isArray(serverCoupons) ? serverCoupons : [])
          setCampaigns(Array.isArray(serverCampaigns) ? serverCampaigns : [])
          setAdPlacements(Array.isArray(serverAds) ? serverAds : [])
        } catch (err) {
          // ignore marketing/load errors
        }
      } catch (error) {
        setFormError(error.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [auth])

  useEffect(() => {
    const loadVendorConversations = async () => {
      if (!auth?.access || activeSection !== 'messages') return
      setConversationLoading(true)
      setConversationError('')
      try {
        const convoResult = await getVendorConversations(auth.access)
        setConversations(Array.isArray(convoResult) ? convoResult : [])
        if (Array.isArray(convoResult) && convoResult.length) {
          setSelectedConversationId((current) => current || convoResult[0].id)
        }
      } catch (error) {
        setConversationError(error.message)
      } finally {
        setConversationLoading(false)
      }
    }

    loadVendorConversations()
  }, [auth, activeSection])

  useEffect(() => {
    const loadVendorReturns = async () => {
      if (!auth?.access || activeSection !== 'returns') return
      setReturnsLoading(true)
      setReturnsError('')
      try {
        const [returnsResult, refundsResult] = await Promise.all([
          getVendorReturns(auth.access),
          getVendorRefunds(auth.access),
        ])
        setReturns(Array.isArray(returnsResult) ? returnsResult : [])
        setRefunds(Array.isArray(refundsResult) ? refundsResult : [])
        if (Array.isArray(returnsResult) && returnsResult.length) {
          setSelectedReturnId((current) => current || returnsResult[0].id)
        }
      } catch (error) {
        setReturnsError(error.message)
      } finally {
        setReturnsLoading(false)
      }
    }

    loadVendorReturns()
  }, [auth, activeSection])

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId)
  const selectedReturn = returns.find((r) => r.id === selectedReturnId)

  useEffect(() => {
    if (!orders.length) {
      setCustomerRecords([])
      return
    }

    try {
      const raw = window.localStorage.getItem('vendor-customer-records')
      const savedCustomers = raw ? JSON.parse(raw) : []
      const grouped = orders.reduce((map, order) => {
        const email = order.customer_email || order.email || order.user_email || ''
        const phone = order.phone || ''
        const customerKey = email || phone || `customer-${order.user || order.id}`
        if (!map[customerKey]) {
          map[customerKey] = {
            id: customerKey,
            name: order.customer_name || order.first_name || order.user_name || 'Customer',
            email,
            phone,
            totalSpent: Number(order.total_amount || 0),
            orders: [],
            notes: [],
            groups: [],
            vip: false,
            loyaltyPoints: 0,
            communication: [],
          }
        }

        const existing = map[customerKey]
        existing.orders.push({
          id: order.id,
          orderNumber: order.order_number || `Order #${order.id}`,
          total: Number(order.total_amount || 0),
          status: order.status || 'pending',
          purchasedAt: order.created_at || order.updated_at || '',
        })
        existing.totalSpent += Number(order.total_amount || 0)
        existing.name = order.customer_name || order.first_name || existing.name
        return map
      }, {})

      const nextCustomers = Object.values(grouped).map((customer) => {
        const saved = savedCustomers.find((item) => item.id === customer.id)
        return {
          ...customer,
          notes: saved?.notes || [],
          groups: saved?.groups || [],
          vip: Boolean(saved?.vip),
          loyaltyPoints: Number(saved?.loyaltyPoints || 0),
          communication: saved?.communication || [],
        }
      })

      setCustomerRecords(nextCustomers)
      if (!selectedCustomerId && nextCustomers.length) {
        setSelectedCustomerId(nextCustomers[0].id)
      }
    } catch (error) {
      setCustomerRecords([])
    }
  }, [orders])

  useEffect(() => {
    if (!customerRecords.length) return
    try {
      window.localStorage.setItem('vendor-customer-records', JSON.stringify(customerRecords))
    } catch (error) {
      // ignore storage issues
    }
  }, [customerRecords])

  const handleOrderSelection = (orderId) => {
    setSelectedOrderIds((current) =>
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId]
    )
  }

  const handleInstallmentChange = (event) => {
    const { name, value } = event.target
    setInstallmentForm((current) => ({ ...current, [name]: value }))
  }

  const handleInstallmentSubmit = async (event) => {
    event && event.preventDefault()
    if (!auth?.access) return
    try {
      const created = await createVendorInstallmentPlan(auth.access, installmentForm)
      setInstallmentPlans((current) => [created, ...current])
      setInstallmentForm({ title: '', terms: '', status: 'active', downpayment_percent: 0, months: 3 })
      setFormSuccess('Installment plan created.')
      setFormError('')
    } catch (err) {
      setFormError(err.message)
      setFormSuccess('')
    }
  }

  const handleInstallmentUpdate = async (planId, patch) => {
    if (!auth?.access) return
    try {
      const updated = await updateVendorInstallmentPlan(auth.access, planId, patch)
      setInstallmentPlans((current) => current.map((p) => (p.id === updated.id ? updated : p)))
      setFormSuccess('Installment plan updated.')
      setFormError('')
    } catch (err) {
      setFormError(err.message)
      setFormSuccess('')
    }
  }

  const handleCouponChange = (event) => {
    const { name, value } = event.target
    setCouponForm((current) => ({ ...current, [name]: value }))
  }

  const handleCouponSubmit = async (event) => {
    event && event.preventDefault()
    if (!auth?.access) return
    try {
      const created = await createVendorCoupon(auth.access, couponForm)
      setCoupons((current) => [created, ...current])
      setCouponForm({ code: '', description: '', discount_type: 'percentage', promotion_type: 'discount', value: '' })
      setFormSuccess('Coupon created.')
      setFormError('')
    } catch (err) {
      setFormError(err.message)
      setFormSuccess('')
    }
  }

  const handleCouponUpdate = async (couponId, patch) => {
    if (!auth?.access) return
    try {
      const updated = await updateVendorCoupon(auth.access, couponId, patch)
      setCoupons((current) => current.map((c) => (c.id === updated.id ? updated : c)))
      setFormSuccess('Coupon updated.')
      setFormError('')
    } catch (err) {
      setFormError(err.message)
      setFormSuccess('')
    }
  }

  const handleCampaignChange = (event) => {
    const { name, value } = event.target
    setCampaignForm((current) => ({ ...current, [name]: value }))
  }

  const handleCampaignSubmit = async (event) => {
    event && event.preventDefault()
    if (!auth?.access) return
    try {
      const created = await createVendorCampaign(auth.access, campaignForm)
      setCampaigns((current) => [created, ...current])
      setCampaignForm({ name: '', campaign_type: 'holiday_sale', description: '' })
      setFormSuccess('Campaign created.')
      setFormError('')
    } catch (err) {
      setFormError(err.message)
      setFormSuccess('')
    }
  }

  const handleCampaignUpdate = async (campaignId, patch) => {
    if (!auth?.access) return
    try {
      const updated = await updateVendorCampaign(auth.access, campaignId, patch)
      setCampaigns((current) => current.map((c) => (c.id === updated.id ? updated : c)))
      setFormSuccess('Campaign updated.')
      setFormError('')
    } catch (err) {
      setFormError(err.message)
      setFormSuccess('')
    }
  }

  const handleAdChange = (event) => {
    const { name, value } = event.target
    setAdForm((current) => ({ ...current, [name]: value }))
  }

  const handleAdSubmit = async (event) => {
    event && event.preventDefault()
    if (!auth?.access) return
    try {
      const payload = {
        ...adForm,
        budget: adForm.budget || '0',
        product: adForm.placement_type === 'product' ? adForm.product || null : null,
      }
      const created = await createVendorAdPlacement(auth.access, payload)
      setAdPlacements((current) => [created, ...current])
      setAdForm({ name: '', placement_type: 'product', product: '', budget: '', start_date: '', end_date: '', status: 'active' })
      setFormSuccess('Advertising placement created.')
      setFormError('')
    } catch (err) {
      setFormError(err.message)
      setFormSuccess('')
    }
  }

  const renderInstallments = () => (
    <div className="card" style={{ background: '#fff' }}>
      <h3 style={{ marginTop: 0 }}>Installment plans</h3>
      <form onSubmit={handleInstallmentSubmit} style={{ display: 'grid', gap: '0.6rem', marginBottom: '0.6rem' }}>
        <input name="title" value={installmentForm.title} onChange={handleInstallmentChange} placeholder={t('vendor.installments.planTitle','Plan title')} required />
      <input name="downpayment_percent" type="number" min="0" max="100" value={installmentForm.downpayment_percent} onChange={handleInstallmentChange} placeholder={t('vendor.installments.downpayment','Downpayment %')} />
      <input name="months" type="number" min="1" value={installmentForm.months} onChange={handleInstallmentChange} placeholder={t('vendor.installments.months','Months')} />
        <select name="status" value={installmentForm.status} onChange={handleInstallmentChange}>
          <option value="active">{t('vendor.status.active','Active')}</option>
          <option value="paused">{t('vendor.status.paused','Paused')}</option>
          <option value="completed">{t('vendor.status.completed','Completed')}</option>
        </select>
        <button className="button button-primary" type="submit">{t('vendor.installments.createPlan','Create plan')}</button>
      </form>

      {installmentPlans.length === 0 ? (
        <p style={{ margin: 0, color: '#6f7a88' }}>{t('vendor.installments.noPlans','No plans yet.')}</p>
      ) : (
        installmentPlans.map((plan) => (
          <div key={plan.id} style={{ border: '1px solid #ece2d3', borderRadius: '10px', padding: '0.6rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{plan.title}</strong>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="button button-secondary" type="button" onClick={() => handleInstallmentUpdate(plan.id, { status: plan.status === 'active' ? 'paused' : 'active' })}>
                  {plan.status === 'active' ? t('vendor.installments.pause','Pause') : t('vendor.installments.activate','Activate')}
                </button>
              </div>
            </div>
            <div style={{ color: '#6f7a88', marginTop: '0.4rem' }}>
              {t('vendor.installments.termsLabel','Terms')}: {plan.terms || '—'} · {t('vendor.installments.downpaymentLabel','Downpayment')}: {plan.downpayment_percent || 0}% · {plan.months || 0} {t('vendor.installments.monthsLabel','months')}
            </div>
          </div>
        ))
      )}
    </div>
  )

  const renderAdvertising = () => (
    <div className="card" style={{ background: '#fff' }}>
      <h3 style={{ marginTop: 0 }}>{t('vendor.ad.title','Advertising system')}</h3>
      <p style={{ color: '#6f7a88', marginTop: '-0.2rem' }}>{t('vendor.ad.subtitle','Pay to highlight your storefront or products with featured placements, sponsored listings, or homepage banners.')}</p>
      <form onSubmit={handleAdSubmit} style={{ display: 'grid', gap: '0.6rem' }}>
        <input name="name" value={adForm.name} onChange={handleAdChange} placeholder={t('vendor.ad.name','Placement title')} required />
        <select name="placement_type" value={adForm.placement_type} onChange={handleAdChange}>
          <option value="product">{t('vendor.ad.placementType.product','Feature product')}</option>
          <option value="store">{t('vendor.ad.placementType.store','Feature store')}</option>
          <option value="sponsored">{t('vendor.ad.placementType.sponsored','Sponsored listing')}</option>
          <option value="banner">{t('vendor.ad.placementType.banner','Homepage banner')}</option>
        </select>
        {adForm.placement_type === 'product' && (
          <select name="product" value={adForm.product} onChange={handleAdChange}>
            <option value="">{t('vendor.ad.selectProduct','Select a product')}</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
        )}
        <input name="budget" type="number" min="0" step="0.01" value={adForm.budget} onChange={handleAdChange} placeholder={t('vendor.ad.budget','Budget (KES)')} />
        <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: '1fr 1fr' }}>
          <input name="start_date" type="date" value={adForm.start_date} onChange={handleAdChange} />
          <input name="end_date" type="date" value={adForm.end_date} onChange={handleAdChange} />
        </div>
        <select name="status" value={adForm.status} onChange={handleAdChange}>
          <option value="active">{t('vendor.status.active','Active')}</option>
          <option value="draft">{t('vendor.status.draft','Draft')}</option>
          <option value="paused">{t('vendor.status.paused','Paused')}</option>
          <option value="completed">{t('vendor.status.completed','Completed')}</option>
        </select>
        <button className="button button-primary" type="submit">{t('vendor.ad.createPlacement','Create placement')}</button>
      </form>
      {adPlacements.length === 0 ? <p style={{ margin: 0, color: '#6f7a88' }}>{t('vendor.ad.noPlacements','No ad placements yet.')}</p> : adPlacements.map((placement) => (
        <div key={placement.id} style={{ border: '1px solid #ece2d3', borderRadius: '10px', padding: '0.6rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>{placement.name}</strong>
            <span className="staff-role-badge">{placement.placement_type}</span>
          </div>
          <div style={{ color: '#6f7a88', marginTop: '0.35rem' }}>
            {t('vendor.ad.budgetLabel','Budget')}: {formatCurrency(placement.budget || 0)} · {t('vendor.ad.statusLabel','Status')}: {placement.status || t('vendor.status.draft','Draft')}
          </div>
        </div>
      ))}
    </div>
  )

  const renderMiniBarChart = (items, valueKey = 'value', labelKey = 'label', color = '#d4a350') => {
    if (!Array.isArray(items) || !items.length) return null

    const values = items
      .map((item) => Number(item?.[valueKey] ?? item?.revenue ?? item?.value ?? 0))
      .filter((value) => Number.isFinite(value))

    if (!values.length) return null

    const maxValue = Math.max(...values, 1)

    return (
      <svg viewBox={`0 0 ${items.length * 40} 80`} width="100%" height="90" style={{ marginTop: '0.6rem' }} role="img" aria-label="Bar chart">
        {items.map((item, index) => {
          const value = Number(item?.[valueKey] ?? item?.revenue ?? item?.value ?? 0)
          const height = Math.max(10, (value / maxValue) * 56)
          const x = index * 40 + 8
          const y = 72 - height
          const label = item?.[labelKey] || item?.period || item?.name || item?.category || ''
          return (
            <g key={`${label}-${index}`}>
              <rect x={x} y={y} width="20" height={height} rx="3" fill={color} />
              <text x={x + 10} y="76" textAnchor="middle" fontSize="8" fill="#6f7a88">{label.slice(0, 8)}</text>
            </g>
          )
        })}
      </svg>
    )
  }

  const renderProgressBar = (label, value, max = 100) => {
    const percent = Math.min(100, Math.max(0, Number(value) || 0))
    return (
      <div style={{ marginTop: '0.45rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
          <span>{label}</span>
          <strong>{percent.toFixed(0)}%</strong>
        </div>
        <div style={{ height: '8px', background: '#f1ebdf', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ width: `${(percent / max) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #d4a350, #a56b3d)', borderRadius: '999px' }} />
        </div>
      </div>
    )
  }

  const renderAnalytics = () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div className="card" style={{ background: '#fff' }}>
        <h3 style={{ marginTop: 0 }}>{t('vendor.analytics.title','Analytics dashboard')}</h3>
        {!analyticsData ? (
          <p style={{ color: '#6f7a88', margin: 0 }}>{t('vendor.analytics.loading','Loading analytics…')}</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem' }}>
              <div style={{ border: '1px solid #ece2d3', borderRadius: '10px', padding: '0.8rem' }}>
                <div style={{ color: '#6f7a88' }}>{t('vendor.analytics.revenue','Revenue')}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>KES {analyticsData.sales?.total_revenue || '0.00'}</div>
              </div>
              <div style={{ border: '1px solid #ece2d3', borderRadius: '10px', padding: '0.8rem' }}>
                <div style={{ color: '#6f7a88' }}>{t('vendor.analytics.newCustomers','New customers')}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{analyticsData.customers?.new_customers || 0}</div>
              </div>
              <div style={{ border: '1px solid #ece2d3', borderRadius: '10px', padding: '0.8rem' }}>
                <div style={{ color: '#6f7a88' }}>{t('vendor.analytics.completionRate','Completion rate')}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{analyticsData.orders?.completion_rate || 0}%</div>
              </div>
              <div style={{ border: '1px solid #ece2d3', borderRadius: '10px', padding: '0.8rem' }}>
                <div style={{ color: '#6f7a88' }}>{t('vendor.analytics.purchaseRate','Purchase rate')}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{analyticsData.conversion?.purchase_rate || 0}%</div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '0.8rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              <div style={{ border: '1px solid #ece2d3', borderRadius: '10px', padding: '0.8rem' }}>
                <h4 style={{ margin: '0 0 0.5rem' }}>{t('vendor.analytics.revenueTrends','Revenue trends')}</h4>
                {analyticsData.sales?.revenue_trends?.length ? (
                  <>
                    {renderMiniBarChart(analyticsData.sales.revenue_trends.map((entry) => ({ ...entry, value: Number(entry.revenue) || 0, label: entry.period })), 'value', 'label')}
                    <div style={{ color: '#6f7a88', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {analyticsData.sales.revenue_trends.map((entry) => (
                        <div key={entry.period} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{entry.period}</span>
                          <strong style={{ color: '#333' }}>KES {entry.revenue}</strong>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <p style={{ margin: 0, color: '#6f7a88' }}>{t('vendor.analytics.noRevenueHistory','No revenue history yet.')}</p>}
              </div>
              <div style={{ border: '1px solid #ece2d3', borderRadius: '10px', padding: '0.8rem' }}>
                <h4 style={{ margin: '0 0 0.5rem' }}>{t('vendor.analytics.topProducts','Top products')}</h4>
                {analyticsData.sales?.product_performance?.length ? (
                  <>
                    {renderMiniBarChart(analyticsData.sales.product_performance.map((product) => ({ ...product, value: Number(product.revenue) || 0, label: product.name })), 'value', 'label')}
                    {analyticsData.sales.product_performance.map((product) => (
                      <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', color: '#6f7a88', marginTop: '0.35rem' }}>
                        <span>{product.name}</span>
                        <strong style={{ color: '#333' }}>{product.total_sales} sold · KES {product.revenue}</strong>
                      </div>
                    ))}
                  </>
                ) : <p style={{ margin: 0, color: '#6f7a88' }}>No product sales yet.</p>}
              </div>
              <div style={{ border: '1px solid #ece2d3', borderRadius: '10px', padding: '0.8rem' }}>
                <h4 style={{ margin: '0 0 0.5rem' }}>Top categories</h4>
                {analyticsData.sales?.category_performance?.length ? (
                  <>
                    {renderMiniBarChart(analyticsData.sales.category_performance.map((category) => ({ ...category, value: Number(category.revenue) || 0, label: category.name })), 'value', 'label')}
                    {analyticsData.sales.category_performance.map((category) => (
                      <div key={category.name} style={{ display: 'flex', justifyContent: 'space-between', color: '#6f7a88', marginTop: '0.35rem' }}>
                        <span>{category.name}</span>
                        <strong style={{ color: '#333' }}>{category.total_sales} sold · KES {category.revenue}</strong>
                      </div>
                    ))}
                  </>
                ) : <p style={{ margin: 0, color: '#6f7a88' }}>No category sales yet.</p>}
              </div>
            </div>

            <div style={{ display: 'grid', gap: '0.8rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div style={{ border: '1px solid #ece2d3', borderRadius: '10px', padding: '0.8rem' }}>
                <h4 style={{ margin: '0 0 0.5rem' }}>Customer health</h4>
                {renderProgressBar('Returning customers', analyticsData.customers?.returning_customers || 0, Math.max(analyticsData.customers?.total_customers || 10, 10))}
                {renderProgressBar('Retention rate', analyticsData.customers?.retention_rate || 0)}
              </div>
              <div style={{ border: '1px solid #ece2d3', borderRadius: '10px', padding: '0.8rem' }}>
                <h4 style={{ margin: '0 0 0.5rem' }}>Order health</h4>
                {renderProgressBar('Delivery success', analyticsData.orders?.delivery_success_rate || 0)}
                {renderProgressBar('Cancellation rate', analyticsData.orders?.cancellation_rate || 0)}
              </div>
              <div style={{ border: '1px solid #ece2d3', borderRadius: '10px', padding: '0.8rem' }}>
                <h4 style={{ margin: '0 0 0.5rem' }}>Conversion funnel</h4>
                {renderProgressBar('Add-to-cart rate', analyticsData.conversion?.add_to_cart_rate || 0)}
                {renderProgressBar('Checkout rate', analyticsData.conversion?.checkout_rate || 0)}
                {renderProgressBar('Purchase rate', analyticsData.conversion?.purchase_rate || 0)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderMessages = () => {
    const conversationTypes = [
      { value: 'all', label: 'All conversations' },
      { value: 'customer', label: 'Customer' },
      { value: 'admin', label: 'Marketplace admin' },
      { value: 'delivery_partner', label: 'Delivery partner' },
    ]

    const handleConversationDraftChange = (event) => {
      const { name, value, files } = event.target
      setConversationDraft((current) => ({
        ...current,
        [name]: files ? files[0] : value,
      }))
    }

    const handleCreateConversation = async (event) => {
      event.preventDefault()
      if (!auth?.access) return
      setFormError('')
      try {
        const form = new FormData()
        form.append('subject', conversationDraft.subject)
        form.append('conversation_type', conversationDraft.conversation_type)
        if (conversationDraft.order) {
          form.append('order', conversationDraft.order)
        }
        form.append('content', conversationDraft.content)
        if (conversationDraft.attachment) {
          form.append('attachment', conversationDraft.attachment)
        }

        const created = await createVendorConversation(auth.access, form)
        setConversations((current) => [created, ...current])
        setSelectedConversationId(created.id)
        setConversationDraft({ subject: '', conversation_type: 'customer', order: '', content: '', attachment: null })
        setMessageDraft('')
        setFormSuccess('Conversation created successfully.')
      } catch (error) {
        setFormError(error.message)
      }
    }

    const handleSendMessage = async (event) => {
      event.preventDefault()
      if (!auth?.access || !selectedConversationId) return
      setFormError('')
      try {
        const form = new FormData()
        form.append('content', messageDraft)
        if (conversationDraft.attachment) {
          form.append('attachment', conversationDraft.attachment)
        }

        const newMessage = await sendVendorConversationMessage(auth.access, selectedConversationId, form)
        setConversations((current) => current.map((conversation) => (
          conversation.id === selectedConversationId
            ? { ...conversation, messages: [...(conversation.messages || []), newMessage], updated_at: newMessage.created_at }
            : conversation
        )))
        setMessageDraft('')
        setConversationDraft((current) => ({ ...current, attachment: null }))
        setFormSuccess('Message sent.')
      } catch (error) {
        setFormError(error.message)
      }
    }

    const handleSelectConversation = (conversationId) => {
      setSelectedConversationId(conversationId)
      setMessageDraft('')
    }

    return (
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1.6fr' }}>
        <div className="card" style={{ background: '#fff', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Conversations</h3>
            <select
              value={conversationDraft.conversation_type}
              onChange={(event) => setConversationDraft((current) => ({ ...current, conversation_type: event.target.value }))}
              style={{ minWidth: '160px', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc' }}
            >
              {conversationTypes.slice(1).map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem' }}>Order</label>
            <select
              name="order"
              value={conversationDraft.order}
              onChange={handleConversationDraftChange}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #d8d8d8' }}
            >
              <option value="">Select order</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>{order.order_number || `Order #${order.id}`}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '0.8rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem' }}>Subject</label>
            <input
              name="subject"
              value={conversationDraft.subject}
              onChange={handleConversationDraftChange}
              placeholder={t('vendor.messages.conversationSubject','Conversation subject')}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #d8d8d8' }}
            />
          </div>
          <div style={{ marginBottom: '0.8rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem' }}>Message</label>
            <textarea
              name="content"
              value={conversationDraft.content}
              onChange={handleConversationDraftChange}
              rows={4}
              placeholder={t('vendor.messages.startMessage','Write a message to start this conversation')}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #d8d8d8', resize: 'vertical' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem' }}>Attachment</label>
            <input
              type="file"
              name="attachment"
              onChange={handleConversationDraftChange}
            />
          </div>
          <button type="button" className="button button-primary" onClick={handleCreateConversation}>
            Start conversation
          </button>

          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.75rem' }}>Existing conversations</h4>
            {conversationLoading ? (
              <p style={{ color: '#6f7a88' }}>Loading conversations…</p>
            ) : conversationError ? (
              <p style={{ color: '#d45d5d' }}>{conversationError}</p>
            ) : !conversations.length ? (
              <p style={{ color: '#6f7a88' }}>No conversations yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={selectedConversationId === conversation.id ? 'vendor-nav-btn active' : 'vendor-nav-btn'}
                    style={{ textAlign: 'left', width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e7dfd3', background: selectedConversationId === conversation.id ? '#f7efe1' : '#fff' }}
                  >
                    <strong>{conversation.subject || 'Untitled conversation'}</strong>
                    <div style={{ color: '#6f7a88', fontSize: '0.88rem', marginTop: '0.25rem' }}>
                      {conversation.order_number ? `${conversation.order_number} · ` : ''}{conversation.conversation_type}
                    </div>
                    <div style={{ color: '#6f7a88', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                      {conversation.messages?.length || 0} messages
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ background: '#fff', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>{t('vendor.messages.detailsTitle','Conversation details')}</h3>
            {selectedConversation && <span style={{ color: '#6f7a88' }}>{selectedConversation.conversation_type}</span>}
          </div>
          {!selectedConversation ? (
            <p style={{ color: '#6f7a88' }}>{t('vendor.messages.selectConversation','Select a conversation to view the thread.')}</p>
          ) : (
            <>
              <div style={{ marginBottom: '1rem', padding: '0.8rem', border: '1px solid #ece2d3', borderRadius: '12px', background: '#f9f7f1' }}>
                <p style={{ margin: '0 0 0.35rem', fontWeight: 700 }}>{selectedConversation.subject}</p>
                <p style={{ margin: 0, color: '#6f7a88' }}>{selectedConversation.order_number ? `${t('vendor.messages.orderLabel','Order')} ${selectedConversation.order_number}` : t('vendor.messages.noOrderAttached','No order attached')}</p>
              </div>
              <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem', maxHeight: '380px', overflowY: 'auto' }}>
                {selectedConversation.messages?.map((message) => (
                  <div key={message.id} style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #e7dfd3', background: message.sender_type === 'vendor' ? '#eef7f2' : '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <strong>{message.sender_type === 'vendor' ? t('vendor.messages.you','You') : message.sender_type}</strong>
                      <span style={{ color: '#6f7a88', fontSize: '0.8rem' }}>{message.created_at}</span>
                    </div>
                    <p style={{ margin: 0 }}>{message.content}</p>
                    {message.attachment_url && (
                      <a href={message.attachment_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '0.5rem', color: '#1d2a3a' }}>
                        {t('vendor.messages.viewAttachment','View attachment')}
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendMessage}>
                <div style={{ marginBottom: '0.8rem' }}>
                  <textarea
                    value={messageDraft}
                    onChange={(event) => setMessageDraft(event.target.value)}
                    rows={3}
                    placeholder={t('vendor.reviews.writeReply','Write a reply...')}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #d8d8d8', resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    onChange={(event) => setConversationDraft((current) => ({ ...current, attachment: event.target.files?.[0] || null }))}
                  />
                  <button type="submit" className="button button-primary">
                    {t('vendor.messages.send','Send message')}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    )
  }

  const renderReturns = () => {
    const handleReturnStatusChange = async (returnId, newStatus) => {
      if (!auth?.access) return
      try {
        const updated = await updateVendorReturn(auth.access, returnId, { status: newStatus })
        setReturns((current) => current.map((r) => (r.id === returnId ? updated : r)))
        setFormSuccess(`Return status updated to ${newStatus}.`)
        setFormError('')
      } catch (error) {
        setFormError(error.message)
      }
    }

    const handleCreateRefund = async (event) => {
      event.preventDefault()
      if (!auth?.access || !selectedReturn) return
      try {
        const payload = {
          return_request: selectedReturn.id,
          amount: refundForm.amount,
          reason: refundForm.reason,
        }
        const created = await createVendorRefund(auth.access, payload)
        setRefunds((current) => [created, ...current])
        setRefundForm({ return_request: '', amount: '', reason: '' })
        setFormSuccess('Refund request created.')
        setFormError('')
      } catch (error) {
        setFormError(error.message)
      }
    }

    const returnStatusColor = {
      pending: '#f4a460',
      approved: '#2f5d50',
      rejected: '#d45d5d',
      completed: '#1d2a3a',
    }

    return (
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1.2fr 1.4fr' }}>
        <div className="card" style={{ background: '#fff', padding: '1rem' }}>
          <h3 style={{ margin: '0 0 1rem' }}>Return Requests</h3>
          {returnsLoading ? (
            <p style={{ color: '#6f7a88' }}>Loading returns…</p>
          ) : returnsError ? (
            <p style={{ color: '#d45d5d' }}>{returnsError}</p>
          ) : !returns.length ? (
            <p style={{ color: '#6f7a88' }}>No return requests yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {returns.map((ret) => (
                <button
                  key={ret.id}
                  type="button"
                  onClick={() => setSelectedReturnId(ret.id)}
                  className={selectedReturnId === ret.id ? 'vendor-nav-btn active' : 'vendor-nav-btn'}
                  style={{
                    textAlign: 'left',
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: '1px solid #e7dfd3',
                    background: selectedReturnId === ret.id ? '#f7efe1' : '#fff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{ret.product_name}</strong>
                    <span
                      style={{
                        background: returnStatusColor[ret.status] || '#ccc',
                        color: '#fff',
                        borderRadius: '999px',
                        padding: '0.2rem 0.6rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {ret.status}
                    </span>
                  </div>
                  <div style={{ color: '#6f7a88', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                    Order: {ret.order_number}
                  </div>
                  <div style={{ color: '#6f7a88', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    {ret.customer_email}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ background: '#fff', padding: '1rem' }}>
          <h3 style={{ margin: '0 0 1rem' }}>{t('vendor.returns.title','Return Details')}</h3>
          {!selectedReturn ? (
            <p style={{ color: '#6f7a88' }}>{t('vendor.returns.selectNotice','Select a return request to view details.')}</p>
          ) : (
            <>
              <div style={{ marginBottom: '1rem', padding: '0.8rem', border: '1px solid #ece2d3', borderRadius: '12px', background: '#f9f7f1' }}>
                <p style={{ margin: '0 0 0.35rem', fontWeight: 700 }}>
                  {selectedReturn.product_name} - {t('vendor.returns.orderLabel','Order')} {selectedReturn.order_number}
                </p>
                <p style={{ margin: '0.2rem 0', color: '#6f7a88' }}>{t('vendor.returns.customerLabel','Customer')}: {selectedReturn.customer_email}</p>
                <p style={{ margin: '0.2rem 0', color: '#6f7a88' }}>{t('vendor.returns.reasonLabel','Reason')}: {selectedReturn.reason}</p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>{t('vendor.statusLabel','Status')}</label>
                <select
                  value={selectedReturn.status}
                  onChange={(event) => handleReturnStatusChange(selectedReturn.id, event.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '10px',
                    border: '1px solid #d8d8d8',
                  }}
                >
                  <option value="pending">{t('vendor.status.pending','Pending')}</option>
                  <option value="approved">{t('vendor.status.approved','Approved')}</option>
                  <option value="rejected">{t('vendor.status.rejected','Rejected')}</option>
                  <option value="completed">{t('vendor.status.completed','Completed')}</option>
                </select>
              </div>

              {selectedReturn.status === 'approved' && !refunds.some((r) => r.return_request === selectedReturn.id) && (
                <form onSubmit={handleCreateRefund}>
                  <div style={{ marginBottom: '0.8rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.35rem' }}>Refund Amount (KES)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={refundForm.amount}
                      onChange={(event) => setRefundForm((current) => ({ ...current, amount: event.target.value }))}
                      placeholder={t('vendor.returns.enterRefundAmount','Enter refund amount')}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #d8d8d8' }}
                    />
                  </div>
                  <div style={{ marginBottom: '0.8rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.35rem' }}>Reason</label>
                    <textarea
                      value={refundForm.reason}
                      onChange={(event) => setRefundForm((current) => ({ ...current, reason: event.target.value }))}
                      rows={2}
                      placeholder={t('vendor.returns.reasonPlaceholder','Reason for refund')}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #d8d8d8' }}
                    />
                  </div>
                  <button type="submit" className="button button-primary">
                    Create Refund Request
                  </button>
                </form>
              )}

              {refunds.some((r) => r.return_request === selectedReturn.id) && (
                <div style={{ marginTop: '1rem', padding: '0.8rem', border: '1px solid #2f5d50', borderRadius: '12px', background: '#eef7f2' }}>
                  <strong style={{ color: '#2f5d50' }}>Refund Created</strong>
                  {refunds
                    .filter((r) => r.return_request === selectedReturn.id)
                    .map((refund) => (
                      <div key={refund.id} style={{ marginTop: '0.5rem', color: '#2f5d50', fontSize: '0.9rem' }}>
                        <div>{t('vendor.returns.amountLabel','Amount')}: KES {parseFloat(refund.amount).toFixed(2)}</div>
                        <div>{t('vendor.statusLabel','Status')}: {refund.status}</div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  const renderNotifications = () => {
    const notificationEvents = [
      { key: 'new_order', label: t('vendor.notifications.newOrder','New orders'), description: t('vendor.notifications.newOrderDescription','Alerts when a buyer places an order.') },
      { key: 'new_review', label: t('vendor.notifications.newReview','New reviews'), description: t('vendor.notifications.newReviewDescription','Notify you when customers leave feedback.') },
      { key: 'new_message', label: t('vendor.notifications.newMessage','New messages'), description: t('vendor.notifications.newMessageDescription','Stay on top of buyer conversations.') },
      { key: 'low_stock', label: t('vendor.notifications.lowStock','Low stock'), description: t('vendor.notifications.lowStockDescription','Warn you before inventory runs out.') },
      { key: 'payout_approval', label: t('vendor.notifications.payoutApproval','Payout approval'), description: t('vendor.notifications.payoutApprovalDescription','Get updates on payout requests.') },
      { key: 'installment_payment', label: t('vendor.notifications.installmentPayment','Installment payments'), description: t('vendor.notifications.installmentPaymentDescription','Monitor payment schedules for financing plans.') },
    ]

    const notificationChannels = [
      { key: 'email', label: t('vendor.notifications.channels.email','Email') },
      { key: 'sms', label: t('vendor.notifications.channels.sms','SMS') },
      { key: 'whatsapp', label: t('vendor.notifications.channels.whatsapp','WhatsApp') },
      { key: 'in_app', label: t('vendor.notifications.channels.inApp','In-app') },
    ]

    const getSettingValue = (eventType, channel) => {
      const match = notificationSettings.find((setting) => setting.event_type === eventType && setting.channel === channel)
      return Boolean(match?.enabled)
    }

    const toggleNotification = async (eventType, channel) => {
      const currentValue = getSettingValue(eventType, channel)
      const payload = { event_type: eventType, channel, enabled: !currentValue }
      try {
        const match = notificationSettings.find((setting) => setting.event_type === eventType && setting.channel === channel)
        const updatedSetting = match?.id
          ? await updateVendorNotificationSetting(auth.access, { ...payload, id: match.id })
          : await createVendorNotificationSetting(auth.access, payload)

        setNotificationSettings((current) => {
          const filtered = current.filter((setting) => !(setting.event_type === eventType && setting.channel === channel))
          return [...filtered, updatedSetting]
        })
        setFormSuccess(`Updated ${eventType.replace(/_/g, ' ')} alerts.`)
        setFormError('')
      } catch (error) {
        setFormError(error.message)
      }
    }

    return (
      <div style={{ display: 'grid', gap: '0.9rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #fff8ea, #f5ebdb)', border: '1px solid #ecd8b7', borderRadius: '12px', padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.35rem' }}>{t('vendor.notifications.title','Notifications Center')}</h3>
          <p style={{ margin: 0, color: '#6f7a88' }}>{t('vendor.notifications.subtitle','Choose which alerts you want to receive and through which channels.')}</p>
        </div>

        <div style={{ display: 'grid', gap: '0.8rem' }}>
          {notificationEvents.map((event) => (
            <div key={event.key} style={{ border: '1px solid #ece2d3', borderRadius: '10px', padding: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                <div>
                  <h4 style={{ margin: 0 }}>{event.label}</h4>
                  <p style={{ margin: '0.2rem 0 0', color: '#6f7a88', fontSize: '0.9rem' }}>{event.description}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                {notificationChannels.map((channel) => {
                  const enabled = getSettingValue(event.key, channel.key)
                  return (
                    <label key={`${event.key}-${channel.key}`} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.7rem', border: enabled ? '1px solid #d4a350' : '1px solid #e7dfd3', borderRadius: '999px', background: enabled ? '#fff7e8' : '#fff', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input type="checkbox" checked={enabled} onChange={() => toggleNotification(event.key, channel.key)} />
                      <span>{channel.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderMarketing = () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div className="card" style={{ background: '#fff' }}>
        <h3 style={{ marginTop: 0 }}>{t('vendor.coupons.create','Create coupon')}</h3>
        <form onSubmit={handleCouponSubmit} style={{ display: 'grid', gap: '0.6rem' }}>
          <input name="code" value={couponForm.code} onChange={handleCouponChange} placeholder={t('vendor.coupons.code','Coupon code')} required />
          <input name="description" value={couponForm.description} onChange={handleCouponChange} placeholder={t('vendor.coupons.description','Short description (optional)')} />
          <select name="discount_type" value={couponForm.discount_type} onChange={handleCouponChange}>
            <option value="percentage">{t('vendor.coupons.discountTypes.percentage','Percentage')}</option>
            <option value="fixed">{t('vendor.coupons.discountTypes.fixed','Fixed amount')}</option>
          </select>
          <select name="promotion_type" value={couponForm.promotion_type} onChange={handleCouponChange}>
            <option value="discount">{t('vendor.coupons.promotionTypes.discount','Discount')}</option>
            <option value="buy_one_get_one">{t('vendor.coupons.promotionTypes.buy_one_get_one','Buy One Get One')}</option>
            <option value="flash_sale">{t('vendor.coupons.promotionTypes.flash_sale','Flash Sale')}</option>
          </select>
          {couponForm.promotion_type !== 'buy_one_get_one' && (
            <input name="value" value={couponForm.value} onChange={handleCouponChange} placeholder={t('vendor.coupons.value','Value (percent or amount)')} />
          )}
          <input name="expires_at" type="date" value={couponForm.expires_at} onChange={handleCouponChange} placeholder={t('vendor.coupons.expires','Expiry date')} />
          <input name="usage_limit" type="number" min="0" value={couponForm.usage_limit} onChange={handleCouponChange} placeholder={t('vendor.coupons.usageLimit','Usage limit (0 = unlimited)')} />
          {couponForm.promotion_type === 'buy_one_get_one' && (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <input name="bogo_product" value={couponForm.bogo_product} onChange={handleCouponChange} placeholder={t('vendor.coupons.bogoProduct','BOGO product ID (optional)')} />
              <input name="bogo_quantity" type="number" min="1" value={couponForm.bogo_quantity} onChange={handleCouponChange} placeholder={t('vendor.coupons.bogoQuantity','BOGO quantity')} />
            </div>
          )}
          <button className="button button-primary" type="submit">{t('vendor.coupons.createAction','Create coupon')}</button>
        </form>
        {coupons.length === 0 ? <p style={{ margin: 0, color: '#6f7a88' }}>{t('vendor.coupons.none','No coupons.')}</p> : coupons.map((c) => (
          <div key={c.id} style={{ border: '1px solid #ece2d3', borderRadius: '10px', padding: '0.6rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{c.code}</strong>
              <span className="staff-role-badge">{c.promotion_type}</span>
            </div>
            <div style={{ color: '#6f7a88', marginTop: '0.35rem' }}>
              {c.description || ''} · {c.discount_type || ''} · {c.value || ''}
              {c.expires_at ? ` · Expires: ${new Date(c.expires_at).toLocaleDateString()}` : ''}
              {c.usage_limit ? ` · Limit: ${c.usage_limit}` : ''}
              {c.promotion_type === 'buy_one_get_one' && (c.bogo_product ? ` · BOGO product: ${c.bogo_product}` : ` · BOGO x${c.bogo_quantity || 1}`)}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ background: '#fff' }}>
        <h3 style={{ marginTop: 0 }}>{t('vendor.campaigns.title','Campaigns')}</h3>
        <form onSubmit={handleCampaignSubmit} style={{ display: 'grid', gap: '0.6rem' }}>
          <input name="name" value={campaignForm.name} onChange={handleCampaignChange} placeholder={t('vendor.campaigns.name','Campaign name')} required />
          <select name="campaign_type" value={campaignForm.campaign_type} onChange={handleCampaignChange}>
            <option value="holiday_sale">{t('vendor.campaigns.types.holidaySale','Holiday Sale')}</option>
            <option value="black_friday">{t('vendor.campaigns.types.blackFriday','Black Friday')}</option>
            <option value="back_to_school">{t('vendor.campaigns.types.backToSchool','Back to School')}</option>
            <option value="seasonal">{t('vendor.campaigns.types.seasonal','Seasonal')}</option>
          </select>
          <textarea name="description" value={campaignForm.description} onChange={handleCampaignChange} placeholder={t('vendor.campaigns.description','Description')} rows="2" />
          <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: '1fr 1fr' }}>
            <input name="start_date" type="date" value={campaignForm.start_date} onChange={handleCampaignChange} />
            <input name="end_date" type="date" value={campaignForm.end_date} onChange={handleCampaignChange} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input name="flash_sale" type="checkbox" checked={campaignForm.flash_sale} onChange={(e) => setCampaignForm((c) => ({ ...c, flash_sale: e.target.checked }))} /> {t('vendor.campaigns.flashSale','Flash sale')}
          </label>
          {campaignForm.flash_sale && (
            <input name="discount_percent" type="number" min="0" max="100" value={campaignForm.discount_percent} onChange={handleCampaignChange} placeholder={t('vendor.campaigns.discountPercent','Discount percent for flash sale')} />
          )}
          <button className="button button-primary" type="submit">{t('vendor.campaigns.createAction','Create campaign')}</button>
        </form>
        {campaigns.length === 0 ? <p style={{ margin: 0, color: '#6f7a88' }}>{t('vendor.campaigns.none','No campaigns.')}</p> : campaigns.map((c) => (
          <div key={c.id} style={{ border: '1px solid #ece2d3', borderRadius: '10px', padding: '0.6rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{c.name}</strong>
              <span className="staff-role-badge">{c.campaign_type}</span>
            </div>
            <div style={{ color: '#6f7a88', marginTop: '0.35rem' }}>{c.description || ''}</div>
          </div>
        ))}
      </div>
    </div>
  )

  const handleOrderAction = async (orderId, action) => {
    if (!auth?.access) return
    try {
      const result = await vendorOrderAction(auth.access, { order_id: orderId, action })
      setOrderActionMessage(result.message || 'Order updated successfully.')
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? result.order : order))
      )
    } catch (error) {
      setOrderActionMessage(error.message)
    }
  }

  const handleBulkOrderAction = async (action) => {
    if (!auth?.access || selectedOrderIds.length === 0) return
    try {
      const result = await vendorBulkOrderAction(auth.access, {
        order_ids: selectedOrderIds,
        action,
      })
      setOrderActionMessage(`${result.updated.length} order(s) updated.`)
      setOrders((current) =>
        current.map((order) => {
          const updated = result.updated.find((item) => item.id === order.id)
          return updated || order
        })
      )
      setSelectedOrderIds([])
    } catch (error) {
      setOrderActionMessage(error.message)
    }
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setProductForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleStoreChange = (event) => {
    const { name, value, type, checked } = event.target
    setStoreForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleStoreFileChange = (event) => {
    const { name, files } = event.target
    if (!files || files.length === 0) return
    setStoreForm((current) => ({ ...current, [name]: files[0] }))
  }

  const handleInventoryChange = (event) => {
    const { name, value } = event.target
    setInventoryForm((current) => ({ ...current, [name]: value }))
  }

  const handleWalletRequestChange = (event) => {
    const { name, value } = event.target
    setWalletRequestForm((current) => ({ ...current, [name]: value }))
  }

  const handleWalletRequestSubmit = async (event) => {
    event.preventDefault()
    if (!auth?.access) return

    try {
      const payload = {
        amount: walletRequestForm.amount,
        method: walletRequestForm.method,
        note: walletRequestForm.note,
      }
      const createdRequest = await createVendorPayoutRequest(auth.access, payload)
      setWalletMessage(`Withdrawal request for ${formatCurrency(createdRequest.amount)} submitted.`)
      setWalletRequestForm({ amount: '', method: walletRequestForm.method, note: '' })
      const refreshedWallet = await getVendorWallet(auth.access)
      setWalletData(refreshedWallet || null)
    } catch (error) {
      setWalletMessage(error.message)
    }
  }

  const handleStaffChange = (event) => {
    const { name, value } = event.target
    if (name === 'role') {
      setStaffForm((current) => ({
        ...current,
        role: value,
        permissions: [...staffPermissionCatalog[value]],
      }))
      return
    }
    setStaffForm((current) => ({ ...current, [name]: value }))
  }

  const handleStaffPermissionToggle = (permission) => {
    setStaffForm((current) => {
      const permissions = current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission]
      return { ...current, permissions }
    })
  }

  const handleStaffSubmit = async (event) => {
    event.preventDefault()
    if (!auth?.access) return

    try {
      const payload = {
        email: staffForm.email.trim(),
        role: staffForm.role,
        first_name: staffForm.first_name.trim(),
        last_name: staffForm.last_name.trim(),
        permissions: staffForm.permissions,
      }
      if (staffForm.password) {
        payload.password = staffForm.password
      }

      const created = await createVendorStaff(auth.access, payload)
      setStaffMembers((current) => [created, ...current])
      setStaffForm({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        role: staffForm.role,
        permissions: [...staffPermissionCatalog[staffForm.role]],
      })
      setFormSuccess(`Added ${created.display_name || created.user_email || 'a new staff member'} to your team.`)
      setFormError('')
    } catch (error) {
      setFormError(error.message)
      setFormSuccess('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!auth?.access) return

    try {
      const payload = new FormData()
      const tags = productForm.tags
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      if (tags.length) {
        payload.append('tags', JSON.stringify(tags))
      }

      const additionalImages = productForm.additional_images
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      if (additionalImages.length) {
        payload.append('additional_images', JSON.stringify(additionalImages))
      }

      const variantOptions = {}
      const sizes = productForm.sizes
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      if (sizes.length) variantOptions.size = sizes
      const colors = productForm.colors
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      if (colors.length) variantOptions.color = colors
      const materials = productForm.materials
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      if (materials.length) variantOptions.material = materials
      if (Object.keys(variantOptions).length) {
        payload.append('variant_options', JSON.stringify(variantOptions))
      }

      Object.entries(productForm).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '' || ['tags', 'additional_images', 'sizes', 'colors', 'materials'].includes(key)) return
        if (key === 'image') {
          if (value instanceof File) {
            payload.append(key, value)
          }
          return
        }
        if (key === 'category') {
          if (value) {
            payload.append(key, value)
          }
          return
        }
        payload.append(key, value)
      })
      payload.append('price', productForm.price || '0')
      payload.append('stock', productForm.stock || '0')

      let saved
      if (editingProductId) {
        saved = await updateVendorProduct(auth.access, editingProductId, payload)
        setProducts((current) => current.map((item) => (item.id === saved.id ? saved : item)))
        setFormSuccess(`${saved.name} was updated successfully.`)
      } else {
        saved = await createVendorProduct(auth.access, payload)
        setProducts((current) => [saved, ...current])
        setFormSuccess(`${saved.name} was added to your catalog.`)
      }

      setEditingProductId(null)
      setProductForm(emptyForm)
      setFormError('')
    } catch (error) {
      setFormError(error.message)
      setFormSuccess('')
    }
  }

  const handleEditProduct = (product) => {
    setEditingProductId(product.id)
    setProductForm({
      name: product.name || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      price: product.price || '',
      stock: product.stock || '',
      reserved_stock: product.reserved_stock || '',
      low_stock_threshold: product.low_stock_threshold || '',
      reorder_point: product.reorder_point || '',
      warehouse_code: product.warehouse_code || '',
      warehouse_location: product.warehouse_location || '',
      batch_number: product.batch_number || '',
      batch_expiry_date: product.batch_expiry_date || '',
      description: product.description || '',
      category: product.category || '',
      brand: product.brand || '',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ''),
      seo_title: product.seo_title || '',
      seo_description: product.seo_description || '',
      video_url: product.video_url || '',
      additional_images: Array.isArray(product.additional_images) ? product.additional_images.join(', ') : (product.additional_images || ''),
      sizes: Array.isArray(product.variant_options?.size) ? product.variant_options.size.join(', ') : '',
      colors: Array.isArray(product.variant_options?.color) ? product.variant_options.color.join(', ') : '',
      materials: Array.isArray(product.variant_options?.material) ? product.variant_options.material.join(', ') : '',
      is_featured: product.is_featured || false,
      image: null,
    })
  }

  const handleDeleteProduct = async (productId) => {
    if (!auth?.access) return
    if (!window.confirm('Delete this product?')) return

    try {
      await deleteVendorProduct(auth.access, productId)
      setProducts((current) => current.filter((item) => item.id !== productId))
      setFormSuccess('Product deleted successfully.')
      setFormError('')
    } catch (error) {
      setFormError(error.message)
      setFormSuccess('')
    }
  }

  const handleProductFileChange = (event) => {
    const { name, files } = event.target
    if (!files || files.length === 0) return
    setProductForm((current) => ({ ...current, [name]: files[0] }))
  }

  const handleBulkUpload = async (event) => {
    event.preventDefault()
    if (!auth?.access) return

    const fileInput = event.target.elements.bulk_file
    if (!fileInput?.files?.length) {
      setFormError('Please choose a CSV or XLSX file to upload.')
      setFormSuccess('')
      return
    }

    try {
      const payload = new FormData()
      payload.append('file', fileInput.files[0])
      const response = await bulkUploadVendorProducts(auth.access, payload)
      setProducts((current) => [...response, ...current])
      setFormSuccess('Bulk product upload completed successfully.')
      setFormError('')
      event.target.reset()
    } catch (error) {
      setFormError(error.message)
      setFormSuccess('')
    }
  }

  const handleCustomerGroupToggle = (customerId, group) => {
    setCustomerRecords((current) => {
      const next = current.map((customer) => {
        if (customer.id !== customerId) return customer
        const groups = customer.groups.includes(group)
          ? customer.groups.filter((item) => item !== group)
          : [...customer.groups, group]
        const updated = { ...customer, groups }
        persistCustomer(updated)
        return updated
      })
      return next
    })
  }

  const handleCustomerVipToggle = (customerId) => {
    setCustomerRecords((current) => {
      const next = current.map((customer) => {
        if (customer.id !== customerId) return customer
        const updated = { ...customer, vip: !customer.vip }
        persistCustomer(updated)
        return updated
      })
      return next
    })
  }

  const handleCustomerLoyaltyChange = (customerId, value) => {
    setCustomerRecords((current) => {
      const next = current.map((customer) => {
        if (customer.id !== customerId) return customer
        const updated = { ...customer, loyaltyPoints: Number(value || 0) }
        persistCustomer(updated)
        return updated
      })
      return next
    })
  }

  const handleCustomerNoteAdd = (customerId) => {
    const note = customerNoteDraft.trim()
    if (!note) return
    setCustomerRecords((current) => {
      const next = current.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              notes: [
                ...customer.notes,
                { id: `${customerId}-${Date.now()}`, text: note, createdAt: new Date().toLocaleString() },
              ],
            }
          : customer
      )
      const updated = next.find((c) => c.id === customerId)
      if (updated) persistCustomer(updated)
      return next
    })
    setCustomerNoteDraft('')
  }

  const handleCustomerCommunicationSend = (customerId) => {
    const message = customerMessageDraft.trim()
    if (!message) return
    setCustomerRecords((current) => {
      const next = current.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              communication: [
                ...customer.communication,
                { id: `${customerId}-${Date.now()}`, text: message, createdAt: new Date().toLocaleString() },
              ],
            }
          : customer
      )
      const updated = next.find((c) => c.id === customerId)
      if (updated) persistCustomer(updated)
      return next
    })
    setCustomerMessageDraft('')
  }

  const handleReviewResponseChange = (event) => {
    setReviewResponseDraft(event.target.value)
  }

  const handleReviewReportChange = (event) => {
    setReviewReportDraft(event.target.value)
  }

  const handleReviewResponseSubmit = async (reviewId) => {
    if (!auth?.access || !reviewId) return
    const trimmed = reviewResponseDraft.trim()
    if (!trimmed) return

    try {
      const updated = await respondVendorReview(auth.access, reviewId, { seller_response: trimmed })
      setReviews((current) => current.map((review) => (review.id === updated.id ? updated : review)))
      setReviewAnalytics((current) => ({
        ...current,
        response_rate: current && current.total_reviews ? Number(((current.response_rate * current.total_reviews) + 100) / current.total_reviews).toFixed(1) : 100,
      }))
      setReviewResponseDraft('')
      setFormSuccess('Review response saved.')
      setFormError('')
    } catch (error) {
      setFormError(error.message)
      setFormSuccess('')
    }
  }

  const handleReviewReport = async (reviewId) => {
    if (!auth?.access || !reviewId) return
    const trimmed = reviewReportDraft.trim()
    if (!trimmed) return

    try {
      const updated = await reportVendorReview(auth.access, reviewId, { report_reason: trimmed })
      setReviews((current) => current.map((review) => (review.id === updated.id ? updated : review)))
      setReviewAnalytics((current) => ({
        ...current,
        reported_reviews: current ? current.reported_reviews + 1 : 1,
      }))
      setReviewReportDraft('')
      setFormSuccess('Review reported for moderation.')
      setFormError('')
    } catch (error) {
      setFormError(error.message)
      setFormSuccess('')
    }
  }

  const handleModerateReview = async (reviewId, status) => {
    if (!auth?.access || !reviewId) return
    try {
      const updated = await moderateVendorReview(auth.access, reviewId, { moderation_status: status })
      setReviews((current) => current.map((review) => (review.id === updated.id ? updated : review)))
      setFormSuccess('Review moderation status updated.')
      setFormError('')
    } catch (error) {
      setFormError(error.message)
      setFormSuccess('')
    }
  }

  const handleStoreSubmit = async (event) => {
    event.preventDefault()
    if (!auth?.access) return

    try {
      const payload = new FormData()
      Object.entries(storeForm).forEach(([key, value]) => {
        if (value === undefined || value === null) return
        if (typeof value === 'boolean') {
          payload.append(key, value ? 'true' : 'false')
        } else {
          payload.append(key, value)
        }
      })

      const updated = await updateVendorProfile(auth.access, payload)
      setVendorProfile(updated)
      setFormSuccess('Store settings updated successfully.')
      setFormError('')
    } catch (error) {
      setFormError(error.message)
      setFormSuccess('')
    }
  }

  const persistCustomer = async (customer) => {
    if (!auth?.access) return
    const payload = {
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      notes: customer.notes || [],
      groups: customer.groups || [],
      vip: Boolean(customer.vip),
      loyalty_points: Number(customer.loyaltyPoints || 0),
      communication: customer.communication || [],
    }

    try {
      // attempt update by customer key (we store key in `id` for compatibility)
      await updateVendorCustomer(auth.access, customer.id, payload)
    } catch (err) {
      // if update failed (e.g., record not found), attempt create with customer_key
      try {
        const createPayload = { customer_key: customer.id, ...payload }
        await createVendorCustomer(auth.access, createPayload)
      } catch (createErr) {
        // ignore creation errors for now
      }
    }
  }

  const handleInventorySubmit = async (event) => {
    event.preventDefault()
    if (!auth?.access) return

    try {
      const payload = {
        product_id: Number(inventoryForm.product_id),
        quantity: Number(inventoryForm.quantity),
        reason: inventoryForm.reason,
        note: inventoryForm.note,
      }

      const result = await adjustVendorInventory(auth.access, payload)
      setInventoryForm(emptyInventoryForm)
      setFormSuccess(`Inventory updated: ${result.stock} units available for product #${result.product_id}.`)
      setFormError('')

      const [updatedInventory, updatedProducts] = await Promise.all([
        getVendorInventory(auth.access),
        getVendorProducts(auth.access),
      ])
      setInventory(updatedInventory || null)
      setProducts(updatedProducts || [])
    } catch (error) {
      setFormError(error.message)
      setFormSuccess('')
    }
  }

  if (!auth) {
    return (
      <section style={{ background: '#f7f4ef', minHeight: '70vh', padding: '3rem 1rem' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', background: '#fff', borderRadius: '18px', padding: '2rem', boxShadow: '0 12px 40px rgba(20, 20, 20, 0.08)' }}>
          <p style={{ color: '#a56b3d', fontWeight: 700, marginBottom: '0.4rem' }}>{t('vendor.portalLabel','Supplier portal')}</p>
          <h2 style={{ margin: '0 0 0.5rem' }}>{t('vendor.dashboardTitle','Seller dashboard')}</h2>
          <p style={{ color: '#5d5d5d', marginBottom: '1rem' }}>{t('vendor.signInPrompt','Please sign in to manage your supplier profile.')}</p>
          <Link className="button button-primary" to="/login">{t('vendor.signIn','Sign in')}</Link>
        </div>
      </section>
    )
  }

  const navItems = [
    { id: 'overview', label: t('vendor.nav.overview','Overview') },
    { id: 'inventory', label: t('vendor.nav.inventory','Inventory') },
    { id: 'catalog', label: t('vendor.nav.catalog','Catalog') },
    { id: 'store', label: t('vendor.nav.store','Store') },
    { id: 'orders', label: t('vendor.nav.orders','Orders') },
    { id: 'returns', label: t('vendor.nav.returns','Returns & Refunds') },
    { id: 'finance', label: t('vendor.nav.finance','Finance') },
    { id: 'wallet', label: t('vendor.nav.wallet','Wallet') },
    { id: 'reviews', label: t('vendor.nav.reviews','Reviews') },
    { id: 'installments', label: t('vendor.nav.installments','Installments') },
    { id: 'marketing', label: t('vendor.nav.marketing','Marketing') },
    { id: 'advertising', label: t('vendor.nav.advertising','Advertising') },
    { id: 'analytics', label: t('vendor.nav.analytics','Analytics') },
    { id: 'messages', label: t('vendor.nav.messages','Messages') },
    { id: 'notifications', label: t('vendor.nav.notifications','Notifications') },
    { id: 'customers', label: t('vendor.nav.customers','Customers') },
    { id: 'staff', label: t('vendor.nav.staff','Staff') },
  ]

  const staffRoleOptions = Object.entries(staffRoleMeta).map(([value, meta]) => ({
    value,
    label: t(`vendor.roles.${value}.label`, meta.label),
    description: t(`vendor.roles.${value}.description`, meta.description),
    permissions: staffPermissionCatalog[value],
  }))

  const selectedStaffRole = staffRoleOptions.find((option) => option.value === staffForm.role) || staffRoleOptions[0]

  const pendingOrders = orders.filter((order) =>
    ['pending', 'processing', 'confirmed'].includes(String(order.status || '').toLowerCase())
  )
  const completedOrders = orders.filter((order) =>
    String(order.status || '').toLowerCase() === 'completed'
  )
  const totalSales = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
  const averageOrderValue = completedOrders.length > 0 ? totalSales / completedOrders.length : 0
  const lowStockProducts = products.filter((product) => Number(product.stock || 0) <= 10)

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, index) => (
      <span key={index} style={{ color: index < Number(rating || 0) ? '#d4a350' : '#d8d8d8' }}>
        {index < Number(rating || 0) ? '★' : '☆'}
      </span>
    ))

  const renderOverview = () => (
    <>
      <div className="dashboard-grid" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', marginBottom: '1rem' }}>
        <div className="card" style={{ background: '#fff', borderTop: '4px solid #1d2a3a' }}>
          <p style={{ margin: '0 0 0.3rem', color: '#6f7a88' }}>{t('vendor.overview.totalSales','Total sales')}</p>
          <h3 style={{ margin: 0 }}>{formatCurrency(totalSales)}</h3>
        </div>
        <div className="card" style={{ background: '#fff', borderTop: '4px solid #c86b3c' }}>
          <p style={{ margin: '0 0 0.3rem', color: '#6f7a88' }}>{t('vendor.overview.orders','Orders')}</p>
          <h3 style={{ margin: 0 }}>{orders.length}</h3>
        </div>
        <div className="card" style={{ background: '#fff', borderTop: '4px solid #2f5d50' }}>
          <p style={{ margin: '0 0 0.3rem', color: '#6f7a88' }}>{t('vendor.overview.pending','Pending')}</p>
          <h3 style={{ margin: 0 }}>{pendingOrders.length}</h3>
        </div>
        <div className="card" style={{ background: '#fff', borderTop: '4px solid #d4a350' }}>
          <p style={{ margin: '0 0 0.3rem', color: '#6f7a88' }}>{t('vendor.overview.avgOrder','Avg. order')}</p>
          <h3 style={{ margin: 0 }}>{formatCurrency(averageOrderValue)}</h3>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="card" style={{ background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ marginTop: 0 }}>Sales overview</h3>
            <span style={{ color: '#2f5d50', fontWeight: 700 }}>+12.4%</span>
          </div>
          <div style={{ display: 'grid', gap: '0.7rem' }}>
            <div style={{ background: 'linear-gradient(90deg, #f7f3e9 0%, #eef7f2 100%)', borderRadius: '12px', padding: '1rem' }}>
              <p style={{ margin: 0, color: '#6f7a88' }}>{t('vendor.overview.thisWeek','This week')}</p>
              <h2 style={{ margin: '0.3rem 0 0' }}>{formatCurrency(totalSales)}</h2>
            </div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {[42, 58, 37, 71, 64].map((value, index) => (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#6f7a88', marginBottom: '0.3rem' }}>
                    <span>{t('vendor.overview.day','Day')} {index + 1}</span>
                    <span>{value}%</span>
                  </div>
                  <div style={{ background: '#eef1f4', height: '8px', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${value}%`, background: 'linear-gradient(90deg, #1d2a3a 0%, #2f5d50 100%)', height: '100%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ background: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>{t('vendor.overview.inventoryAlerts','Inventory alerts')}</h3>
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {lowStockProducts.length > 0 ? (
              lowStockProducts.slice(0, 5).map((product) => (
                <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff9f2', borderRadius: '10px', padding: '0.65rem 0.75rem' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{product.name}</p>
                    <span style={{ fontSize: '0.85rem', color: '#8d5a3d' }}>{product.stock} {t('vendor.overview.left','left')}</span>
                  </div>
                  <button className="button button-secondary" onClick={() => setActiveSection('inventory')}>{t('vendor.actions.restock','Restock')}</button>
                </div>
              ))
            ) : (
              <p style={{ margin: 0, color: '#6f7a88' }}>{t('vendor.overview.noInventoryAlerts','No inventory alerts right now.')}</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1.1fr 1fr', marginTop: '1rem' }}>
        <div className="card" style={{ background: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>{t('vendor.overview.topProducts','Top products')}</h3>
          <div style={{ display: 'grid', gap: '0.7rem' }}>
            {products.slice(0, 5).map((product, index) => (
              <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{index + 1}. {product.name}</p>
                  <span style={{ color: '#6f7a88', fontSize: '0.88rem' }}>{product.stock} {t('vendor.overview.inStock','in stock')}</span>
                </div>
                <span style={{ fontWeight: 700 }}>{formatCurrency(product.price)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ background: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>{t('vendor.overview.recentActivity','Recent activity')}</h3>
          <div style={{ display: 'grid', gap: '0.65rem' }}>
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fb', borderRadius: '10px', padding: '0.65rem 0.75rem' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{order.order_number || `Order #${order.id}`}</p>
                  <span style={{ color: '#6f7a88', fontSize: '0.85rem' }}>{order.status || t('vendor.overview.unknown','Unknown')} · {order.payment_status || t('vendor.overview.pending','Pending')}</span>
                </div>
                <span style={{ fontWeight: 700 }}>{formatCurrency(order.total_amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )

  const renderInventory = () => (
    <div className="card" style={{ background: '#fff' }}>
      <h3 style={{ marginTop: 0 }}>{t('vendor.inventory.adjust','Adjust inventory')}</h3>
      <form onSubmit={handleInventorySubmit}>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <select name="product_id" value={inventoryForm.product_id} onChange={handleInventoryChange} required>
            <option value="">{t('vendor.inventory.selectProduct','Select product')}</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.name} ({t('vendor.inventory.available','Available')}: {product.available_stock} · {t('vendor.inventory.reserved','Reserved')}: {product.reserved_stock || 0})</option>
            ))}
          </select>
          <input name="quantity" type="number" value={inventoryForm.quantity} onChange={handleInventoryChange} placeholder={t('vendor.inventory.quantityPlaceholder','Quantity change (e.g. -2 or 5)')} required />
          <select name="reason" value={inventoryForm.reason} onChange={handleInventoryChange}>
            <option value="manual_adjustment">{t('vendor.inventory.reason.manual','Manual adjustment')}</option>
            <option value="restock">{t('vendor.inventory.reason.restock','Restock')}</option>
            <option value="sale">{t('vendor.inventory.reason.sale','Sale')}</option>
            <option value="return">{t('vendor.inventory.reason.return','Return')}</option>
            <option value="damaged">{t('vendor.inventory.reason.damaged','Damaged')}</option>
            <option value="reserve">{t('vendor.inventory.reason.reserve','Reserve stock')}</option>
            <option value="release">{t('vendor.inventory.reason.release','Release reservation')}</option>
            <option value="other">{t('vendor.inventory.reason.other','Other')}</option>
          </select>
          <textarea name="note" value={inventoryForm.note} onChange={handleInventoryChange} placeholder={t('vendor.inventory.optionalNote','Optional note')} rows="2" />
          <button className="button button-primary" type="submit">{t('vendor.inventory.updateStock','Update stock')}</button>
        </div>
      </form>
    </div>
  )

  const renderCatalog = () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
        <div className="card" style={{ background: '#fff' }}>
        <h3 style={{ marginTop: 0 }}>{editingProductId ? t('vendor.catalog.editProduct','Edit product') : t('vendor.catalog.addProduct','Add new product')}</h3>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <input name="name" value={productForm.name} onChange={handleChange} placeholder={t('vendor.catalog.productName','Product name')} required />
            <input name="sku" value={productForm.sku} onChange={handleChange} placeholder={t('vendor.catalog.sku','SKU')} />
            <input name="barcode" value={productForm.barcode} onChange={handleChange} placeholder={t('vendor.catalog.barcode','Barcode')} />
            <input name="price" type="number" min="0" step="0.01" value={productForm.price} onChange={handleChange} placeholder={t('vendor.catalog.price','Price')} required />
            <input name="stock" type="number" min="0" step="1" value={productForm.stock} onChange={handleChange} placeholder={t('vendor.catalog.stock','Stock')} required />
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 1fr' }}>
              <input name="reserved_stock" type="number" min="0" step="1" value={productForm.reserved_stock} onChange={handleChange} placeholder={t('vendor.catalog.reservedStock','Reserved stock')} />
              <input name="low_stock_threshold" type="number" min="0" step="1" value={productForm.low_stock_threshold} onChange={handleChange} placeholder={t('vendor.catalog.lowStockThreshold','Low stock threshold')} />
            </div>
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 1fr' }}>
              <input name="reorder_point" type="number" min="0" step="1" value={productForm.reorder_point} onChange={handleChange} placeholder={t('vendor.catalog.reorderPoint','Reorder point')} />
              <input name="warehouse_code" value={productForm.warehouse_code} onChange={handleChange} placeholder={t('vendor.catalog.warehouseCode','Warehouse code')} />
            </div>
            <input name="warehouse_location" value={productForm.warehouse_location} onChange={handleChange} placeholder={t('vendor.catalog.warehouseLocation','Warehouse location')} />
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 1fr' }}>
              <input name="batch_number" value={productForm.batch_number} onChange={handleChange} placeholder={t('vendor.catalog.batchNumber','Batch number')} />
              <input name="batch_expiry_date" type="date" value={productForm.batch_expiry_date} onChange={handleChange} placeholder={t('vendor.catalog.batchExpiry','Batch expiry')} />
            </div>
            <input name="category" type="number" value={productForm.category} onChange={handleChange} placeholder={t('vendor.catalog.categoryId','Category ID (optional)')} />
            <input name="brand" value={productForm.brand} onChange={handleChange} placeholder={t('vendor.catalog.brand','Brand')} />
            <input name="tags" value={productForm.tags} onChange={handleChange} placeholder={t('vendor.catalog.tags','Tags (comma separated)')} />
            <input name="seo_title" value={productForm.seo_title} onChange={handleChange} placeholder={t('vendor.catalog.seoTitle','SEO title')} />
            <textarea name="seo_description" value={productForm.seo_description} onChange={handleChange} placeholder={t('vendor.catalog.seoDescription','SEO description')} rows="2" />
            <input name="video_url" value={productForm.video_url} onChange={handleChange} placeholder={t('vendor.catalog.videoUrl','Video URL')} />
            <input name="additional_images" value={productForm.additional_images} onChange={handleChange} placeholder={t('vendor.catalog.additionalImages','Additional image URLs (comma separated)')} />
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 1fr 1fr' }}>
              <input name="sizes" value={productForm.sizes} onChange={handleChange} placeholder={t('vendor.catalog.sizes','Sizes (comma separated)')} />
              <input name="colors" value={productForm.colors} onChange={handleChange} placeholder={t('vendor.catalog.colors','Colors (comma separated)')} />
              <input name="materials" value={productForm.materials} onChange={handleChange} placeholder={t('vendor.catalog.materials','Materials (comma separated)')} />
            </div>
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 1fr' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input name="is_featured" type="checkbox" checked={productForm.is_featured} onChange={handleChange} />
                {t('vendor.catalog.featuredProduct','Featured product')}
              </label>
              <input name="image" type="file" accept="image/*" onChange={handleProductFileChange} />
            </div>
            <textarea name="description" value={productForm.description} onChange={handleChange} placeholder={t('vendor.catalog.shortDescription','Short product description')} rows="4" />
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="button button-primary" type="submit">{editingProductId ? t('vendor.catalog.saveChanges','Save changes') : t('vendor.catalog.createProduct','Create product')}</button>
              {editingProductId && (
                <button type="button" className="button button-secondary" onClick={() => { setEditingProductId(null); setProductForm(emptyForm); }}>{t('common.cancel','Cancel')}</button>
              )}
            </div>
          </div>
        </form>
      </div>

        <div className="card" style={{ background: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>{t('vendor.catalog.bulkUpload','Bulk upload products')}</h3>
        <form onSubmit={handleBulkUpload}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <input name="bulk_file" type="file" accept=".csv,.xlsx" />
            <button className="button button-primary" type="submit">{t('vendor.catalog.uploadCsv','Upload CSV / Excel')}</button>
          </div>
        </form>
      </div>

      <div className="card" style={{ background: '#fff' }}>
        <h3 style={{ marginTop: 0 }}>{t('vendor.catalog.catalogTitle','Product catalog')}</h3>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {products.length === 0 ? (
            <p style={{ margin: 0, color: '#6f7a88' }}>{t('vendor.catalog.noProducts','No products found.')}</p>
          ) : (
            products.map((product) => (
              <div key={product.id} style={{ display: 'grid', gap: '0.5rem', borderBottom: '1px solid #e8e8e8', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div>
                    <p style={{ margin: '0 0 0.3rem', fontWeight: 700 }}>{product.name}</p>
                    <p style={{ margin: 0, color: '#6f7a88' }}>
                      SKU: {product.sku || '—'} · Barcode: {product.barcode || '—'} · Available: {product.available_stock} · Reserved: {product.reserved_stock || 0}
                    </p>
                    <p style={{ margin: 0, color: '#6f7a88' }}>
                      Warehouse: {product.warehouse_code || 'N/A'} / {product.warehouse_location || 'Unknown'} · Batch: {product.batch_number || 'N/A'}{product.batch_expiry_date ? ` · Expiry: ${product.batch_expiry_date}` : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="button button-secondary" type="button" onClick={() => handleEditProduct(product)}>{t('common.edit','Edit')}</button>
                    <button className="button button-danger" type="button" onClick={() => handleDeleteProduct(product.id)}>{t('common.delete','Delete')}</button>
                  </div>
                </div>
                <p style={{ margin: 0, color: '#4f5b67' }}>{product.description || t('vendor.catalog.noDescription','No description available.')}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )

  const renderStoreSettings = () => (
    <div className="card" style={{ background: '#fff' }}>
      <h3 style={{ marginTop: 0 }}>{t('vendor.store.title','Store management')}</h3>
      <form onSubmit={handleStoreSubmit} encType="multipart/form-data">
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          <div style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: '1fr 1fr' }}>
            <input name="store_name" value={storeForm.store_name} onChange={handleStoreChange} placeholder={t('vendor.store.storeName','Store name')} />
            <input name="contact_email" type="email" value={storeForm.contact_email} onChange={handleStoreChange} placeholder={t('vendor.store.contactEmail','Contact email')} />
          </div>
          <div style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: '1fr 1fr' }}>
            <input name="contact_phone" value={storeForm.contact_phone} onChange={handleStoreChange} placeholder={t('vendor.store.contactPhone','Contact phone')} />
            <input name="physical_address" value={storeForm.physical_address} onChange={handleStoreChange} placeholder={t('vendor.store.physicalAddress','Physical address')} />
          </div>
          <div style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: '1fr 1fr' }}>
            <input name="city" value={storeForm.city} onChange={handleStoreChange} placeholder={t('vendor.store.city','City')} />
            <input name="country" value={storeForm.country} onChange={handleStoreChange} placeholder={t('vendor.store.country','Country')} />
          </div>
          <input name="website_url" value={storeForm.website_url} onChange={handleStoreChange} placeholder={t('vendor.store.websiteUrl','Website URL')} />
          <div style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: '1fr 1fr 1fr' }}>
            <input name="facebook_url" value={storeForm.facebook_url} onChange={handleStoreChange} placeholder={t('vendor.store.facebookUrl','Facebook URL')} />
            <input name="instagram_url" value={storeForm.instagram_url} onChange={handleStoreChange} placeholder={t('vendor.store.instagramUrl','Instagram URL')} />
            <input name="twitter_url" value={storeForm.twitter_url} onChange={handleStoreChange} placeholder={t('vendor.store.twitterUrl','Twitter URL')} />
          </div>
          <input name="whatsapp_url" value={storeForm.whatsapp_url} onChange={handleStoreChange} placeholder={t('vendor.store.whatsappUrl','WhatsApp URL')} />
          <textarea name="description" value={storeForm.description} onChange={handleStoreChange} placeholder={t('vendor.store.description','Store description')} rows="4" />
          <div style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem' }}>{t('vendor.store.logoLabel','Store logo')}</label>
              <input name="store_logo" type="file" accept="image/*" onChange={handleStoreFileChange} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem' }}>{t('vendor.store.bannerLabel','Store banner')}</label>
              <input name="store_banner" type="file" accept="image/*" onChange={handleStoreFileChange} />
            </div>
          </div>
          {vendorProfile?.store_logo && (
            <img src={vendorProfile.store_logo} alt={t('vendor.store.logoAlt','Store logo')} style={{ maxWidth: '180px', borderRadius: '10px' }} />
          )}
          {vendorProfile?.store_banner && (
            <img src={vendorProfile.store_banner} alt={t('vendor.store.bannerAlt','Store banner')} style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '10px' }} />
          )}
          <textarea name="store_policies" value={storeForm.store_policies} onChange={handleStoreChange} placeholder={t('vendor.store.storePolicies','Store policies')} rows="4" />
          <textarea name="shipping_policy" value={storeForm.shipping_policy} onChange={handleStoreChange} placeholder={t('vendor.store.shippingPolicy','Shipping policy')} rows="4" />
          <textarea name="return_policy" value={storeForm.return_policy} onChange={handleStoreChange} placeholder={t('vendor.store.returnPolicy','Return policy')} rows="4" />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <input name="vacation_mode" type="checkbox" checked={storeForm.vacation_mode} onChange={handleStoreChange} />
            {t('vendor.store.vacationMode','Put store on vacation mode')}
          </label>
          <button className="button button-primary" type="submit">{t('vendor.store.saveSettings','Save store settings')}</button>
        </div>
      </form>
    </div>
  )

  const renderStaffManagement = () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div className="card" style={{ background: '#fff' }}>
        <h3 style={{ marginTop: 0 }}>{t('vendor.staff.addMember','Add a staff member')}</h3>
        <form onSubmit={handleStaffSubmit}>
          <div className="staff-form-grid">
            <input name="first_name" value={staffForm.first_name} onChange={handleStaffChange} placeholder={t('vendor.staff.firstName','First name')} />
            <input name="last_name" value={staffForm.last_name} onChange={handleStaffChange} placeholder={t('vendor.staff.lastName','Last name')} />
            <input name="email" type="email" value={staffForm.email} onChange={handleStaffChange} placeholder={t('vendor.staff.emailAddress','Email address')} required />
            <input name="password" type="password" value={staffForm.password} onChange={handleStaffChange} placeholder={t('vendor.staff.temporaryPassword','Temporary password (optional)')} />
          </div>

          <div className="staff-role-grid">
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>{t('vendor.staff.role','Role')}</label>
              <select name="role" value={staffForm.role} onChange={handleStaffChange}>
                {staffRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p style={{ margin: '0.65rem 0 0', color: '#6f7a88' }}>{selectedStaffRole.description}</p>
            </div>
            <div className="staff-permissions-card">
              <p>{t('vendor.staff.permissionLabel','Choose permissions for this role')}</p>
              <div className="staff-permission-list">
                {selectedStaffRole.permissions.map((permission) => (
                  <label key={permission} className="staff-permission-pill" style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={staffForm.permissions.includes(permission)}
                      onChange={() => handleStaffPermissionToggle(permission)}
                      style={{ marginRight: '0.4rem' }}
                    />
                    {permission}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <button className="button button-primary" type="submit" style={{ marginTop: '0.85rem' }}>{t('vendor.staff.createAccount','Create staff account')}</button>
        </form>
      </div>

      <div className="card" style={{ background: '#fff' }}>
        <h3 style={{ marginTop: 0 }}>{t('vendor.staff.currentTeam','Current team')}</h3>
        {staffMembers.length === 0 ? (
          <p style={{ margin: 0, color: '#6f7a88' }}>{t('vendor.staff.noMembers','No staff members yet. Create the first team account for your store.')}</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {staffMembers.map((member) => (
              <div key={member.id} className="staff-list-item">
                <div className="staff-list-item-header">
                  <div>
                    <strong>{member.display_name || member.user_email || 'Staff member'}</strong>
                    <div style={{ color: '#6f7a88', fontSize: '0.9rem' }}>{member.user_email || 'Email pending'}</div>
                  </div>
                  <span className="staff-role-badge">{staffRoleOptions.find((option) => option.value === member.role)?.label || member.role}</span>
                </div>
                <div className="staff-permission-list">
                  {(member.permissions || []).map((permission) => (
                    <span key={permission} className="staff-permission-pill">{permission}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderCustomerManagement = () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div className="card" style={{ background: '#fff' }}>
        <h3 style={{ marginTop: 0 }}>{t('vendor.customer.title','Customer management')}</h3>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <input
            value={customerSearch}
            onChange={(event) => setCustomerSearch(event.target.value)}
            placeholder={t('vendor.customer.searchPlaceholder','Search customers by name, email, or phone')}
          />
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {customerRecords.filter((customer) => {
              const haystack = `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase()
              return haystack.includes(customerSearch.toLowerCase())
            }).map((customer) => (
              <button
                key={customer.id}
                type="button"
                className={selectedCustomerId === customer.id ? 'vendor-nav-btn active' : 'vendor-nav-btn'}
                onClick={() => setSelectedCustomerId(customer.id)}
                style={{ textAlign: 'left' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
                  <span>{customer.name}</span>
                  {customer.vip && <span className="staff-role-badge">{t('vendor.customer.vipBadge','VIP')}</span>}
                </div>
                <div style={{ color: '#6f7a88', fontSize: '0.85rem', marginTop: '0.25rem' }}>{customer.email || customer.phone}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedCustomerId && (() => {
        const customer = customerRecords.find((item) => item.id === selectedCustomerId)
        if (!customer) return null
        return (
          <div className="card" style={{ background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0 }}>{customer.name}</h3>
                <p style={{ margin: '0.25rem 0 0', color: '#6f7a88' }}>{customer.email || customer.phone}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <label className="staff-permission-pill" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={customer.vip} onChange={() => handleCustomerVipToggle(customer.id)} style={{ marginRight: '0.4rem' }} />
                  {t('vendor.customer.vipCustomer','VIP customer')}
                </label>
                <label style={{ color: '#6f7a88', fontSize: '0.9rem' }}>
                  Loyalty points
                  <input type="number" value={customer.loyaltyPoints} onChange={(event) => handleCustomerLoyaltyChange(customer.id, event.target.value)} style={{ marginLeft: '0.4rem', width: '88px' }} />
                </label>
              </div>
            </div>

            <div className="staff-role-grid">
              <div className="staff-permissions-card">
                <p>{t('vendor.customer.groupsTitle','Customer groups')}</p>
                <div className="staff-permission-list">
                  {customerGroupOptions.map((group) => (
                    <label key={group} className="staff-permission-pill" style={{ cursor: 'pointer' }}>
                      <input type="checkbox" checked={customer.groups.includes(group)} onChange={() => handleCustomerGroupToggle(customer.id, group)} style={{ marginRight: '0.4rem' }} />
                      {group}
                    </label>
                  ))}
                </div>
              </div>
              <div className="staff-permissions-card">
                <p>{t('vendor.customer.purchaseSummary','Purchase summary')}</p>
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  <div><strong>{t('vendor.customer.totalSpent','Total spent:')}</strong> {formatCurrency(customer.totalSpent)}</div>
                  <div><strong>{t('vendor.customer.orders','Orders:')}</strong> {customer.orders.length}</div>
                  <div><strong>{t('vendor.customer.lastOrder','Last order:')}</strong> {customer.orders[0]?.orderNumber || t('vendor.customer.noOrdersYet','No orders yet')}</div>
                </div>
              </div>
            </div>

            <div className="staff-role-grid">
              <div className="staff-permissions-card">
                <p>{t('vendor.customer.purchaseHistory','Purchase history')}</p>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {customer.orders.length === 0 ? (
                    <p style={{ margin: 0, color: '#6f7a88' }}>{t('vendor.customer.noPurchases','No purchases yet.')}</p>
                  ) : (
                    customer.orders.map((order) => (
                      <div key={order.id} style={{ borderBottom: '1px solid #ece2d3', paddingBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <strong>{order.orderNumber}</strong>
                          <span>{formatCurrency(order.total)}</span>
                        </div>
                        <div style={{ color: '#6f7a88', fontSize: '0.85rem' }}>{order.status} · {order.purchasedAt || t('vendor.customer.recentPurchase','Recent purchase')}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="staff-permissions-card">
                <p>{t('vendor.customer.notesTitle','Customer notes')}</p>
                <textarea value={customerNoteDraft} onChange={(event) => setCustomerNoteDraft(event.target.value)} placeholder={t('vendor.customer.addNotePlaceholder','Add a note about this customer')} rows="3" />
                <button className="button button-primary" type="button" onClick={() => handleCustomerNoteAdd(customer.id)} style={{ marginTop: '0.6rem' }}>{t('vendor.customer.saveNote','Save note')}</button>
                <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.7rem' }}>
                  {customer.notes.length === 0 ? (
                    <p style={{ margin: 0, color: '#6f7a88' }}>{t('vendor.customer.noNotes','No notes yet.')}</p>
                  ) : (
                    customer.notes.map((note) => (
                      <div key={note.id} style={{ background: '#fff', borderRadius: '10px', padding: '0.55rem 0.65rem', border: '1px solid #ece2d3' }}>
                        <div style={{ color: '#6f7a88', fontSize: '0.8rem', marginBottom: '0.2rem' }}>{note.createdAt}</div>
                        <div>{note.text}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="staff-permissions-card">
              <p>{t('vendor.customer.communicationTitle','Customer communication')}</p>
              <textarea value={customerMessageDraft} onChange={(event) => setCustomerMessageDraft(event.target.value)} placeholder={t('vendor.customer.communicationPlaceholder','Send a follow-up or thank-you message')} rows="3" />
              <button className="button button-primary" type="button" onClick={() => handleCustomerCommunicationSend(customer.id)} style={{ marginTop: '0.6rem' }}>{t('vendor.customer.sendMessage','Send message')}</button>
              <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.7rem' }}>
                {customer.communication.length === 0 ? (
                  <p style={{ margin: 0, color: '#6f7a88' }}>{t('vendor.customer.noCommunications','No communications recorded yet.')}</p>
                ) : (
                  customer.communication.map((entry) => (
                    <div key={entry.id} style={{ background: '#fff', borderRadius: '10px', padding: '0.55rem 0.65rem', border: '1px solid #ece2d3' }}>
                      <div style={{ color: '#6f7a88', fontSize: '0.8rem', marginBottom: '0.2rem' }}>{entry.createdAt}</div>
                      <div>{entry.text}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      })()}
      </div>
  )

  const renderWallet = () => {
    const transactions = Array.isArray(walletData?.transactions) ? walletData.transactions : []
    const withdrawalRequests = Array.isArray(walletData?.withdrawal_requests) ? walletData.withdrawal_requests : []

    return (
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div className="card" style={{ background: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>{t('vendor.wallet.overview','Wallet overview')}</h3>
          <div style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {[
              [t('vendor.wallet.currentBalance','Current balance'), walletData?.current_balance],
              [t('vendor.wallet.pendingBalance','Pending balance'), walletData?.pending_balance],
              [t('vendor.wallet.withdrawableBalance','Withdrawable balance'), walletData?.withdrawable_balance],
            ].map(([label, value]) => (
              <div key={label} style={{ background: '#f9f5eb', borderRadius: '12px', padding: '0.9rem' }}>
                <p style={{ margin: 0, color: '#6f7a88' }}>{label}</p>
                <h3 style={{ margin: '0.35rem 0 0' }}>{formatCurrency(value)}</h3>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ background: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>{t('vendor.wallet.requestWithdrawal','Request a withdrawal')}</h3>
          {walletMessage && <div style={{ marginBottom: '0.75rem', color: '#2f5d50', fontWeight: 600 }}>{walletMessage}</div>}
          <form onSubmit={handleWalletRequestSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
            <input name="amount" type="number" min="0" step="0.01" value={walletRequestForm.amount} onChange={handleWalletRequestChange} placeholder={t('vendor.wallet.amount','Amount')} required />
            <select name="method" value={walletRequestForm.method} onChange={handleWalletRequestChange}>
              <option value="mpesa">{t('vendor.wallet.method.mpesa','M-Pesa')}</option>
              <option value="bank">{t('vendor.wallet.method.bank','Bank transfer')}</option>
            </select>
            <textarea name="note" value={walletRequestForm.note} onChange={handleWalletRequestChange} placeholder={t('vendor.wallet.optionalNote','Optional note')} rows="3" />
            <button className="button button-primary" type="submit">{t('vendor.wallet.submitRequest','Submit request')}</button>
          </form>
        </div>

        <div className="card" style={{ background: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>{t('vendor.wallet.transactionHistory','Transaction history')}</h3>
          {transactions.length === 0 ? (
            <p style={{ margin: 0, color: '#6f7a88' }}>{t('vendor.wallet.noTransactions','No transactions recorded yet.')}</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              {transactions.map((transaction) => (
                <div key={transaction.id} style={{ border: '1px solid #ece2d3', borderRadius: '10px', padding: '0.7rem 0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <strong>{transaction.type}</strong>
                    <span>{formatCurrency(transaction.amount)}</span>
                  </div>
                  <div style={{ color: '#6f7a88', fontSize: '0.9rem', marginTop: '0.25rem' }}>{transaction.reason || t('vendor.wallet.noReason','No reason')} · {transaction.created_at ? new Date(transaction.created_at).toLocaleString() : t('vendor.wallet.recent','Recent')}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ background: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>{t('vendor.wallet.withdrawalRequests','Withdrawal requests')}</h3>
          {withdrawalRequests.length === 0 ? (
            <p style={{ margin: 0, color: '#6f7a88' }}>{t('vendor.wallet.noWithdrawalRequests','No withdrawal requests yet.')}</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              {withdrawalRequests.map((request) => (
                <div key={request.id} style={{ border: '1px solid #ece2d3', borderRadius: '10px', padding: '0.7rem 0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <strong>{formatCurrency(request.amount)}</strong>
                    <span className="staff-role-badge">{request.status}</span>
                  </div>
                  <div style={{ color: '#6f7a88', fontSize: '0.9rem', marginTop: '0.25rem' }}>{request.method} · {request.requested_at ? new Date(request.requested_at).toLocaleString() : t('vendor.wallet.requested','Requested')}</div>
                  {request.note ? <div style={{ color: '#4f5b67', marginTop: '0.25rem' }}>{request.note}</div> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderReviews = () => {
    const analytics = reviewAnalytics || {}
    const breakdown = analytics.rating_breakdown || {}
    const totalReviews = Number(analytics.total_reviews || 0)
    const averageRating = Number(analytics.average_rating || 0)
    const responseRate = Number(analytics.response_rate || 0)
    const reportedReviews = Number(analytics.reported_reviews || 0)

    return (
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div className="card" style={{ background: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>{t('vendor.reviews.title','Reviews & ratings')}</h3>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <div style={{ background: '#f8f3ea', borderRadius: '12px', padding: '0.95rem' }}>
              <p style={{ margin: 0, color: '#6f7a88' }}>Average rating</p>
              <h2 style={{ margin: '0.35rem 0 0' }}>{averageRating.toFixed(1)} / 5</h2>
            </div>
            <div style={{ background: '#f6fbf8', borderRadius: '12px', padding: '0.95rem' }}>
              <p style={{ margin: 0, color: '#6f7a88' }}>Total reviews</p>
              <h2 style={{ margin: '0.35rem 0 0' }}>{totalReviews}</h2>
            </div>
            <div style={{ background: '#fff8ef', borderRadius: '12px', padding: '0.95rem' }}>
              <p style={{ margin: 0, color: '#6f7a88' }}>Response rate</p>
              <h2 style={{ margin: '0.35rem 0 0' }}>{responseRate.toFixed(1)}%</h2>
            </div>
            <div style={{ background: '#fff4f4', borderRadius: '12px', padding: '0.95rem' }}>
              <p style={{ margin: 0, color: '#6f7a88' }}>Flagged reviews</p>
              <h2 style={{ margin: '0.35rem 0 0' }}>{reportedReviews}</h2>
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'grid', gap: '0.45rem' }}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = Number(breakdown[star] || 0)
              const width = totalReviews ? `${(count / totalReviews) * 100}%` : '0%'
              return (
                <div key={star}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#6f7a88', marginBottom: '0.25rem' }}>
                    <span>{star}★</span>
                    <span>{count}</span>
                  </div>
                  <div style={{ background: '#eef1f4', height: '8px', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width, background: 'linear-gradient(90deg, #1d2a3a 0%, #d4a350 100%)', height: '100%' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card" style={{ background: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>{t('vendor.reviews.customerFeedback','Customer feedback')}</h3>
          {reviews.length === 0 ? (
            <p style={{ margin: 0, color: '#6f7a88' }}>{t('vendor.reviews.noReviews','No reviews have been left for your store yet.')}</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {reviews.map((review) => (
                <div key={review.id} style={{ border: '1px solid #e8e8e8', borderRadius: '12px', padding: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ margin: '0 0 0.2rem', fontWeight: 700 }}>{review.buyer_name || 'Buyer'}</p>
                      <p style={{ margin: 0, color: '#6f7a88' }}>{review.order_number || `Order #${review.order_id}`}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span className="staff-role-badge">{review.moderation_status || 'visible'}</span>
                      {review.reported ? <span className="staff-role-badge" style={{ background: '#fff4f4', color: '#b33d3d' }}>{t('vendor.reviews.flagged','Flagged')}</span> : null}
                    </div>
                  </div>
                  <div style={{ marginTop: '0.45rem', color: '#d4a350', letterSpacing: '0.08em' }}>{renderStars(review.seller_rating || review.product_rating || 0)}</div>
                  <p style={{ margin: '0.55rem 0', color: '#4f5b67' }}>{review.comment || t('vendor.reviews.noComment','No comment provided.')}</p>
                  {review.seller_response ? (
                    <div style={{ background: '#f8f3ea', borderRadius: '10px', padding: '0.6rem 0.7rem', marginBottom: '0.6rem' }}>
                      <strong>{t('vendor.reviews.sellerResponseLabel','Seller response:')}</strong> {review.seller_response}
                    </div>
                  ) : null}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    <button className="button button-secondary" type="button" onClick={() => { setSelectedReviewId(review.id); setReviewResponseDraft(review.seller_response || ''); setReviewReportDraft(''); }}>
                      {t('vendor.reviews.reply','Reply')}
                    </button>
                    <button className="button button-secondary" type="button" onClick={() => { setSelectedReviewId(review.id); setReviewResponseDraft(''); setReviewReportDraft(''); }}>
                      {t('vendor.reviews.report','Report')}
                    </button>
                    <button className="button button-secondary" type="button" onClick={() => handleModerateReview(review.id, 'visible')}>{t('vendor.reviews.visible','Visible')}</button>
                    <button className="button button-secondary" type="button" onClick={() => handleModerateReview(review.id, 'hidden')}>{t('vendor.reviews.hidden','Hidden')}</button>
                    <button className="button button-secondary" type="button" onClick={() => handleModerateReview(review.id, 'pending')}>{t('vendor.reviews.pending','Pending')}</button>
                  </div>
                  {selectedReviewId === review.id && (
                    <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.7rem' }}>
                      <textarea
                        value={reviewResponseDraft}
                        onChange={handleReviewResponseChange}
                        placeholder={t('vendor.reviews.responsePlaceholder','Write a response to this customer')}
                        rows="3"
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className="button button-primary" type="button" onClick={() => handleReviewResponseSubmit(review.id)}>{t('vendor.reviews.saveResponse','Save response')}</button>
                      </div>
                      <textarea
                        value={reviewReportDraft}
                        onChange={handleReviewReportChange}
                        placeholder={t('vendor.reviews.reportPlaceholder','Explain why this review should be flagged for moderation')}
                        rows="2"
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className="button button-danger" type="button" onClick={() => handleReviewReport(review.id)}>{t('vendor.reviews.flagForModeration','Flag for moderation')}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderFinance = () => {
    const earnings = financeData?.earnings || {}
    const expenses = financeData?.expenses || {}
    const payouts = financeData?.payouts || {}
    const commission = financeData?.commission || {}
    const payoutRequests = Array.isArray(financeData?.payout_requests) ? financeData.payout_requests : []

    return (
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div className="card" style={{ background: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>Earnings dashboard</h3>
          <div style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {[
              ['Total revenue', earnings.total_revenue],
              ['Monthly revenue', earnings.monthly_revenue],
              ['Weekly revenue', earnings.weekly_revenue],
              ['Daily revenue', earnings.daily_revenue],
            ].map(([label, value]) => (
              <div key={label} style={{ background: '#f9f5eb', borderRadius: '12px', padding: '0.9rem' }}>
                <p style={{ margin: 0, color: '#6f7a88' }}>{label}</p>
                <h3 style={{ margin: '0.35rem 0 0' }}>{formatCurrency(value)}</h3>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ background: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>Expenses</h3>
          <div style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {[
              ['Marketplace commissions', expenses.marketplace_commissions],
              ['Subscription fees', expenses.subscription_fees],
              ['Refunds', expenses.refunds],
              ['Promotions', expenses.promotions],
            ].map(([label, value]) => (
              <div key={label} style={{ background: '#f6fbf8', borderRadius: '12px', padding: '0.9rem' }}>
                <p style={{ margin: 0, color: '#6f7a88' }}>{label}</p>
                <h3 style={{ margin: '0.35rem 0 0' }}>{formatCurrency(value)}</h3>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ background: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>{t('vendor.wallet.payoutsTitle','Payouts')}</h3>
          <div style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {[
              [t('vendor.wallet.payoutRequests','Payout requests'), payouts.request_count],
              [t('vendor.wallet.payoutHistory','Payout history'), payouts.history_count],
              [t('vendor.wallet.mpesaPayouts','M-Pesa payouts'), payouts.mpesa_count],
              [t('vendor.wallet.bankPayouts','Bank payouts'), payouts.bank_count],
            ].map(([label, value]) => (
              <div key={label} style={{ background: '#fff6ea', borderRadius: '12px', padding: '0.9rem' }}>
                <p style={{ margin: 0, color: '#6f7a88' }}>{label}</p>
                <h3 style={{ margin: '0.35rem 0 0' }}>{value}</h3>
              </div>
            ))}
          </div>
          {payoutRequests.length > 0 ? (
            <div style={{ marginTop: '0.9rem', display: 'grid', gap: '0.55rem' }}>
              {payoutRequests.map((request) => (
                <div key={request.id} style={{ border: '1px solid #ece2d3', borderRadius: '10px', padding: '0.7rem 0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <strong>{formatCurrency(request.amount)}</strong>
                    <span className="staff-role-badge">{request.status}</span>
                  </div>
                  <div style={{ color: '#6f7a88', fontSize: '0.9rem', marginTop: '0.2rem' }}>{request.method} · {request.requested_at ? new Date(request.requested_at).toLocaleDateString() : t('vendor.wallet.requested','Requested')}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: '0.8rem 0 0', color: '#6f7a88' }}>{t('vendor.wallet.noPayoutRequests','No payout requests yet.')}</p>
          )}
        </div>

        <div className="card" style={{ background: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>OLRYCE CLASSICS commission</h3>
          <div style={{ display: 'grid', gap: '0.8rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div style={{ background: '#f8f3ea', borderRadius: '12px', padding: '0.9rem' }}>
              <p style={{ margin: 0, color: '#6f7a88' }}>{t('vendor.wallet.commissionRate','Commission rate')}</p>
              <h3 style={{ margin: '0.35rem 0 0' }}>{commission.rate || '10.95'}%</h3>
            </div>
            <div style={{ background: '#f6fbf8', borderRadius: '12px', padding: '0.9rem' }}>
              <p style={{ margin: 0, color: '#6f7a88' }}>{t('vendor.wallet.commissionDeductions','Commission deductions')}</p>
              <h3 style={{ margin: '0.35rem 0 0' }}>{formatCurrency(commission.deductions)}</h3>
            </div>
          </div>
          <p style={{ margin: '0.85rem 0 0', color: '#6f7a88' }}>{t('vendor.wallet.commissionInfo','Marketplace commissions, reports, and deductions are tracked automatically for OLRYCE CLASSICS sellers.')}</p>
        </div>
      </div>
    )
  }

  const renderOrders = () => (
    <div className="card" style={{ background: '#fff' }}>
      <h3 style={{ marginTop: 0 }}>{t('vendor.orders.recentOrders','Recent orders')}</h3>
      {orderActionMessage && (
        <div style={{ marginBottom: '1rem', color: '#166534', fontWeight: 600 }}>{orderActionMessage}</div>
      )}
      {orders.length > 0 ? (
        <>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <button className="button button-secondary" type="button" onClick={() => handleBulkOrderAction('accept')} disabled={selectedOrderIds.length === 0}>
              Accept selected
            </button>
            <button className="button button-secondary" type="button" onClick={() => handleBulkOrderAction('process')} disabled={selectedOrderIds.length === 0}>
              Process selected
            </button>
            <button className="button button-secondary" type="button" onClick={() => handleBulkOrderAction('ship')} disabled={selectedOrderIds.length === 0}>
              Ship selected
            </button>
            <button className="button button-secondary" type="button" onClick={() => handleBulkOrderAction('cancel')} disabled={selectedOrderIds.length === 0}>
              Cancel selected
            </button>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {orders.map((order) => (
              <div key={order.id} style={{ border: '1px solid #e8e8e8', borderRadius: '12px', padding: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.includes(order.id)}
                    onChange={() => handleOrderSelection(order.id)}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 0.35rem', fontWeight: 700 }}>{order.order_number || `Order #${order.id}`}</p>
                    <p style={{ margin: 0, color: '#6f7a88' }}>{order.status} · {order.payment_status}</p>
                  </div>
                  <span style={{ fontWeight: 700 }}>{formatCurrency(order.total_amount)}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button className="button button-secondary" type="button" onClick={() => handleOrderAction(order.id, 'accept')}>
                    Accept
                  </button>
                  <button className="button button-secondary" type="button" onClick={() => handleOrderAction(order.id, 'reject')}>
                    Reject
                  </button>
                  <button className="button button-secondary" type="button" onClick={() => handleOrderAction(order.id, 'process')}>
                    Process
                  </button>
                  <button className="button button-secondary" type="button" onClick={() => handleOrderAction(order.id, 'pack')}>
                    Pack
                  </button>
                  <button className="button button-secondary" type="button" onClick={() => handleOrderAction(order.id, 'ship')}>
                    Ship
                  </button>
                  <button className="button button-secondary" type="button" onClick={() => handleOrderAction(order.id, 'deliver')}>
                    Deliver
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p style={{ margin: 0, color: '#6f7a88' }}>No orders found.</p>
      )}
    </div>
  )

  return (
    <section className="vendor-portal">
      <div className="vendor-portal-shell">
        <div className="vendor-portal-header">
          <div>
            <p className="vendor-portal-eyebrow">Supplier portal</p>
            <h2>Seller dashboard</h2>
          </div>
          <div className="vendor-portal-badge">Supplier business hub</div>
        </div>

        <div className="vendor-portal-layout">
          <aside className="vendor-sidebar">
            <div className="vendor-sidebar-welcome">
              <p>Welcome</p>
              <h3>{auth?.user?.first_name || 'Seller'}</h3>
            </div>
            <nav className="vendor-sidebar-nav">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={activeSection === item.id ? 'vendor-nav-btn active' : 'vendor-nav-btn'}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <main className="vendor-content">
            {formError && <div className="notification error">{formError}</div>}
            {formSuccess && <div className="notification success">{formSuccess}</div>}

            {loading ? (
              <div className="vendor-loading">Loading seller analytics...</div>
            ) : (
              <>
                {activeSection === 'overview' && renderOverview()}
                {activeSection === 'inventory' && renderInventory()}
                {activeSection === 'catalog' && renderCatalog()}
                {activeSection === 'store' && renderStoreSettings()}
                {activeSection === 'orders' && renderOrders()}
                {activeSection === 'returns' && renderReturns()}
                {activeSection === 'finance' && renderFinance()}
                {activeSection === 'wallet' && renderWallet()}
                {activeSection === 'reviews' && renderReviews()}
                {activeSection === 'installments' && renderInstallments()}
                {activeSection === 'marketing' && renderMarketing()}
                {activeSection === 'advertising' && renderAdvertising()}
                {activeSection === 'analytics' && renderAnalytics()}
                {activeSection === 'messages' && renderMessages()}
                {activeSection === 'notifications' && renderNotifications()}
                {activeSection === 'customers' && renderCustomerManagement()}
                {activeSection === 'staff' && renderStaffManagement()}
              </>
            )}
          </main>
        </div>
      </div>
    </section>
  )
}