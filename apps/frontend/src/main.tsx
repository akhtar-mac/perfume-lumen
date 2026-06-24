import './lib/env';
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';

const dsn = import.meta.env.VITE_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: false }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      return event;
    },
  });
}

const ErrorBoundary = dsn
  ? Sentry.withErrorBoundary(
      ({ children }) => <>{children}</>,
      {
        fallback: () => (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Something went wrong</h2>
            <p>Our team has been notified. Please refresh the page.</p>
          </div>
        ),
      }
    )
  : React.Fragment;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
