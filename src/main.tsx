import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import Providers from './Providers.jsx';
import './translations/i18n.js'; // for internationalization (translations)


const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>
);
