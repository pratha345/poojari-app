// src/test/setup.js — Global test setup for Vitest + React Testing Library
import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './mocks/server';

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset handlers after each test (no state leakage)
afterEach(() => server.resetHandlers());

// Clean up after all tests finish
afterAll(() => server.close());

// Suppress console.error for expected React warnings in tests
const originalConsoleError = console.error;
console.error = (...args) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('Warning: ReactDOM.render') ||
    msg.includes('Warning: An update to') ||
    msg.includes('Not implemented: navigation')
  ) return;
  originalConsoleError(...args);
};
