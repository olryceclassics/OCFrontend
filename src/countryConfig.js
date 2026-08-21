export const COUNTRY_OPTIONS = [
  { code: 'KE', name: 'Kenya', currency: 'KES', language: 'English', locale: 'en-KE', languageCode: 'en' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', language: 'English', locale: 'en-UG', languageCode: 'en' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', language: 'Swahili', locale: 'en-TZ', languageCode: 'sw' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF', language: 'French', locale: 'fr-RW', languageCode: 'fr' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', language: 'English', locale: 'en-NG', languageCode: 'en' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', language: 'English', locale: 'en-GH', languageCode: 'en' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', language: 'English', locale: 'en-ZA', languageCode: 'en' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', language: 'Arabic', locale: 'ar-EG', languageCode: 'ar' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', language: 'Arabic', locale: 'ar-AE', languageCode: 'ar' },
  { code: 'US', name: 'United States', currency: 'USD', language: 'English', locale: 'en-US', languageCode: 'en' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', language: 'English', locale: 'en-GB', languageCode: 'en' },
  { code: 'FR', name: 'France', currency: 'EUR', language: 'French', locale: 'fr-FR', languageCode: 'fr' },
  { code: 'DE', name: 'Germany', currency: 'EUR', language: 'German', locale: 'de-DE', languageCode: 'de' },
  { code: 'IT', name: 'Italy', currency: 'EUR', language: 'Italian', locale: 'it-IT', languageCode: 'it' },
  { code: 'ES', name: 'Spain', currency: 'EUR', language: 'Spanish', locale: 'es-ES', languageCode: 'es' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR', language: 'Dutch', locale: 'nl-NL', languageCode: 'nl' },
  { code: 'IN', name: 'India', currency: 'INR', language: 'Hindi', locale: 'en-IN', languageCode: 'hi' },
  { code: 'CN', name: 'China', currency: 'CNY', language: 'Chinese', locale: 'zh-CN', languageCode: 'zh' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', language: 'Arabic', locale: 'ar-SA', languageCode: 'ar' },
  { code: 'AU', name: 'Australia', currency: 'AUD', language: 'English', locale: 'en-AU', languageCode: 'en' },
]

const COUNTRY_ALIASES = {
  kenya: 'KE',
  ke: 'KE',
  uganda: 'UG',
  ug: 'UG',
  tanzania: 'TZ',
  tz: 'TZ',
  rwanda: 'RW',
  rw: 'RW',
  nigeria: 'NG',
  ng: 'NG',
  ghana: 'GH',
  gh: 'GH',
  'south africa': 'ZA',
  za: 'ZA',
  egypt: 'EG',
  eg: 'EG',
  'united arab emirates': 'AE',
  uae: 'AE',
  ae: 'AE',
  'united states': 'US',
  'united states of america': 'US',
  us: 'US',
  'united kingdom': 'GB',
  uk: 'GB',
  gb: 'GB',
  france: 'FR',
  fr: 'FR',
  germany: 'DE',
  de: 'DE',
  italy: 'IT',
  it: 'IT',
  spain: 'ES',
  es: 'ES',
  netherlands: 'NL',
  nl: 'NL',
  india: 'IN',
  in: 'IN',
  china: 'CN',
  cn: 'CN',
  'saudi arabia': 'SA',
  sa: 'SA',
  australia: 'AU',
  au: 'AU',
}

export function findCountryOption(query) {
  if (!query) return COUNTRY_OPTIONS[0]

  const safeQuery = String(query).trim().toLowerCase()
  if (!safeQuery) return COUNTRY_OPTIONS[0]

  const aliasCode = COUNTRY_ALIASES[safeQuery]
  if (aliasCode) {
    return COUNTRY_OPTIONS.find((option) => option.code === aliasCode) || COUNTRY_OPTIONS[0]
  }

  const exactMatch = COUNTRY_OPTIONS.find((option) => {
    return [option.code, option.name, option.currency, option.language].some((value) =>
      String(value).toLowerCase() === safeQuery
    )
  })

  if (exactMatch) return exactMatch

  const fuzzyMatch = COUNTRY_OPTIONS.find((option) => {
    return [option.code, option.name, option.currency, option.language].some((value) =>
      String(value).toLowerCase().includes(safeQuery)
    )
  })

  return fuzzyMatch || COUNTRY_OPTIONS[0]
}

export function getProductOriginCountry(product) {
  if (!product) return null

  const candidateValues = [
    product.country,
    product.supplier_country,
    product.shop_country,
    product.country_name,
    product.origin_country,
    product.supplier?.country,
    product.supplier?.country_name,
    product.supplier_country_code,
    product.shop_country_code,
  ]

  return candidateValues.find((value) => Boolean(value)) || null
}

export function shouldShowShippedTag(product, selectedCountry) {
  if (!selectedCountry || !product) return false

  const originCountry = getProductOriginCountry(product)
  if (!originCountry) return false

  const normalizedSelected = String(selectedCountry.code || '').toUpperCase()
  const normalizedOrigin = String(originCountry).trim().toUpperCase()

  if (!normalizedSelected || !normalizedOrigin) return false

  const selectedOption = COUNTRY_OPTIONS.find((option) => option.code === normalizedSelected)
  const originOption = COUNTRY_OPTIONS.find((option) => option.code === normalizedOrigin)

  if (originOption && selectedOption) {
    return originOption.code !== selectedOption.code
  }

  const selectedName = selectedOption?.name?.toLowerCase() || ''
  const originName = String(originCountry).toLowerCase()
  return selectedName && originName && !originName.includes(selectedName)
}
