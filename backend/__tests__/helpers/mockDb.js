// __tests__/helpers/mockDb.js — Shared mock data for all backend tests
const bcrypt = require('bcryptjs');

// Pre-built mock entities (password hashed lazily the first time)
let _hashedPassword = null;

const getHashedPassword = async () => {
  if (!_hashedPassword) {
    _hashedPassword = await bcrypt.hash('Test@1234', 1); // rounds=1 for speed
  }
  return _hashedPassword;
};

const MOCK_USER = {
  id:          1,
  name:        'Test User',
  phone:       '9307720459',
  email:       'testuser@pojjari.com',
  role:        'user',
  tenant_id:   1,
  is_active:   true,
  is_verified: true,
};

const MOCK_ADMIN = {
  id:          99,
  name:        'Admin User',
  phone:       '9000000001',
  email:       'admin@pojjari.com',
  role:        'admin',
  tenant_id:   1,
  is_active:   true,
  is_verified: true,
};

const MOCK_PUJARI_USER = {
  id:          50,
  name:        'Test Pujari',
  phone:       '9000000002',
  email:       'pujari@pojjari.com',
  role:        'pujari',
  tenant_id:   1,
  is_active:   true,
  is_verified: true,
};

const MOCK_PENDING_PUJARI = {
  id:          10,
  user_id:     50,
  name:        'Test Pujari',
  phone:       '9000000002',
  experience_years: 5,
  city:        'Pune',
  status:      'pending',
  tenant_id:   1,
};

const MOCK_APPROVED_PUJARI = {
  ...MOCK_PENDING_PUJARI,
  id:     11,
  status: 'approved',
};

module.exports = {
  getHashedPassword,
  MOCK_USER,
  MOCK_ADMIN,
  MOCK_PUJARI_USER,
  MOCK_PENDING_PUJARI,
  MOCK_APPROVED_PUJARI,
};
