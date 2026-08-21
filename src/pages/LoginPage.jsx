import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../i18n'
import '../styles/pages/login.css'

export default function LoginPage({
  auth,
  onLogin,
  onRegister,
  onVerify,
  onVendorRegister,
  onVendorVerify,
  variant = 'default',
}) {
  const isVendorFlow = variant === 'vendor'
  const isStaffFlow = variant === 'staff'
  const [mode, setMode] = useState(isVendorFlow ? 'vendor-login' : 'login')
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    channel: 'email',
  })
  const [vendorLoginForm, setVendorLoginForm] = useState({
    identifier: '',
    password: '',
  })
  const [vendorForm, setVendorForm] = useState({
    email: '',
    phoneNumber: '',
    firstName: '',
    lastName: '',
    companyName: '',
  })
  const [verification, setVerification] = useState({
    verificationId: '',
    code: '',
  })
  const [vendorVerification, setVendorVerification] = useState({
    emailVerificationId: '',
    phoneVerificationId: '',
    emailCode: '',
    phoneCode: '',
  })
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setMode(isVendorFlow ? 'vendor-login' : 'login')
  }, [isVendorFlow])

  const { t } = useTranslation()

  useEffect(() => {
    if (auth?.access) {
      const shouldGoToVendorDashboard =
        isVendorFlow || isStaffFlow || auth?.user?.can_access_supplier_portal === true || auth?.user?.is_vendor_staff === true
      navigate(shouldGoToVendorDashboard ? '/vendor-dashboard' : '/account')
    }
  }, [auth, navigate, isVendorFlow, isStaffFlow])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleVendorLoginChange = (field, value) => {
    setVendorLoginForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleVendorChange = (field, value) => {
    setVendorForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleVerificationChange = (field, value) => {
    setVerification((prev) => ({ ...prev, [field]: value }))
  }

  const handleVendorVerificationChange = (field, value) => {
    setVendorVerification((prev) => ({ ...prev, [field]: value }))
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      await onLogin(form.email, form.password, false, isStaffFlow)
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleVendorLoginSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      await onLogin({
        identifier: vendorLoginForm.identifier,
        password: vendorLoginForm.password,
      }, null, true, false)
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const result = await onRegister({
        email: form.email,
        password: form.password,
        first_name: form.firstName,
        last_name: form.lastName,
        channel: form.channel,
      })
      setVerification({ verificationId: result.verification_id, code: '' })
      setMode('verify')
      setMessage({ type: 'info', text: 'Verification code sent to your ' + form.channel })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifySubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      await onVerify({
        verification_id: verification.verificationId,
        code: verification.code,
      })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleVendorRegisterSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const result = await onVendorRegister({
        email: vendorForm.email,
        phone_number: vendorForm.phoneNumber,
        first_name: vendorForm.firstName,
        last_name: vendorForm.lastName,
        company_name: vendorForm.companyName,
      })
      setVendorVerification({
        emailVerificationId: result.verification_id,
        phoneVerificationId: result.phone_verification_id,
        emailCode: '',
        phoneCode: '',
      })
      setMode('vendor-verify')
      setMessage({ type: 'info', text: 'Verification codes sent to your email and phone number.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleVendorVerifySubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      await onVendorVerify({
        email_verification_id: vendorVerification.emailVerificationId,
        phone_verification_id: vendorVerification.phoneVerificationId,
        email_code: vendorVerification.emailCode,
        phone_code: vendorVerification.phoneCode,
        company_name: vendorForm.companyName,
      })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`login-page${isVendorFlow || isStaffFlow ? ' vendor-auth-page' : ''}`}>
      <div className={`login-portal-shell${isVendorFlow || isStaffFlow ? ' vendor-shell' : ''}`}>
        <div className={`login-portal-visual${isVendorFlow || isStaffFlow ? ' vendor-visual' : ''}`}>
          <span className="portal-pill">{isStaffFlow ? t('login.staffPortal', 'Staff portal') : isVendorFlow ? t('login.sellerPortal', 'Seller portal') : t('login.businessPortal', 'Business portal')}</span>
          <h1>{isStaffFlow ? t('login.staffTitle', 'Log in to your vendor team workspace') : isVendorFlow ? t('login.vendorTitle', 'Grow your business from one secure seller dashboard') : t('login.title', 'Manage your marketplace from one secure place')}</h1>
          <p>
            {isStaffFlow
              ? t('login.staffBody', 'Use the credentials your vendor provided to access only the supplier workspace assigned to you.')
              : isVendorFlow
                ? t('login.vendorBody', 'Track orders, manage inventory, and stay connected with buyers in one place.')
                : t('login.body', 'Track sales, monitor suppliers, and stay updated on every customer request.')}
          </p>
          <div className="portal-stat-grid">
            <div>
              <strong>{isVendorFlow ? '100%' : '24/7'}</strong>
              <span>{isVendorFlow ? 'Seller visibility' : 'Live updates'}</span>
            </div>
            <div>
              <strong>{isVendorFlow ? '98%' : '98%'}</strong>
              <span>{isVendorFlow ? 'Order accuracy' : 'Order accuracy'}</span>
            </div>
            <div>
              <strong>{isVendorFlow ? '1K+' : '1,200+'}</strong>
              <span>{isVendorFlow ? 'Active buyers' : 'Active clients'}</span>
            </div>
          </div>
          {isVendorFlow && (
            <div className="portal-feature-list">
              <div>• Inventory control</div>
              <div>• Buyer communication</div>
              <div>• Sales insights</div>
            </div>
          )}
        </div>

        <div className="login-card">
          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit}>
              <h2>{isStaffFlow ? t('login.staffSignIn', 'Staff sign in') : t('login.signIn', 'Sign in')}</h2>
              {isStaffFlow && <p className="vendor-subtitle">Use the staff credentials provided by the vendor who created your account.</p>}
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="button button-primary" disabled={loading}>
                {loading ? t('login.signingIn', 'Signing in...') : isStaffFlow ? t('login.staffSignIn', 'Staff sign in') : t('login.signIn', 'Sign in')}
              </button>
              {!isStaffFlow && (
                <p className="toggle-mode">
                  {t('login.needSellerAccess', 'Need seller access?')} <button type="button" onClick={() => navigate('/vendor-login')}>{t('login.useSellerSignIn', 'Use seller sign in')}</button>
                </p>
              )}
              {!isStaffFlow && (
                <p className="toggle-mode">
                  {t('login.staffLoginPrompt', 'Staff login?')} <button type="button" onClick={() => navigate('/staff-login')}>{t('login.useStaffSignIn', 'Use staff sign in')}</button>
                </p>
              )}
              <p className="toggle-mode">
                {t('login.noAccount', "Don't have an account?")} <button type="button" onClick={() => setMode('register')}>{t('login.register', 'Register')}</button>
              </p>
              <p className="toggle-mode">
                {t('login.wantToSell', 'Want to sell with us?')} <button type="button" onClick={() => setMode('vendor-register')}>{t('login.applyVendor', 'Apply as a vendor')}</button>
              </p>
            </form>
          )}

          {mode === 'vendor-login' && (
            <form onSubmit={handleVendorLoginSubmit}>
              <span className="vendor-accent">Seller portal</span>
              <h2>{t('login.vendorSignIn', 'Vendor sign in')}</h2>
              <p className="vendor-subtitle">{t('login.vendorSubtitle', 'Use your seller ID, username, or registered email.')}</p>
              <div className="form-group">
                <label>Seller ID / Username</label>
                <input
                  type="text"
                  value={vendorLoginForm.identifier}
                  onChange={(e) => handleVendorLoginChange('identifier', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={vendorLoginForm.password}
                  onChange={(e) => handleVendorLoginChange('password', e.target.value)}
                  required
                />
              </div>
              <p className="vendor-helper">{t('login.vendorHelper', 'Use the credentials provided during vendor registration.')}</p>
              <button type="submit" className="button button-primary" disabled={loading}>
                {loading ? t('login.signingIn', 'Signing in...') : t('login.signIn', 'Sign in')}
              </button>
              <p className="toggle-mode">
                {t('login.customerSignInPrompt', 'Customer sign in?')} <button type="button" onClick={() => navigate('/login')}>{t('login.useRegularLogin', 'Use regular login')}</button>
              </p>
              {!isVendorFlow && (
                <p className="toggle-mode">
                  {t('login.needVendorAccount', 'Need a vendor account?')} <button type="button" onClick={() => setMode('vendor-register')}>{t('login.applyNow', 'Apply now')}</button>
                </p>
              )}
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit}>
              <h2>Create account</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>First name</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last name</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Verification method</label>
                <select value={form.channel} onChange={(e) => handleChange('channel', e.target.value)}>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
              <button type="submit" className="button button-primary" disabled={loading}>
                {loading ? 'Creating account...' : 'Register'}
              </button>
              <p className="toggle-mode">
                Already have an account? <button type="button" onClick={() => setMode('login')}>Sign in</button>
              </p>
            </form>
          )}

          {mode === 'verify' && (
            <form onSubmit={handleVerifySubmit}>
              <h2>Verify your account</h2>
              <p>Enter the code sent to your {form.channel}</p>
              <div className="form-group">
                <label>Verification code</label>
                <input
                  type="text"
                  placeholder="000000"
                  value={verification.code}
                  onChange={(e) => handleVerificationChange('code', e.target.value)}
                  required
                  maxLength="6"
                />
              </div>
              <button type="submit" className="button button-primary" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>
          )}

          {mode === 'vendor-register' && (
            <form onSubmit={handleVendorRegisterSubmit}>
              <h2>Vendor registration</h2>
              <p>We’ll verify your email and phone number before your seller account becomes active.</p>
              <div className="form-row">
                <div className="form-group">
                  <label>First name</label>
                  <input
                    type="text"
                    value={vendorForm.firstName}
                    onChange={(e) => handleVendorChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last name</label>
                  <input
                    type="text"
                    value={vendorForm.lastName}
                    onChange={(e) => handleVendorChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={vendorForm.email}
                  onChange={(e) => handleVendorChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone number</label>
                <input
                  type="tel"
                  value={vendorForm.phoneNumber}
                  onChange={(e) => handleVendorChange('phoneNumber', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Company name</label>
                <input
                  type="text"
                  value={vendorForm.companyName}
                  onChange={(e) => handleVendorChange('companyName', e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="button button-primary" disabled={loading}>
                {loading ? 'Sending codes...' : 'Send verification codes'}
              </button>
              <p className="toggle-mode">
                Already have an account? <button type="button" onClick={() => setMode('login')}>Sign in</button>
              </p>
            </form>
          )}

          {mode === 'vendor-verify' && (
            <form onSubmit={handleVendorVerifySubmit}>
              <h2>Verify vendor details</h2>
              <div className="form-group">
                <label>Email verification code</label>
                <input
                  type="text"
                  value={vendorVerification.emailCode}
                  onChange={(e) => handleVendorVerificationChange('emailCode', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone verification code</label>
                <input
                  type="text"
                  value={vendorVerification.phoneCode}
                  onChange={(e) => handleVendorVerificationChange('phoneCode', e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="button button-primary" disabled={loading}>
                {loading ? 'Completing registration...' : 'Complete vendor registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
