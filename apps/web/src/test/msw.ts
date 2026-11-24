import { setupServer } from 'msw/node';

/** The mock API for every test. Handlers are added per test; any unhandled request fails it. */
export const server = setupServer();

export const API_URL = 'http://api.test';
