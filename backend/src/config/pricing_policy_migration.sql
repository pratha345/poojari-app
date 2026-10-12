-- Per-tenant pricing policy controlled by the super admin (see services/pricingService.js).
-- NULL = defaults: franchise and pujari pricing allowed, 50%–300% of the price below, 5% commission.
ALTER TABLE tenants ADD COLUMN pricing_policy JSON NULL AFTER features;
