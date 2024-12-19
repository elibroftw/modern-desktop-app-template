// core styles are required for all packages
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
// other css files are required only if
// you are using components from the corresponding package
// import '@mantine/dates/styles.css';
// import '@mantine/dropzone/styles.css';
// import '@mantine/code-highlight/styles.css';

import { ColorSchemeScript, MantineProvider, createTheme } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { PropsWithChildren } from 'react';
import classes from './Mantine.module.css';

export default function Mantine({ children }: PropsWithChildren) {
	// override theme for Mantine (default props and styles)
	// https://mantine.dev/theming/mantine-provider/

	const theme = createTheme({
		// Added Segoe UI Variable Text (Win11) to https://mantine.dev/theming/typography/#system-fonts
		fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI Variable Text, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji',
		// added source-code-pro and SFMono-Regular
		fontFamilyMonospace: 'source-code-pro, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
		components: {
			Checkbox: { styles: { input: { cursor: 'pointer' }, label: { cursor: 'pointer' } } },
			TextInput: { styles: { label: { marginTop: '0.5rem' } } },
			Select: { styles: { label: { marginTop: '0.5rem' } } },
			Loader: { defaultProps: { size: 'xl', variant: 'oval' } },
			Space: { defaultProps: { h: 'sm' } },
			Anchor: { defaultProps: { target: '_blank' } },
			Burger: { styles: { burger: { color: '--mantine-color-grey-6' } } },
			CopyButton: { defaultProps: { timeout: 1100 } },
			SegmentedControl: { classNames: { root: classes.segmentedControlRoot } },
		},
		// Mantine v7 has ugly dark colors. Therefore, use colors from v6 (https://v6.mantine.dev/theming/colors/#default-colors)
		colors: {
			dark: ['#C1C2C5', '#A6A7AB', '#909296', '#5c5f66', '#373A40', '#2C2E33', '#25262b', '#1A1B1E', '#141517', '#101113']
		}
	});

	const cssVariablesResolver = () => ({
		variables: {},
		light: {},
		dark: {}
	});

	return <>
		<ColorSchemeScript defaultColorScheme='auto' />
		<MantineProvider defaultColorScheme='auto' theme={theme} cssVariablesResolver={cssVariablesResolver}>
			<ModalsProvider>
				<Notifications />
				{children}
			</ModalsProvider>
		</MantineProvider>
	</>
}
