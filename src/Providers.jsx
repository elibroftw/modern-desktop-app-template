// boilerplate components
import { NotificationsProvider } from '@mantine/notifications';
import { MantineProvider, ColorSchemeProvider, Loader, Center, Container } from '@mantine/core';
import { useHotkeys, useColorScheme } from '@mantine/hooks';
import { BrowserRouter } from 'react-router-dom';
import Cookies from 'js-cookie';
// when react-use-cookie gets better, use it instead for better logic abstraction
// import useCookie from 'react-use-cookie';
import Splashscreen from './Splashscreen';
import { useState } from 'react';

// I love boilerplate
export default function (props) {
    // colorScheme clever logic
    const cookieColorScheme = Cookies.get('colorScheme');
    const preferredColorScheme = useColorScheme();
    // use cookie only for theme because its synchronous
    const [colorScheme, setColorScheme] = useState(cookieColorScheme || preferredColorScheme);
    function toggleColorScheme(value) {
        value = value || (colorScheme === 'dark' ? 'light' : 'dark');
        // cookie expires in a millenia
        // sameSite != 'strict' because the cookie is not read for sensitive actions
        Cookies.set('colorScheme', value, { expires: 365000, sameSite: 'lax', path: '/' });
        setColorScheme(value);
    }
    useHotkeys([['mod+J', () => toggleColorScheme()]]);

    // long tasks should use useState(true)
    const [isLoading, setIsLoading] = useState(false);

    // override theme for Mantine (default props and styles)
    // https://mantine.dev/theming/mantine-provider/
    const theme = {
        colorScheme,
        loader: 'bars',
        fontFamily: 'Open Sans, sans serif',
        components: {
            Checkbox: { styles: { input: { cursor: 'pointer' }, label: { cursor: 'pointer' }}},
            TextInput: { styles: { label: { marginTop: '0.5rem' }}},
            Select: { styles: { label: { marginTop: '0.5rem' }}},
            Loader: { defaultProps: { size: 'xl' }}
        }
    }

    return (
        <MantineProvider theme={theme} withGlobalStyles withNormalizeCSS withCSSVariables>
            <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
                <NotificationsProvider>
                    <BrowserRouter>
                        {/* show splashscreen for inital data */}
                        {isLoading ? <Splashscreen /> : props.children}
                    </BrowserRouter>
                </NotificationsProvider>
            </ColorSchemeProvider>
        </MantineProvider>
    );
}
