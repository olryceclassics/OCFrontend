import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, Navigate } from 'react-router-dom'
import {
  createOrder,
  getConfig,
  getProduct,
  getProducts,
  getCategories,
  loginUser,
  registerUser,
  verifyRegistration,
  registerVendorUser,
  verifyVendorRegistration,
} from './api'
import { CurrencyProvider, resolveExchangeRate } from './currency'
import { TranslationProvider, useTranslation } from './i18n'
import { COUNTRY_OPTIONS, findCountryOption } from './countryConfig'
import { resolvePostLoginRoute } from './authRouting.mjs'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import LoginPage from './pages/LoginPage'
import AccountPage from './pages/AccountPage'
import WalletPage from './pages/WalletPage'
import SupplierProfile from './pages/SupplierProfile'
import SuppliersPage from './pages/SuppliersPage'
import MyRFQsPage from './pages/MyRFQsPage'
import InquiryBasketPage from './pages/InquiryBasketPage'
import TradeAlertsPage from './pages/TradeAlertsPage'
import WishlistPage from './pages/WishlistPage'
import MessagesPage from './pages/MessagesPage'
import VendorDashboardPage from './pages/VendorDashboardPage'
import './styles.css'
import Footer from './components/Footer'

const STORAGE_CART = 'olryce_frontend_cart'
const STORAGE_AUTH = 'olryce_frontend_auth'
const STORAGE_DISPLAY_CURRENCY = 'olryce_display_currency'
const STORAGE_SELECTED_COUNTRY = 'olryce_selected_country'

const loadCart = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_CART) || '[]')
  } catch {
    return []
  }
}

const saveCart = (items) => {
  localStorage.setItem(STORAGE_CART, JSON.stringify(items))
}

const loadAuth = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_AUTH) || 'null')
  } catch {
    return null
  }
}

const saveAuth = (auth) => {
  localStorage.setItem(STORAGE_AUTH, JSON.stringify(auth))
}

const loadDisplayCurrency = () => {
  try {
    return localStorage.getItem(STORAGE_DISPLAY_CURRENCY)
  } catch {
    return null
  }
}

const saveDisplayCurrency = (currency) => {
  try {
    localStorage.setItem(STORAGE_DISPLAY_CURRENCY, currency)
  } catch {
    // ignore storage errors
  }
}

const loadSelectedCountry = () => {
  try {
    const saved = localStorage.getItem(STORAGE_SELECTED_COUNTRY)
    if (saved) {
      return findCountryOption(saved)
    }

    return findCountryOption('France') || COUNTRY_OPTIONS[0]
  } catch {
    return findCountryOption('France') || COUNTRY_OPTIONS[0]
  }
}

const saveSelectedCountry = (countryCode) => {
  try {
    localStorage.setItem(STORAGE_SELECTED_COUNTRY, countryCode)
  } catch {
    // ignore storage errors
  }
}

function formatCurrency(value, currency = 'KES') {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
}

function AppContent() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [topSearch, setTopSearch] = useState('')
  const [searchCategories, setSearchCategories] = useState([])
  const topCategories = useMemo(
    () => searchCategories.filter((category) => !category.parent_slug).slice(0, 5),
    [searchCategories]
  )
  const [cart, setCartState] = useState(loadCart)
  const [auth, setAuthState] = useState(loadAuth)
  const [config, setConfigState] = useState({ baseCurrency: 'KES', supportedCurrencies: ['KES'], installmentThresholdKES: 500, displayCurrency: 'KES', exchangeRate: 1, exchangeRates: { KES: 1 } })
  const [selectedCountry, setSelectedCountry] = useState(loadSelectedCountry)
  const [countryQuery, setCountryQuery] = useState(loadSelectedCountry().name)
  const [statusMessage, setStatusMessage] = useState(null)
  const displayCurrency = config?.displayCurrency || config.baseCurrency || 'KES'

  const exchangeRate = resolveExchangeRate(config, displayCurrency)

  const supportedCurrencies = useMemo(() => {
    const currencies = config?.supportedCurrencies?.length ? [...config.supportedCurrencies] : [config.baseCurrency || 'KES']
    if (!currencies.includes(displayCurrency)) {
      currencies.unshift(displayCurrency)
    }
    return currencies
  }, [config, displayCurrency])

  useEffect(() => {
    if (selectedCountry) {
      document.documentElement.lang = selectedCountry.languageCode || 'en'
      document.documentElement.dir = selectedCountry.languageCode === 'ar' ? 'rtl' : 'ltr'
    }
  }, [selectedCountry])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [productData, configData, categoryData] = await Promise.all([getProducts(), getConfig({ currency: loadDisplayCurrency() || loadSelectedCountry().currency }), getCategories()])
        setProducts(productData.results || productData)

        const savedCurrency = loadDisplayCurrency()
        const displayCurrency = savedCurrency || configData.displayCurrency || configData.baseCurrency
        const exchangeRate = resolveExchangeRate(configData, displayCurrency)
        setConfigState({ ...configData, displayCurrency, exchangeRate })
        setSearchCategories(categoryData || [])
      } catch (error) {
        setStatusMessage({ type: 'error', text: error.message })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    const query = topSearch.trim()
    if (!query) return
    navigate(`/shop?search=${encodeURIComponent(query)}`)
  }

  const handleDisplayCurrencyChange = async (currency) => {
    saveDisplayCurrency(currency)

    setConfigState((currentConfig) => {
      const supportedCurrencies = currentConfig.supportedCurrencies || [currentConfig.baseCurrency || 'KES']
      const nextSupportedCurrencies = supportedCurrencies.includes(currency)
        ? supportedCurrencies
        : [currency, ...supportedCurrencies]

      return {
        ...currentConfig,
        displayCurrency: currency,
        supportedCurrencies: nextSupportedCurrencies,
      }
    })

    const currentConfig = config
    if (!currentConfig.exchangeRates?.[currency]) {
      try {
        const freshConfig = await getConfig({ currency })
        const exchangeRate = resolveExchangeRate(freshConfig, currency)
        setConfigState((currentConfig) => ({
          ...freshConfig,
          displayCurrency: currency,
          exchangeRate,
        }))
      } catch (error) {
        setStatusMessage({ type: 'error', text: error.message })
      }
    } else {
      setConfigState((currentConfig) => ({
        ...currentConfig,
        exchangeRate: resolveExchangeRate(currentConfig, currency),
      }))
    }
  }

  const handleCountrySelection = (value) => {
    const nextCountry = findCountryOption(value || selectedCountry?.name || '')
    if (!nextCountry) return

    setCountryQuery(nextCountry.name)
    setSelectedCountry(nextCountry)
    saveSelectedCountry(nextCountry.code)
    handleDisplayCurrencyChange(nextCountry.currency)
    setStatusMessage({ type: 'info', text: `${nextCountry.name} selected. Currency and language updated.` })
  }

  useEffect(() => {
    if (!displayCurrency) return undefined

    let cancelled = false
    const refreshRates = async () => {
      try {
        const freshConfig = await getConfig({ currency: displayCurrency })
        if (cancelled) return
        const exchangeRate = resolveExchangeRate(freshConfig, displayCurrency)
        setConfigState((currentConfig) => ({
          ...currentConfig,
          ...freshConfig,
          displayCurrency,
          exchangeRate,
        }))
      } catch (error) {
        // keep the current rates if refresh fails
        console.warn('Live FX refresh failed:', error)
      }
    }

    const intervalId = window.setInterval(refreshRates, 5 * 60 * 1000)
    refreshRates()

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [displayCurrency])

  const cartItems = useMemo(() => {
    return cart.map((item) => {
      const product = products.find((product) => product.id === item.id)
      return {
        ...item,
        name: product?.name || item.name,
        image: product?.image_url || item.image,
        price: item.price,
        stock: product?.stock ?? item.stock,
      }
    })
  }, [cart, products])

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems])
  const shipping = subtotal ? 14.5 : 0
  const tax = +(subtotal * 0.07).toFixed(2)
  const total = +(subtotal + shipping + tax).toFixed(2)

  const updateCart = (items) => {
    setCartState(items)
    saveCart(items)
  }

  const addToCart = (product, quantity = 1) => {
    const existing = cart.find((item) => item.id === product.id)
    const nextCart = existing
      ? cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item))
      : [...cart, { id: product.id, name: product.name, price: Number(product.price), quantity, image: product.image_url || '', stock: product.stock }]

    updateCart(nextCart)
    setStatusMessage({ type: 'success', text: `${product.name} added to your cart.` })
  }

  const updateQuantity = (productId, quantity) => {
    const nextCart = cart.map((item) => (item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item))
    updateCart(nextCart)
  }

  const removeFromCart = (productId) => {
    const nextCart = cart.filter((item) => item.id !== productId)
    updateCart(nextCart)
  }

  const clearCart = () => {
    updateCart([])
  }

  const handleLogin = async (identifierOrPayload, password, isVendorLogin = false, isStaffLogin = false) => {
    try {
      const payload = typeof identifierOrPayload === 'string'
        ? { email: identifierOrPayload, password }
        : identifierOrPayload

      const result = await loginUser(payload)
      const targetRoute = resolvePostLoginRoute({ isVendorLogin, isStaffLogin, user: result?.user })

      if ((isVendorLogin || isStaffLogin) && !targetRoute) {
        localStorage.removeItem(STORAGE_AUTH)
        setAuthState(null)
        setStatusMessage({
          type: 'error',
          text: 'This account does not have supplier portal access. Please use the regular sign-in page.',
        })
        throw new Error('This account does not have supplier portal access.')
      }

      saveAuth(result)
      setAuthState(result)
      setStatusMessage({
        type: 'success',
        text: `Welcome back, ${result.user.first_name || (isVendorLogin || isStaffLogin ? 'seller' : 'customer')}!`,
      })
      navigate(targetRoute)
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message })
      throw error
    }
  }

  const handleRegister = async (payload) => {
    try {
      const result = await registerUser(payload)
      setStatusMessage({ type: 'info', text: 'Registration started. Enter the verification code sent to your inbox or phone.' })
      return result
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message })
      throw error
    }
  }

  const handleVerify = async (payload) => {
    try {
      const result = await verifyRegistration(payload)
      saveAuth(result)
      setAuthState(result)
      setStatusMessage({ type: 'success', text: 'Your account is active. Welcome!' })
      navigate('/')
      return result
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message })
      throw error
    }
  }

  const handleVendorRegister = async (payload) => {
    try {
      const result = await registerVendorUser(payload)
      setStatusMessage({ type: 'info', text: 'Vendor verification codes sent. Please check your email and phone.' })
      return result
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message })
      throw error
    }
  }

  const handleVendorVerify = async (payload) => {
    try {
      const result = await verifyVendorRegistration(payload)
      saveAuth(result)
      setAuthState(result)
      const isSeller = result?.user?.can_access_supplier_portal === true
      setStatusMessage({
        type: 'success',
        text: 'Vendor registration complete. Your credentials have been sent to your email.',
      })
      navigate(isSeller ? '/vendor-dashboard' : '/')
      return result
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message })
      throw error
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_AUTH)
    setAuthState(null)
    setStatusMessage({ type: 'info', text: 'Logged out successfully.' })
    navigate('/')
  }

  const canAccessSupplierPortal = auth?.user?.can_access_supplier_portal === true || auth?.user?.is_vendor_staff === true

  const handleOrderSubmit = async (details) => {
    if (!auth?.access) {
      setStatusMessage({ type: 'error', text: 'Please log in before placing an order.' })
      return null
    }

    const payload = {
      first_name: details.firstName,
      last_name: details.lastName,
      email: details.email,
      phone: details.phone,
      address: details.address,
      city: details.city,
      postal_code: details.postalCode,
      payment_method: details.paymentMethod,
      mpesa_phone: details.paymentMethod === 'mpesa' ? details.phone : '',
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      shipping: shipping.toFixed(2),
      total_amount: total.toFixed(2),
      cart_items: cartItems.map((item) => ({ id: item.id, quantity: item.quantity, price: item.price })),
    }

    try {
      const orderResponse = await createOrder(auth.access, payload)
      clearCart()

      if (orderResponse?.bank_payment) {
        setStatusMessage({
          type: 'success',
          text: orderResponse?.message || 'Your order is awaiting bank payment confirmation. Complete the transfer to finalize your order.',
        })
      } else {
        navigate('/')
        setStatusMessage({
          type: 'success',
          text: orderResponse?.message || 'Your order was placed successfully.',
        })
      }

      return orderResponse
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message })
      return null
    }
  }

  return (
    <TranslationProvider languageCode={selectedCountry?.languageCode || 'en'}>
      <CurrencyProvider currency={displayCurrency} rate={exchangeRate} locale={selectedCountry?.locale || 'en-KE'} language={selectedCountry?.language || 'English'} country={selectedCountry}>
        <AppContentShell
          navigate={navigate}
          topSearch={topSearch}
          handleSearchSubmit={handleSearchSubmit}
          cartItems={cartItems}
          addToCart={addToCart}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          subtotal={subtotal}
          tax={tax}
          shipping={shipping}
          total={total}
          handleOrderSubmit={handleOrderSubmit}
          auth={auth}
          handleLogin={handleLogin}
          handleRegister={handleRegister}
          handleVerify={handleVerify}
          handleVendorRegister={handleVendorRegister}
          handleVendorVerify={handleVendorVerify}
          selectedCountry={selectedCountry}
          countryQuery={countryQuery}
          setCountryQuery={setCountryQuery}
          handleCountrySelection={handleCountrySelection}
          displayCurrency={displayCurrency}
          config={config}
          handleDisplayCurrencyChange={handleDisplayCurrencyChange}
          canAccessSupplierPortal={canAccessSupplierPortal}
          handleLogout={handleLogout}
          topCategories={topCategories}
        />
      </CurrencyProvider>
      </TranslationProvider>
  )
}

function AppContentShell({
  navigate,
  topSearch,
  handleSearchSubmit,
  cartItems,
  addToCart,
  updateQuantity,
  removeFromCart,
  subtotal,
  tax,
  shipping,
  total,
  handleOrderSubmit,
  auth,
  handleLogin,
  handleRegister,
  handleVerify,
  handleVendorRegister,
  handleVendorVerify,
  selectedCountry,
  countryQuery,
  setCountryQuery,
  handleCountrySelection,
  displayCurrency,
  config,
  handleDisplayCurrencyChange,
  canAccessSupplierPortal,
  handleLogout,
  topCategories,
}) {
  const { t } = useTranslation()

  return (
    <>
      <div className="app-shell">
        <div className="topbar">
        <div className="brand">
          <Link to="/">OlryceClassics</Link>
        </div>
        <form className="topbar-search" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            placeholder={t('nav.searchPlaceholder', 'Search products, suppliers, categories...')}
            value={topSearch}
            onChange={(event) => setTopSearch(event.target.value)}
            aria-label={t('nav.searchAriaLabel', 'Search products')}
          />
          <button className="button button-primary" type="submit">{t('nav.search', 'Search')}</button>
        </form>
        <nav className="nav-links">
          <Link to="/">{t('nav.home', 'Home')}</Link>
          <Link to="/shop">{t('nav.shop', 'Shop')}</Link>
          <Link to="/suppliers">{t('nav.suppliers', 'Suppliers')}</Link>
          <Link to="/inquiry-basket">{t('nav.inquiryBasket', 'Inquiry Basket')}</Link>
          <Link to="/trade-alerts">{t('nav.tradeAlerts', 'Trade Alerts')}</Link>
          <Link to="/cart">{t('nav.cart', 'Cart')} ({cartItems.length})</Link>
          <Link to="/checkout">{t('nav.checkout', 'Checkout')}</Link>
          <Link to="/wishlist">♡ {t('nav.wishlist', 'Wishlist')}</Link>
          {auth ? (
            <>
              <Link to="/rfqs">{t('nav.rfqs', 'RFQs')}</Link>
              <Link to="/messages">💬 {t('nav.messages', 'Messages')}</Link>
              <Link to="/wallet">{t('nav.wallet', 'Wallet')}</Link>
              <Link to="/account">{t('nav.account', 'Account')}</Link>
            </>
          ) : (
            <Link to="/login">{t('nav.signIn', 'Sign in')}</Link>
          )}
        </nav>
        <div className="country-selector">
          <label htmlFor="country-search">{t('nav.country', 'Country')}</label>
          <div className="country-selector-controls">
            <input
              id="country-search"
              list="country-options"
              value={countryQuery}
              onChange={(event) => setCountryQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleCountrySelection(countryQuery)
                }
              }}
              placeholder={t('nav.countryPlaceholder', 'Search country')}
            />
            <datalist id="country-options">
              {COUNTRY_OPTIONS.map((option) => (
                <option key={option.code} value={option.name} />
              ))}
            </datalist>
            <button type="button" className="button button-small" onClick={() => handleCountrySelection(countryQuery)}>
              {t('nav.applyCountry', 'Apply')}
            </button>
          </div>
          <div className="country-selection-summary">
            <span>{selectedCountry?.name}</span>
            <span>{displayCurrency}</span>
          </div>
        </div>
        <div className="auth-chip">
          {auth ? (
            <>
              <Link to={canAccessSupplierPortal ? '/vendor-dashboard' : '/vendor-login'} className="seller-link">
                {t('nav.seller', "I'm a seller")}
              </Link>
              <button className="text-action" onClick={handleLogout}>{t('nav.logout', 'Logout')}</button>
            </>
          ) : (
            <>
              <Link to="/vendor-login" className="seller-link">{t('nav.seller', "I'm a seller")}</Link>
              <Link to="/login" className="button button-secondary">{t('nav.signIn', 'Sign in')}</Link>
            </>
          )}
        </div>
      </div>
      <div className="topbar-tags">
        <span className="topbar-tags-label">{t('nav.sourcingCategories', 'Sourcing categories')}</span>
        {topCategories.map((item) => (
          <button
            key={item.id}
            type="button"
            className="pill"
            onClick={() => navigate(`/shop?category=${encodeURIComponent(item.slug || item.name)}`)}
          >
            {t(item.name, item.name)}
          </button>
        ))}
      </div>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage onAddToCart={addToCart} />} />
        <Route path="/product/:slug" element={
          <ProductDetailPage auth={auth} onAddToCart={addToCart} onAddToWishlist={() => {}} />
        } />
        <Route path="/supplier/:id" element={
          <SupplierProfile auth={auth} />
        } />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/inquiry-basket" element={
          <InquiryBasketPage auth={auth} />
        } />
        <Route path="/trade-alerts" element={
          <TradeAlertsPage auth={auth} />
        } />
        <Route path="/rfqs" element={
          auth ? <MyRFQsPage auth={auth} /> : <Navigate to="/login" replace />
        } />
        <Route path="/wishlist" element={
          <WishlistPage auth={auth} />
        } />
        <Route path="/messages" element={
          <MessagesPage auth={auth} />
        } />
        <Route path="/vendor-dashboard" element={
          canAccessSupplierPortal ? <VendorDashboardPage auth={auth} /> : <Navigate to="/account" replace />
        } />
        <Route path="/cart" element={
          <CartPage
            cartItems={cartItems}
            onQuantityChange={updateQuantity}
            onRemove={removeFromCart}
            subtotal={subtotal}
            tax={tax}
            shipping={shipping}
            total={total}
          />
        } />
        <Route path="/checkout" element={
          <CheckoutPage
            auth={auth}
            cartItems={cartItems}
            subtotal={subtotal}
            tax={tax}
            shipping={shipping}
            total={total}
            onSubmit={handleOrderSubmit}
          />
        } />
        <Route path="/login" element={
          <LoginPage
            auth={auth}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onVerify={handleVerify}
            onVendorRegister={handleVendorRegister}
            onVendorVerify={handleVendorVerify}
          />
        } />
        <Route path="/vendor-login" element={
          <LoginPage
            auth={auth}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onVerify={handleVerify}
            onVendorRegister={handleVendorRegister}
            onVendorVerify={handleVendorVerify}
            variant="vendor"
          />
        } />
        <Route path="/staff-login" element={
          <LoginPage
            auth={auth}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onVerify={handleVerify}
            onVendorRegister={handleVendorRegister}
            onVendorVerify={handleVendorVerify}
            variant="staff"
          />
        } />
        <Route path="/wallet" element={
          auth ? <WalletPage auth={auth} /> : <Navigate to="/login" replace />
        } />
        <Route path="/account" element={
          auth ? <AccountPage auth={auth} /> : <Navigate to="/login" replace />
        } />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </div>
      <Footer />
    </>
  )
}


function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <section className="page-section not-found">
      <h2>{t('notfound.title', 'Page not found')}</h2>
      <p>{t('notfound.body', 'The page you are looking for does not exist.')}</p>
      <Link className="button button-primary" to="/">{t('notfound.return', 'Return to shop')}</Link>
    </section>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
