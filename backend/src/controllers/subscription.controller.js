// src/controllers/subscription.controller.js
// Tenant plan subscription via Razorpay
const Razorpay = require('razorpay');
const crypto   = require('crypto');
const pool     = require('../config/db');
const { success, error } = require('../utils/response.util');

// ── Plan pricing (INR) ────────────────────────────────────────
const PLANS = {
  basic:   { monthly: 999,  name: 'Basic Plan' },
  premium: { monthly: 2499, name: 'Premium Plan' },
};

function getRazorpay() {
  const key_id     = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret || key_id.includes('xxxx')) {
    return null; // Razorpay not configured yet
  }
  return new Razorpay({ key_id, key_secret });
}

// ── GET /api/subscription/plans ──────────────────────────────
// Returns plan options + current tenant status
exports.getPlans = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const [[tenant]] = await pool.query(
      'SELECT id, name, plan, trial_ends_at, plan_expires_at FROM tenants WHERE id=?',
      [tenantId]
    );
    if (!tenant) return error(res, 'Tenant सापडला नाही.', 404);

    const now = new Date();
    let status = 'active';
    let daysLeft = null;

    if (tenant.plan === 'trial' && tenant.trial_ends_at) {
      daysLeft = Math.ceil((new Date(tenant.trial_ends_at) - now) / 86400000);
      if (daysLeft <= 0) status = 'expired';
    } else if ((tenant.plan === 'basic' || tenant.plan === 'premium') && tenant.plan_expires_at) {
      daysLeft = Math.ceil((new Date(tenant.plan_expires_at) - now) / 86400000);
      if (daysLeft <= 0) status = 'expired';
    }

    return success(res, {
      current: {
        plan:            tenant.plan,
        status,
        days_left:       daysLeft,
        trial_ends_at:   tenant.trial_ends_at,
        plan_expires_at: tenant.plan_expires_at,
      },
      plans: [
        {
          id: 'basic', name: 'Basic Plan', price_monthly: 999,
          features: ['50 पुजारी', '200 bookings/month', 'Subdomain', 'Email support'],
        },
        {
          id: 'premium', name: 'Premium Plan', price_monthly: 2499,
          features: ['Unlimited पुजारी', 'Unlimited bookings', 'Custom domain', 'Priority support'],
          popular: true,
        },
      ],
      razorpay_configured: !!getRazorpay(),
    });
  } catch (err) {
    console.error(err);
    return error(res, 'Plan माहिती मिळवताना त्रुटी.');
  }
};

// ── POST /api/subscription/create-order ─────────────────────
exports.createOrder = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { plan, months } = req.body;

    if (!PLANS[plan]) return error(res, 'Plan basic किंवा premium असावा.', 400);
    const m = parseInt(months) || 1;
    if (m < 1 || m > 12) return error(res, 'Months 1 ते 12 असावेत.', 400);

    const [[tenant]] = await pool.query('SELECT id, name FROM tenants WHERE id=?', [tenantId]);
    if (!tenant) return error(res, 'Tenant सापडला नाही.', 404);

    const amountPaisa = PLANS[plan].monthly * m * 100; // Razorpay needs paise
    const receipt     = `sub_${tenantId}_${plan}_${Date.now()}`;
    const notes       = { tenant_id: String(tenantId), plan, months: String(m) };

    const rzp = getRazorpay();

    if (!rzp) {
      // ── Mock mode (Razorpay not configured) ────────────────
      const mockOrderId = 'order_mock_' + Date.now();
      return success(res, {
        order_id:      mockOrderId,
        amount:        amountPaisa,
        currency:      'INR',
        plan,
        months:        m,
        tenant_name:   tenant.name,
        mock_mode:     true,
        key_id:        'rzp_test_CONFIGURE_ME',
      }, 'Mock order (Razorpay keys configure करा)');
    }

    // ── Real Razorpay order ──────────────────────────────────
    const order = await rzp.orders.create({
      amount:   amountPaisa,
      currency: 'INR',
      receipt,
      notes,
    });

    return success(res, {
      order_id:    order.id,
      amount:      order.amount,
      currency:    order.currency,
      plan,
      months:      m,
      tenant_name: tenant.name,
      mock_mode:   false,
      key_id:      process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('createOrder error:', err);
    return error(res, 'Order तयार करताना त्रुटी.');
  }
};

// ── POST /api/subscription/verify ───────────────────────────
exports.verifyPayment = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { order_id, payment_id, signature, plan, months, mock_mode } = req.body;

    if (!order_id || !payment_id || !plan) {
      return error(res, 'order_id, payment_id, plan आवश्यक आहेत.', 400);
    }

    const m = parseInt(months) || 1;

    // ── Signature Verification ───────────────────────────────
    if (!mock_mode) {
      const key_secret = process.env.RAZORPAY_KEY_SECRET;
      if (!key_secret || key_secret.includes('your_razorpay')) {
        return error(res, 'Razorpay configure केलेले नाही.', 500);
      }
      const generated = crypto
        .createHmac('sha256', key_secret)
        .update(`${order_id}|${payment_id}`)
        .digest('hex');

      if (generated !== signature) {
        return error(res, 'Payment verification अयशस्वी. Invalid signature.', 400);
      }
    }

    // ── Update Plan ──────────────────────────────────────────
    const now = new Date();
    const expires = new Date(now);
    expires.setMonth(expires.getMonth() + m);

    await pool.query(
      `UPDATE tenants
       SET plan=?, plan_expires_at=?, trial_ends_at=NULL, is_active=TRUE,
           updated_at=NOW()
       WHERE id=?`,
      [plan, expires, tenantId]
    );

    // ── Log payment ──────────────────────────────────────────
    try {
      await pool.query(
        `INSERT INTO subscription_payments
           (tenant_id, order_id, payment_id, plan, months, amount, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'paid', NOW())`,
        [tenantId, order_id, payment_id, plan, m, (PLANS[plan].monthly * m)]
      );
    } catch {
      // Table may not exist yet — ignore, plan is updated
    }

    return success(res, {
      plan,
      months:          m,
      plan_expires_at: expires.toISOString().split('T')[0],
    }, `${PLANS[plan].name} यशस्वीरित्या activate झाला! 🎉`);

  } catch (err) {
    console.error('verifyPayment error:', err);
    return error(res, 'Payment verify करताना त्रुटी.');
  }
};

// ── POST /api/subscription/request (Admin — offline request) ──
exports.submitRequest = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { contact_name, contact_phone, contact_email, requested_plan, months, message } = req.body;
    if (!contact_name || !contact_phone || !requested_plan)
      return error(res, 'नाव, फोन आणि plan आवश्यक आहे.', 400);

    const [[tenant]] = await pool.query('SELECT name FROM tenants WHERE id=?', [tenantId]);
    await pool.query(
      `INSERT INTO plan_upgrade_requests
        (tenant_id, tenant_name, contact_name, contact_phone, contact_email, requested_plan, months, message)
       VALUES (?,?,?,?,?,?,?,?)`,
      [tenantId, tenant?.name || '', contact_name, contact_phone, contact_email || null,
       requested_plan, parseInt(months) || 1, message || null]
    );
    return success(res, {}, 'विनंती पाठवली! Super Admin लवकरच संपर्क करेल. 🙏', 201);
  } catch (err) {
    console.error('submitRequest error:', err);
    return error(res, 'विनंती पाठवताना त्रुटी झाली.');
  }
};

// ── GET /api/superadmin/plan-requests ─────────────────────────
exports.getPlanRequests = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    let where = '1=1';
    if (status !== 'all') where += ` AND r.status = '${status}'`;
    const [rows] = await pool.query(
      `SELECT r.*, t.plan AS current_plan, t.plan_expires_at
       FROM plan_upgrade_requests r
       LEFT JOIN tenants t ON r.tenant_id = t.id
       WHERE ${where}
       ORDER BY r.created_at DESC`
    );
    return success(res, rows);
  } catch (err) {
    return error(res, 'विनंत्या मिळवताना त्रुटी झाली.');
  }
};

// ── PUT /api/superadmin/plan-requests/:id/approve ─────────────
exports.approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const [[req_row]] = await pool.query('SELECT * FROM plan_upgrade_requests WHERE id=?', [id]);
    if (!req_row) return error(res, 'विनंती सापडली नाही.', 404);

    if (action === 'approve') {
      const months = req_row.months || 1;
      const expires = new Date();
      expires.setMonth(expires.getMonth() + months);
      await pool.query(
        `UPDATE tenants SET plan=?, plan_expires_at=?, trial_ends_at=NULL, is_active=TRUE WHERE id=?`,
        [req_row.requested_plan, expires, req_row.tenant_id]
      );
      await pool.query(
        `UPDATE plan_upgrade_requests SET status='approved', approved_by=?, approved_at=NOW() WHERE id=?`,
        [req.user.id, id]
      );
      return success(res, {}, `Plan "${req_row.requested_plan}" activate केला. ✅`);
    } else {
      await pool.query(`UPDATE plan_upgrade_requests SET status='rejected' WHERE id=?`, [id]);
      return success(res, {}, 'विनंती नाकारली.');
    }
  } catch (err) {
    return error(res, 'विनंती process करताना त्रुटी झाली.');
  }
};
