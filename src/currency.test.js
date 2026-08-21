import { describe, expect, it } from 'vitest'
import { resolveExchangeRate } from './currency'

describe('resolveExchangeRate', () => {
  it('uses explicit rates from the config payload when they are available', () => {
    const rate = resolveExchangeRate({ baseCurrency: 'KES', exchangeRates: { USD: 0.0082 } }, 'USD')
    expect(rate).toBe(0.0082)
  })

  it('uses the server-provided fallback rate when no per-currency entry exists', () => {
    const rate = resolveExchangeRate({ baseCurrency: 'KES', exchangeRate: 0.0283 }, 'AED')
    expect(rate).toBe(0.0283)
  })

  it('keeps the base currency at a 1:1 rate', () => {
    const rate = resolveExchangeRate({ baseCurrency: 'KES', exchangeRates: { KES: 1 } }, 'KES')
    expect(rate).toBe(1)
  })
})
