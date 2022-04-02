import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
// boilerplate Mantine providers
import Providers from './Providers';
// for internationalization (translations)
import './i18n';

ReactDOM.render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>,
  document.getElementById('root')
);
