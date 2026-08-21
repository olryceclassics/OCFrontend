import test from 'node:test'
import assert from 'node:assert/strict'
import { resolvePostLoginRoute } from './authRouting.mjs'

test('normal login routes to the storefront', () => {
  assert.equal(resolvePostLoginRoute({ isVendorLogin: false, user: { can_access_supplier_portal: true } }), '/')
})

test('vendor login routes to the vendor dashboard for approved sellers', () => {
  assert.equal(resolvePostLoginRoute({ isVendorLogin: true, user: { can_access_supplier_portal: true } }), '/vendor-dashboard')
})

test('vendor login stays on the vendor portal when seller access is missing', () => {
  assert.equal(resolvePostLoginRoute({ isVendorLogin: true, user: { can_access_supplier_portal: false } }), null)
})
