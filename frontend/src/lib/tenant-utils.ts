/**
 * Utility functions for tenant subdomain detection
 */

/**
 * Check if the current domain is a tenant subdomain
 * Returns false for localhost, 127.0.0.1, and the main domain
 */
export function isTenantSubdomain(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const hostname = window.location.hostname

  // Always return false for localhost and 127.0.0.1 (development)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return false
  }

  // Check if hostname contains a dot (subdomain.domain.com)
  // For production, you might want to check against a specific main domain
  const parts = hostname.split('.')
  
  // If there are more than 2 parts, it's likely a subdomain
  // Example: tenant.example.com has 3 parts
  // Example: example.com has 2 parts
  if (parts.length > 2) {
    // Check if it's not a known main domain
    // You can customize this logic based on your domain structure
    return true
  }

  return false
}

/**
 * Get the tenant slug from the current subdomain
 * Returns null if not on a tenant subdomain
 */
export function getTenantSlug(): string | null {
  if (!isTenantSubdomain()) {
    return null
  }

  if (typeof window === 'undefined') {
    return null
  }

  const hostname = window.location.hostname
  const parts = hostname.split('.')

  // The first part is usually the tenant slug
  // Example: tenant.example.com -> tenant
  if (parts.length > 0) {
    return parts[0]
  }

  return null
}

