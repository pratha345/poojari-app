// src/middleware/tenant.middleware.js
// Resolves which tenant a request belongs to (for public routes)
const pool = require('../config/db');
const { error } = require('../utils/response.util');

// Resolve tenant from subdomain, header, or query param
// Priority: X-Tenant-Slug header → subdomain → default (id=1)
const resolveTenant = async (req, res, next) => {
  // Always fall back gracefully — if tenants table doesn't exist yet, just continue
  req.tenant   = { id: 1, name: 'Default', slug: 'default' };
  req.tenantId = 1;

  try {
    let slug = null;

    if (req.headers['x-tenant-slug']) {
      slug = req.headers['x-tenant-slug'];
    }
    if (!slug) {
      const host = req.hostname || '';
      const parts = host.split('.');
      if (parts.length >= 3) slug = parts[0];
    }

    if (slug && slug !== 'www' && slug !== 'localhost') {
      const [[tenant]] = await pool.query(
        'SELECT id, name, slug, is_active FROM tenants WHERE slug = ?', [slug]
      );
      if (tenant && tenant.is_active) {
        req.tenant   = tenant;
        req.tenantId = tenant.id;
        return next();
      }
    }

    const [[defaultTenant]] = await pool.query(
      'SELECT id, name, slug, is_active FROM tenants WHERE id = 1'
    );
    if (defaultTenant) {
      req.tenant   = defaultTenant;
      req.tenantId = defaultTenant.id;
    }
  } catch {
    // tenants table not yet created — silently use defaults above
  }

  next();
};

// For authenticated routes: attach tenantId from JWT user
// super_admin can pass X-Tenant-ID header to operate in a specific tenant
const attachTenant = (req, res, next) => {
  if (!req.user) return next();

  if (req.user.role === 'super_admin') {
    const headerTenantId = req.headers['x-tenant-id'];
    req.tenantId = headerTenantId ? parseInt(headerTenantId) : null;
  } else {
    req.tenantId = req.user.tenant_id || 1;
  }
  next();
};

module.exports = { resolveTenant, attachTenant };
