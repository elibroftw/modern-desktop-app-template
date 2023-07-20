// boilerplate components
import { ColorSchemeProvider, MantineProvider } from '@mantine/core';
import { useHotkeys, useInterval } from '@mantine/hooks';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Splashscreen from './Splashscreen';
import { TauriProvider } from './TauriProvider';
import { useCookie } from './utils';
import '@fontsource/open-sans';


// synchronous hook (for SSR, use mantine's)
function usingDarkTheme(fallback = true) {
    const [systemIsDark, setSystemIsDark] = useState(window.matchMedia === undefined ? fallback : window.matchMedia('(prefers-color-scheme: dark)').matches);
    const colorSchemeInterval = useInterval(() => {
      const prefersDarkTheme = window.matchMedia === undefined ? fallback : window.matchMedia('(prefers-color-scheme: dark)').matches;
      if(prefersDarkTheme != prefersDarkTheme) setSystemIsDark(prefersDarkTheme);
    }, 200);
    useEffect(() => {
      colorSchemeInterval.stop();
      return colorSchemeInterval.stop;
    }, []);
    return systemIsDark;
}

export default function ({ children }) {
    const systemColorScheme = usingDarkTheme() ? 'dark' : 'light';
    const [savedColorScheme, saveColorScheme] = useCookie('colorScheme');
    const colorScheme = savedColorScheme || systemColorScheme;

    function toggleColorScheme(value) {
      saveColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
    }

    useHotkeys([['mod+J', () => toggleColorScheme()]]);

    // long tasks should use useState(true)
    const [isLoading, setLoading] = useState(false);

    // override theme for Mantine (default props and styles)
    // https://mantine.dev/theming/mantine-provider/
    const theme = {
        colorScheme,
        loader: 'oval',
        fontFamily: 'Open Sans, sans-serif',
        components: {
            Checkbox: { styles: { input: { cursor: 'pointer' }, label: { cursor: 'pointer' } } },
            TextInput: { styles: { label: { marginTop: '0.5rem' } } },
            Select: { styles: { label: { marginTop: '0.5rem' } } },
            Loader: { defaultProps: { size: 'xl' } },
            Space: { defaultProps: { h: 'sm' } },
            Anchor: { defaultProps: { target: '_blank' } }
        },
        globalStyles: theme => ({
            '.row': {
                display: 'flex',
                alignItems: 'flex-end',
                '& > div': {
                    flexGrow: 1,
                }
            },
            '.rowCenter': {
                display: 'flex',
                alignItems: 'center',
                '& > div': {
                    flexGrow: 1,
                }
            },
            '.embeddedInput': {
                display: 'inline-block',
                margin: 'auto 5px',
            }
        })
    }

    return <MantineProvider theme={theme} withGlobalStyles withNormalizeCSS withCSSVariables>
        <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
            <ModalsProvider>
                <BrowserRouter>
                    <TauriProvider>
                        <Notifications />
                        {/* show splashscreen for inital data */}
                        {isLoading ? <Splashscreen /> : children}
                    </TauriProvider>
                </BrowserRouter>
            </ModalsProvider>
        </ColorSchemeProvider>
    </MantineProvider>;
}
