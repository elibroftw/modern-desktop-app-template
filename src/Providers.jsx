// boilerplate components
import { ColorSchemeProvider, MantineProvider } from '@mantine/core';
import { useColorScheme, useHotkeys } from '@mantine/hooks';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Splashscreen from './Splashscreen';
import { TauriProvider } from './TauriProvider';
import { useCookie } from './utils';

// I love boilerplate
export default function ({ children }) {
    const preferredColorScheme = useColorScheme();
    const [colorScheme, setColorScheme] = useCookie('colorScheme', preferredColorScheme);

    function toggleColorScheme(value) {
        setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
    }

    useHotkeys([['mod+J', () => toggleColorScheme()]]);

    // long tasks should use useState(true)
    const [isLoading, setLoading] = useState(false);

    // override theme for Mantine (default props and styles)
    // https://mantine.dev/theming/mantine-provider/
    const theme = {
        colorScheme,
        loader: 'oval',
        fontFamily: 'Open Sans, sans serif',
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
