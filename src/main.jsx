import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// boilerplate components
import Providers from './Providers';
// for internationalization (translations)
import './i18n';


const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>
);
