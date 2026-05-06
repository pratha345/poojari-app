// src/test/mocks/server.js — MSW Node server (used in Vitest/jsdom)
import { setupServer } from 'msw/node';
import { handlers }    from './handlers';

export const server = setupServer(...handlers);
