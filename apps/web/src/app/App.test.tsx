import { render, screen } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { createTestServices } from '../test/app-services';
import { App } from './App';
import { createAppRoutes } from './routes';

describe('App', () => {
  it('APP-15 renders the stock list inside the shell, with a main landmark', async () => {
    const { services } = createTestServices();
    const router = createMemoryRouter(createAppRoutes({ onError: () => undefined }), {
      initialEntries: ['/stocks'],
    });
    render(<App services={services} router={router} />);

    expect(await screen.findByRole('main')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: 'Stocks' })).toBeVisible();
    expect(screen.getByRole('banner')).toBeVisible();
  });
});
