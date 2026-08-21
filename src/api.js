const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

const STORAGE_AUTH = 'olryce_frontend_auth'

const buildError = async (response) => {
  let body = null;
  try {
    body = await response.json();
  } catch (err) {
    return new Error(response.statusText || 'Request failed');
  }

  const message = body?.detail || body?.message || body?.error || JSON.stringify(body);
  return new Error(message || response.statusText || 'Request failed');
};

const normalizeToken = (token) =>
  typeof token === 'string' && token.trim()
    ? token.trim()
    : '';

const loadStoredAuth = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_AUTH) || 'null')
  } catch {
    return null
  }
};

const saveStoredAuth = (auth) => {
  if (auth) {
    localStorage.setItem(STORAGE_AUTH, JSON.stringify(auth))
  }
};

const refreshStoredToken = async () => {
  const storedAuth = loadStoredAuth()
  const refreshToken = normalizeToken(storedAuth?.refresh)
  if (!refreshToken) return null

  try {
    const refreshed = await fetchJson('/api/auth/token/refresh/', jsonOptions('POST', { refresh: refreshToken }))
    const nextAuth = {
      ...storedAuth,
      ...refreshed,
      refresh: refreshed.refresh || storedAuth.refresh,
    }
    saveStoredAuth(nextAuth)
    return nextAuth
  } catch (err) {
    return null
  }
};

const jsonOptions = (method, data, token) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  const authToken = normalizeToken(token);
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  };
};

const formDataOptions = (method, data, token) => {
  const headers = {};
  const authToken = normalizeToken(token);
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const body = data instanceof FormData ? data : (() => {
    const formData = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      formData.append(key, value);
    });
    return formData;
  })();

  return {
    method,
    headers,
    body,
  };
};

const getApiUrl = (path) => {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  if (API_BASE_URL) return `${API_BASE_URL}${path}`;
  return path;
};

export const fetchJson = async (path, options = {}) => {
  const makeRequest = async (requestOptions, retryCount = 0) => {
    const response = await fetch(getApiUrl(path), requestOptions);
    if (response.ok) {
      if (response.status === 204) {
        return null;
      }
      return response.json();
    }

    if (response.status === 401 && retryCount === 0 && requestOptions.headers?.Authorization) {
      const refreshedAuth = await refreshStoredToken();
      if (refreshedAuth?.access) {
        const retriedHeaders = {
          ...(requestOptions.headers || {}),
          Authorization: `Bearer ${refreshedAuth.access}`,
        };
        return makeRequest({
          ...requestOptions,
          headers: retriedHeaders,
        }, 1);
      }
    }

    throw await buildError(response);
  };

  return makeRequest(options);
};

// Products & Categories
export const getProducts = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetchJson(`/api/products/?${qs}`);
};

export const getProduct = (idOrSlug) => fetchJson(`/api/products/${idOrSlug}/`);

export const getCategories = () => fetchJson('/api/products/categories/');

export const searchProducts = (query, params = {}) => {
  params.q = query;
  const qs = new URLSearchParams(params).toString();
  return fetchJson(`/api/products/search/?${qs}`);
};

export const getFeaturedProducts = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetchJson(`/api/products/featured/?${qs}`);
};

export const getCarouselItems = () => fetchJson('/api/carousel/');

export const getRelatedProducts = (slug, limit = 5) => 
  fetchJson(`/api/products/${slug}/related/?limit=${limit}`);

// Cart Management
export const getCart = (token) =>
  fetchJson('/api/cart/', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });

export const addToCart = (productId, quantity, token) =>
  fetchJson('/api/cart/', jsonOptions('POST', { product_id: productId, quantity }, token));

export const updateCartItem = (itemId, quantity, token) =>
  fetchJson(`/api/cart/items/${itemId}/`, jsonOptions('PATCH', { quantity }, token));

export const removeFromCart = (itemId, token) =>
  fetchJson(`/api/cart/items/${itemId}/`, jsonOptions('DELETE', null, token));

export const clearCart = (token) =>
  fetchJson('/api/cart/clear/', jsonOptions('DELETE', null, token));

// Authentication
export const getConfig = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetchJson(`/api/config/${qs ? `?${qs}` : ''}`);
};

export const loginUser = (identifierOrPayload, password) => {
  const payload = typeof identifierOrPayload === 'string'
    ? { email: identifierOrPayload, password }
    : identifierOrPayload;

  return fetchJson('/api/auth/login/', jsonOptions('POST', payload));
};

export const registerUser = (payload) =>
  fetchJson('/api/auth/register/', jsonOptions('POST', payload));

export const verifyRegistration = (payload) =>
  fetchJson('/api/auth/register/', jsonOptions('POST', payload));

export const registerVendorUser = (payload) =>
  fetchJson('/api/auth/vendor-register/', jsonOptions('POST', payload));

export const verifyVendorRegistration = (payload) =>
  fetchJson('/api/auth/vendor-verify/', jsonOptions('POST', payload));

// Wallet
export const getWallet = (token) =>
  fetchJson('/api/wallet/', { headers: { 'Authorization': `Bearer ${token}` } });

export const topUpWallet = (token, payload) =>
  fetchJson('/api/wallet/topup/', jsonOptions('POST', payload, token));

export const finalizeWalletDeposit = (token, payload) =>
  fetchJson('/api/wallet/finalize/', jsonOptions('POST', payload, token));

export const withdrawFromWallet = (token, payload) =>
  fetchJson('/api/wallet/withdraw/', jsonOptions('POST', payload, token));

export const getWalletTransactions = (token) =>
  fetchJson('/api/wallet/transactions/', { headers: { 'Authorization': `Bearer ${token}` } });

export const getPrePurchaseItems = (token) =>
  fetchJson('/api/wallet/prepurchase-items/', { headers: { 'Authorization': `Bearer ${token}` } });

export const createPrePurchaseItem = (token, payload) =>
  fetchJson('/api/wallet/prepurchase-items/', jsonOptions('POST', payload, token));

export const fundPrePurchaseItem = (token, itemId, payload) =>
  fetchJson(`/api/wallet/prepurchase-items/${itemId}/fund/`, jsonOptions('POST', payload, token));

// Orders
export const createOrder = (token, payload) =>
  fetchJson('/api/orders/create/', jsonOptions('POST', payload, token));

export const getMyOrders = (token) =>
  fetchJson('/api/orders/my-orders/', { headers: { 'Authorization': `Bearer ${token}` } });

export const getOrderDetail = (orderId, token) =>
  fetchJson(`/api/orders/detail/?order_id=${orderId}`, { headers: { 'Authorization': `Bearer ${token}` } });

export const verifyMpesaPayment = (orderId, token) =>
  fetchJson('/api/orders/verify-mpesa/', jsonOptions('POST', { order_id: orderId }, token));

// Suppliers & Sellers
export const getSuppliers = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetchJson(`/api/suppliers/?${qs}`);
};

export const getSupplier = (id) => fetchJson(`/api/suppliers/${id}/`);

export const getSupplierProducts = (supplierId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetchJson(`/api/suppliers/${supplierId}/products/?${qs}`);
};

// Product Reviews & Ratings
export const getProductReviews = (productId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetchJson(`/api/products/${productId}/reviews/?${qs}`);
};

export const submitReview = (productId, token, payload) =>
  fetchJson(`/api/products/${productId}/reviews/`, jsonOptions('POST', payload, token));

export const getProductRating = (productId) => fetchJson(`/api/products/${productId}/rating/`);

// Vendor dashboard
export const getVendorDashboard = (token) =>
  fetchJson('/api/vendor/dashboard/', { headers: { 'Authorization': `Bearer ${token}` } });

export const getVendorFinance = (token) =>
  fetchJson('/api/vendor/finance/', { headers: { 'Authorization': `Bearer ${token}` } });

export const getVendorAnalytics = (token) =>
  fetchJson('/api/vendor/analytics/', { headers: { 'Authorization': `Bearer ${token}` } });

export const getVendorAdPlacements = (token) =>
  fetchJson('/api/vendor/ads/', { headers: { 'Authorization': `Bearer ${token}` } });

export const createVendorAdPlacement = (token, payload) =>
  fetchJson('/api/vendor/ads/', jsonOptions('POST', payload, token));

export const getVendorNotificationSettings = (token) =>
  fetchJson('/api/vendor/notification-settings/', { headers: { 'Authorization': `Bearer ${token}` } });

export const createVendorNotificationSetting = (token, payload) =>
  fetchJson('/api/vendor/notification-settings/', jsonOptions('POST', payload, token));

export const updateVendorNotificationSetting = (token, payload) =>
  fetchJson('/api/vendor/notification-settings/', jsonOptions('PATCH', payload, token));

export const getVendorConversations = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetchJson(`/api/vendor/conversations/?${qs}`, { headers: { 'Authorization': `Bearer ${token}` } });
};

export const getVendorConversation = (conversationId, token) =>
  fetchJson(`/api/vendor/conversations/${conversationId}/`, { headers: { 'Authorization': `Bearer ${token}` } });

export const createVendorConversation = (token, payload) =>
  fetchJson('/api/vendor/conversations/', formDataOptions('POST', payload, token));

export const sendVendorConversationMessage = (token, conversationId, payload) =>
  fetchJson(`/api/vendor/conversations/${conversationId}/messages/`, formDataOptions('POST', payload, token));

export const getVendorReturns = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetchJson(`/api/vendor/returns/?${qs}`, { headers: { 'Authorization': `Bearer ${token}` } });
};

export const getVendorReturn = (token, returnId) =>
  fetchJson(`/api/vendor/returns/${returnId}/`, { headers: { 'Authorization': `Bearer ${token}` } });

export const createVendorReturn = (token, payload) =>
  fetchJson('/api/vendor/returns/', jsonOptions('POST', payload, token));

export const updateVendorReturn = (token, returnId, payload) =>
  fetchJson(`/api/vendor/returns/${returnId}/`, jsonOptions('PATCH', payload, token));

export const getVendorRefunds = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetchJson(`/api/vendor/refunds/?${qs}`, { headers: { 'Authorization': `Bearer ${token}` } });
};

export const getVendorRefund = (token, refundId) =>
  fetchJson(`/api/vendor/refunds/${refundId}/`, { headers: { 'Authorization': `Bearer ${token}` } });

export const createVendorRefund = (token, payload) =>
  fetchJson('/api/vendor/refunds/', jsonOptions('POST', payload, token));

export const updateVendorRefund = (token, refundId, payload) =>
  fetchJson(`/api/vendor/refunds/${refundId}/`, jsonOptions('PATCH', payload, token));

export const getVendorWallet = (token) =>
  fetchJson('/api/vendor/wallet/', { headers: { 'Authorization': `Bearer ${token}` } });

export const createVendorPayoutRequest = (token, payload) =>
  fetchJson('/api/vendor/payout-requests/', jsonOptions('POST', payload, token));

export const getVendorProfile = (token) =>
  fetchJson('/api/vendor/profile/', { headers: { 'Authorization': `Bearer ${token}` } });

export const updateVendorProfile = (token, payload) =>
  fetchJson('/api/vendor/profile/', formDataOptions('PATCH', payload, token));

export const getVendorStaff = (token) =>
  fetchJson('/api/vendor/staff/', { headers: { 'Authorization': `Bearer ${token}` } });

export const createVendorStaff = (token, payload) =>
  fetchJson('/api/vendor/staff/', jsonOptions('POST', payload, token));

export const getVendorInventory = (token) =>
  fetchJson('/api/vendor/inventory/', { headers: { 'Authorization': `Bearer ${token}` } });

export const adjustVendorInventory = (token, payload) =>
  fetchJson('/api/vendor/inventory-adjust/', jsonOptions('POST', payload, token));

export const getVendorProducts = (token) =>
  fetchJson('/api/vendor/products/', { headers: { 'Authorization': `Bearer ${token}` } });

export const createVendorProduct = (token, payload) =>
  fetchJson('/api/vendor/products/', formDataOptions('POST', payload, token));

export const updateVendorProduct = (token, productId, payload) =>
  fetchJson(`/api/vendor/products/${productId}/`, formDataOptions('PATCH', payload, token));

export const deleteVendorProduct = (token, productId) =>
  fetchJson(`/api/vendor/products/${productId}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });

export const bulkUploadVendorProducts = (token, payload) =>
  fetchJson('/api/vendor/products/bulk-upload/', formDataOptions('POST', payload, token));

export const getVendorOrders = (token) =>
  fetchJson('/api/vendor/orders/', { headers: { 'Authorization': `Bearer ${token}` } });

export const vendorOrderAction = (token, payload) =>
  fetchJson('/api/vendor/orders/action/', jsonOptions('POST', payload, token));

export const vendorBulkOrderAction = (token, payload) =>
  fetchJson('/api/vendor/orders/bulk-action/', jsonOptions('POST', payload, token));

// Vendor Installment plans
export const getVendorInstallmentPlans = (token) =>
  fetchJson('/api/vendor/installment-plans/', { headers: { 'Authorization': `Bearer ${token}` } });

export const createVendorInstallmentPlan = (token, payload) =>
  fetchJson('/api/vendor/installment-plans/', jsonOptions('POST', payload, token));

export const updateVendorInstallmentPlan = (token, planId, payload) =>
  fetchJson('/api/vendor/installment-plans/', jsonOptions('PATCH', { id: planId, ...payload }, token));

// Vendor coupons
export const getVendorCoupons = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetchJson(`/api/vendor/coupons/${qs ? `?${qs}` : ''}`, { headers: { 'Authorization': `Bearer ${token}` } });
}

export const createVendorCoupon = (token, payload) =>
  fetchJson('/api/vendor/coupons/', jsonOptions('POST', payload, token));

export const updateVendorCoupon = (token, couponId, payload) =>
  fetchJson('/api/vendor/coupons/', jsonOptions('PATCH', { id: couponId, ...payload }, token));

// Vendor campaigns
export const getVendorCampaigns = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetchJson(`/api/vendor/campaigns/${qs ? `?${qs}` : ''}`, { headers: { 'Authorization': `Bearer ${token}` } });
}

export const createVendorCampaign = (token, payload) =>
  fetchJson('/api/vendor/campaigns/', jsonOptions('POST', payload, token));

export const updateVendorCampaign = (token, campaignId, payload) =>
  fetchJson('/api/vendor/campaigns/', jsonOptions('PATCH', { id: campaignId, ...payload }, token));

// Vendor customer management
export const getVendorCustomers = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetchJson(`/api/vendor/customers/${qs ? `?${qs}` : ''}`, { headers: { 'Authorization': `Bearer ${token}` } });
};

export const createVendorCustomer = (token, payload) =>
  fetchJson('/api/vendor/customers/', jsonOptions('POST', payload, token));

export const updateVendorCustomer = (token, customerKey, payload) =>
  fetchJson(`/api/vendor/customers/${encodeURIComponent(customerKey)}/`, jsonOptions('PATCH', payload, token));

export const getVendorReviews = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetchJson(`/api/vendor/reviews/${qs ? `?${qs}` : ''}`, { headers: { 'Authorization': `Bearer ${token}` } });
};

export const getVendorReviewAnalytics = (token) =>
  fetchJson('/api/vendor/reviews/analytics/', { headers: { 'Authorization': `Bearer ${token}` } });

export const respondVendorReview = (token, reviewId, payload) =>
  fetchJson(`/api/vendor/reviews/${reviewId}/respond/`, jsonOptions('PATCH', payload, token));

export const reportVendorReview = (token, reviewId, payload) =>
  fetchJson(`/api/vendor/reviews/${reviewId}/report/`, jsonOptions('POST', payload, token));

export const moderateVendorReview = (token, reviewId, payload) =>
  fetchJson(`/api/vendor/reviews/${reviewId}/moderate/`, jsonOptions('PATCH', payload, token));

// RFQ (Request for Quotation)
export const submitRFQ = (token, payload) =>
  fetchJson('/api/rfq/create/', jsonOptions('POST', payload, token));

export const getMyRFQs = (token) =>
  fetchJson('/api/rfq/my-requests/', { headers: { 'Authorization': `Bearer ${token}` } });

export const getRFQDetail = (rfqId, token) =>
  fetchJson(`/api/rfq/${rfqId}/`, { headers: { 'Authorization': `Bearer ${token}` } });

export const sendRFQQuote = (rfqId, token, payload) =>
  fetchJson(`/api/rfq/${rfqId}/quote/`, jsonOptions('POST', payload, token));

// Messaging & Inquiries
export const sendInquiry = (token, payload) =>
  fetchJson('/api/messages/inquiries/', jsonOptions('POST', payload, token));

export const getMyInquiries = (token) =>
  fetchJson('/api/messages/inquiries/my-inquiries/', { headers: { 'Authorization': `Bearer ${token}` } });

export const getConversation = (conversationId, token) =>
  fetchJson(`/api/messages/conversations/${conversationId}/`, { headers: { 'Authorization': `Bearer ${token}` } });

export const sendMessage = (conversationId, token, payload) =>
  fetchJson(`/api/messages/conversations/${conversationId}/send/`, jsonOptions('POST', payload, token));

// Wishlist
export const getWishlist = (token) =>
  fetchJson('/api/wishlist/', { headers: { 'Authorization': `Bearer ${token}` } });

export const addToWishlist = (productId, token) =>
  fetchJson('/api/wishlist/', jsonOptions('POST', { product_id: productId }, token));

export const removeFromWishlist = (productId, token) =>
  fetchJson(`/api/wishlist/${productId}/`, jsonOptions('DELETE', null, token));

// Trade Alerts & Notifications
export const createTradeAlert = (token, payload) =>
  fetchJson('/api/trade-alerts/', jsonOptions('POST', payload, token));

export const getMyTradeAlerts = (token) =>
  fetchJson('/api/trade-alerts/', { headers: { 'Authorization': `Bearer ${token}` } });

// Inquiry Basket
export const getInquiryBasket = (token) =>
  fetchJson('/api/inquiry-basket/', { headers: { 'Authorization': `Bearer ${token}` } });

export const addInquiryBasketItem = (token, payload) =>
  fetchJson('/api/inquiry-basket/add-item/', jsonOptions('POST', payload, token));

export const removeInquiryBasketItem = (token, payload) =>
  fetchJson('/api/inquiry-basket/remove-item/', jsonOptions('POST', payload, token));

export const sendInquiryBasket = (token) =>
  fetchJson('/api/inquiry-basket/send/', jsonOptions('POST', {}, token));
