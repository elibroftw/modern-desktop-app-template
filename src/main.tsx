import * as tauriLogger from '@tauri-apps/plugin-log';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import App from './App.js';
import Providers from './Providers.jsx';
import './translations/i18n.js'; // for internationalization (translations)
import FallbackAppRender from './views/FallbackErrorBoundary.js';

const root = createRoot(document.getElementById('root')!);
root.render(
	<React.StrictMode>
		<Providers>
			<ErrorBoundary
				FallbackComponent={FallbackAppRender}
				// Reset the state of your app so the error doesn't happen again
				onReset={details => {
					location.pathname = '/';
				}}
				onError={e => tauriLogger.error(e.message)}>
				<App />
			</ErrorBoundary>
		</Providers>
	</React.StrictMode>
);
