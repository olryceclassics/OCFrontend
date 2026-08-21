export function resolvePostLoginRoute({ isVendorLogin, isStaffLogin, user }) {
  if (!isVendorLogin && !isStaffLogin) {
    return '/'
  }

  return user?.can_access_supplier_portal === true || user?.is_vendor_staff === true ? '/vendor-dashboard' : null
}
