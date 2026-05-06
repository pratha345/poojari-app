// backend/jest.setup.js — Global environment for all backend tests
process.env.NODE_ENV      = 'test';
process.env.JWT_SECRET    = 'test-jwt-secret-key-pojjari-2025';
process.env.JWT_EXPIRES_IN = '1d';
process.env.DB_HOST       = 'localhost';
process.env.DB_USER       = 'test';
process.env.DB_PASSWORD   = 'test';
process.env.DB_NAME       = 'pojjari_test';
