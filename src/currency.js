import React, { createContext, useContext, useMemo } from 'react'

const CurrencyContext = createContext({ currency: 'KES', rate: 1, locale: 'en-KE', language: 'English', country: null })

const LOCALE_BY_CURRENCY = {
  USD: 'en-US',
  KES: 'en-KE',
  UGX: 'en-UG',
  EUR: 'en-IE',
  GBP: 'en-GB',
  TZS: 'en-TZ',
  RWF: 'en-RW',
  ZMW: 'en-ZM',
  NGN: 'en-NG',
  GHS: 'en-GH',
  AED: 'ar-AE',
  EGP: 'ar-EG',
  ZAR: 'en-ZA',
  INR: 'en-IN',
  CNY: 'zh-CN',
  SAR: 'ar-SA',
  AUD: 'en-AU',
}

const DEFAULT_LOCALE = 'en-US'

export function CurrencyProvider({ currency = 'KES', rate = 1, locale = 'en-KE', language = 'English', country = null, children }) {
  const value = useMemo(() => ({ currency, rate, locale, language, country }), [currency, rate, locale, language, country])
  return React.createElement(CurrencyContext.Provider, { value }, children)
}

export function useCurrency() {
  return useContext(CurrencyContext)
}

export function resolveExchangeRate(configObj = {}, currency) {
  const safeCurrency = String(currency || '').trim().toUpperCase()
  if (!safeCurrency) return 1

  const baseCurrency = String(configObj?.baseCurrency || 'KES').trim().toUpperCase()
  if (safeCurrency === baseCurrency) return 1

  const configuredRate = configObj?.exchangeRates?.[safeCurrency]
  if (configuredRate != null) {
    const parsed = Number(configuredRate)
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
  }

  const fallbackRate = configObj?.exchangeRate
  if (fallbackRate != null) {
    const parsed = Number(fallbackRate)
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
  }

  return 1
}

export function formatCurrency(value, currency = 'KES', rate = 1, localeOverride = null) {
  const numericValue = Number(value || 0)
  const converted = numericValue * Number(rate || 1)
  const locale = localeOverride || LOCALE_BY_CURRENCY[currency] || DEFAULT_LOCALE

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(converted)
}
