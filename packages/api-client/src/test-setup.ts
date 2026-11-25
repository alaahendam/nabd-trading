import { server } from '@nabd/testing/msw';
import { afterAll, afterEach, beforeAll } from 'vitest';

// Every request in a test goes to the mock API; a request without a handler fails the test.
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
