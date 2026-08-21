import { describe, expect, it } from 'vitest'
import { COUNTRY_OPTIONS, findCountryOption, shouldShowShippedTag } from './countryConfig'

describe('countryConfig helpers', () => {
  it('finds a country by name or code', () => {
    expect(findCountryOption('ken')).toMatchObject({ code: 'KE' })
    expect(findCountryOption('US')).toMatchObject({ code: 'US' })
  })

  it('shows a shipped tag when a product comes from a different country', () => {
    const selectedCountry = COUNTRY_OPTIONS.find((option) => option.code === 'KE')
    const product = {
      supplier_country: 'US',
      country: 'United States',
      supplier_name: 'Northwind Goods',
    }

    expect(shouldShowShippedTag(product, selectedCountry)).toBe(true)
  })

  it('does not show a shipped tag for local products', () => {
    const selectedCountry = COUNTRY_OPTIONS.find((option) => option.code === 'KE')
    const product = {
      supplier_country: 'KE',
      country: 'Kenya',
    }

    expect(shouldShowShippedTag(product, selectedCountry)).toBe(false)
  })
})
