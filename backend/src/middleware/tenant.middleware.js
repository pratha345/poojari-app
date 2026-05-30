// src/middleware/tenant.middleware.js
// Resolves which tenant a request belongs to (for public routes)
const pool = require('../config/db');
const { error } = require('../utils/response.util');

const TENANT_COLS = 'id, name, slug, is_active, plan, trial_ends_at, plan_expires_at';

// Resolve tenant from subdomain, header, or query param
// Priority: X-Tenant-Slug header → subdomain → default (id=1)
const resolveTenant = async (req, res, next) => {
  req.tenant   = { id: 1, name: 'Default', slug: 'default', plan: 'premium' };
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
        `SELECT ${TENANT_COLS} FROM tenants WHERE slug = ?`, [slug]
      );
      if (tenant && tenant.is_active) {
        req.tenant   = tenant;
        req.tenantId = tenant.id;
        return next();
      }
    }

    const [[defaultTenant]] = await pool.query(
      `SELECT ${TENANT_COLS} FROM tenants WHERE id = 1`
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

// Block API access if tenant subscription has expired
const subscriptionGate = (req, res, next) => {
  const t = req.tenant;
  if (!t || t.id === 1) return next(); // main site always open

  if (!t.is_active)
    return res.status(403).json({ success: false, message: 'हे खाते निष्क्रिय आहे. कृपया admin शी संपर्क करा.' });

  const now = new Date();
  if (t.plan === 'trial' && t.trial_ends_at && new Date(t.trial_ends_at) < now)
    return res.status(402).json({ success: false, message: 'Trial संपला. कृपया plan upgrade करा.' });

  if ((t.plan === 'basic' || t.plan === 'premium') && t.plan_expires_at && new Date(t.plan_expires_at) < now)
    return res.status(402).json({ success: false, message: 'Subscription संपला. कृपया renew करा.' });

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

module.exports = { resolveTenant, attachTenant, subscriptionGate };
