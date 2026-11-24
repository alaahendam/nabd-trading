import './styles/index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';

import { App } from './app/App';
import { createAppRoutes } from './app/routes';
import { createServices } from './app/services';
import { env } from './lib/env';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found');
}

const services = createServices(env.VITE_API_URL);
const router = createBrowserRouter(
  createAppRoutes({
    onError: (error) => {
      reportError(error);
    },
  }),
);

createRoot(container).render(
  <StrictMode>
    <App services={services} router={router} />
  </StrictMode>,
);
