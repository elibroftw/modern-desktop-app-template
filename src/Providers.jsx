// for mantive notifications
import { NotificationsProvider } from '@mantine/notifications';
import { MantineProvider, ColorSchemeProvider, Loader, Center, Container } from '@mantine/core';
import { useHotkeys, useColorScheme } from '@mantine/hooks';
import Cookies from 'js-cookie';
// when react-use-cookie gets better, use it instead for better logic abstraction
// import useCookie from 'react-use-cookie';
import Spashscreen from './Spashscreen';
import { useState } from 'react';

// I love boilerplate
export default function(props) {
    // cookie or system prefs
    const preferredColorScheme = Cookies.get('colorScheme') || useColorScheme();
    // use cookie only for theme because its synchronous
    const [ colorScheme, setColorScheme ] = useState(preferredColorScheme);
    // long tasks should use useState(true);
    const [isLoading, setIsLoading] = useState(false);
    function toggleColorScheme(value) {
        value = value || (colorScheme === 'dark' ? 'light' : 'dark');
        // cookie expires in a millenia
        // might want to set sameSite: 'Strict'
        Cookies.set('colorScheme', value, { expires: 365000, sameSite: 'lax', path: '/' });
        setColorScheme(value);
    }
    useHotkeys([['mod+J', () => toggleColorScheme()]]);

    // Override theme for Mantine
    const theme = {
        colorScheme,
        loader: 'bars',
        fontFamily: 'Open Sans, sans serif',
    }

    // https://mantine.dev/theming/mantine-provider/#styles-on-mantineprovider
    // Override styles for Mantine components
    const styles = {
        Checkbox: { input: { cursor: 'pointer' }, label: { cursor: 'pointer' } },
    }

    // default props for Mantine components
    const defaultProps = {}

    return (
        <MantineProvider theme={theme} styles={styles} withGlobalStyles>
            <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
                <NotificationsProvider>
                    {/* show splashscreen for inital data */}
                    {isLoading ? <Spashscreen /> : props.children}
                </NotificationsProvider>
            </ColorSchemeProvider>
        </MantineProvider>
    );
}
