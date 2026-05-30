// src/middleware/planExpiry.middleware.js
// Blocks API requests for expired tenants
const pool = require('../config/db');
const { error } = require('../utils/response.util');

const checkPlanExpiry = async (req, res, next) => {
  try {
    const tenantId = req.tenantId || req.user?.tenant_id;

    // super_admin & default tenant — always allow
    if (!tenantId || tenantId === 1 || req.user?.role === 'super_admin') return next();

    const [[tenant]] = await pool.query(
      'SELECT id, plan, trial_ends_at, plan_expires_at, is_active FROM tenants WHERE id=?',
      [tenantId]
    );

    if (!tenant || !tenant.is_active) {
      return error(res, 'तुमचे account निष्क्रिय आहे. Super admin शी संपर्क करा.', 403);
    }

    const now = new Date();

    if (tenant.plan === 'trial') {
      if (tenant.trial_ends_at && new Date(tenant.trial_ends_at) < now) {
        return error(res, 'तुमचा 30 दिवसांचा Trial संपला आहे. Plan upgrade करा.', 402);
      }
    } else if (tenant.plan === 'basic' || tenant.plan === 'premium') {
      if (tenant.plan_expires_at && new Date(tenant.plan_expires_at) < now) {
        return error(res, 'तुमची subscription संपली आहे. Plan renew करा.', 402);
      }
    }

    next();
  } catch (err) {
    console.error('planExpiry middleware error:', err);
    next(); // fail open — don't block on DB error
  }
};

module.exports = { checkPlanExpiry };
