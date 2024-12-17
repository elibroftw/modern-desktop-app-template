import '@fontsource/open-sans';
import { PropsWithChildren } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Mantine from './components/Mantine';
import { TauriProvider } from './tauri/TauriProvider';

export default function ({ children }: PropsWithChildren) {
	return (
		<TauriProvider>
			<Mantine>
				<BrowserRouter>
					{children}
				</BrowserRouter>
			</Mantine>
		</TauriProvider>
	);
}
