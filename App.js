// optional App.css
import './App.css';
import { AppShell, Navbar, Header, Text, MediaQuery, Burger, ActionIcon, Group, Anchor } from '@mantine/core';
import { MantineProvider } from '@mantine/core';
import { SunIcon, MoonIcon } from '@modulz/radix-icons';
import { useState, useEffect } from 'react';
import { createStyles, useMantineTheme } from '@mantine/styles';
import { MemoryRouter, NavLink, Route, Routes } from 'react-router-dom';
import localforage from 'localforage';
import { useTranslation } from 'react-i18next';

// import { invoke } from '@tauri-apps/api/tauri'

// import components to be used in views
// import Home from './Home';
// import Settings from './Settings';
// import CIFInfo from './CIFInfo';
// import About from './About';

import { defaultLng, translations } from './i18n';

// call stateSetter with value in storage given by key
function getItem(key, stateSetter, defaultValue) {
  localforage.getItem(key).then(value => stateSetter(value)).catch(_ => {
    stateSetter(defaultValue);
    localforage.setItem(key, defaultValue);
  });
}

const defaultColorScheme = 'dark';
const HEADER_TITLE = 'R2-T2: Modern T2 Corporate Internet Filing';

function App() {
  const { t, i18n } = useTranslation();
  // opened is for mobile nav
  const [mobileNavOpened, setMobileNavOpened] = useState(false);
  const [colorScheme, setColorScheme] = useState(defaultColorScheme);
  const [lang, setLang] = useState(i18n.resolvedLanguage);

  // load preferences using localForage
  useEffect(() => {
    getItem('colorScheme', setColorScheme, defaultColorScheme);
    getItem('lang', setLang, defaultLng);
  }, []);
  // look for language preference
  useEffect(() => {
    localforage.setItem('lang', lang);
    i18n.changeLanguage(lang);
  }, [lang]);

  const views = [
//     { component: Home, path: '/', exact: true, name: t('Home') },
//     { component: Settings, path: '/settings', name: t('Settings') },
//     { component: CIFInfo, path: '/cif-info', name: 'CIF ' + t('Info') },
//     { component: About, path: '/about', name: t('About') }
  ];

  function toggleColorScheme(value) {
    const newValue = value || (colorScheme === 'dark' ? 'light' : 'dark');
    setColorScheme(newValue);
    localforage.setItem('colorScheme', newValue);
  }

  // notification example
  function notify(title, body) {
    new Notification(title, {
      body: body || "",
    });
  }

  const useStyles = createStyles(theme => ({
    navLink: {
      display: 'block',
      width: '100%',
      padding: theme.spacing.xs,
      borderRadius: theme.radius.md,
      color: colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
      textDecoration: 'none',
      willChange: 'transform',

      '&:hover:active': {
        transform: 'translateY(2px)',
      },
    },
    navLinkActive: {
      backgroundColor: colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2],
    },
    navLinkInactive: {
      '&:hover': {
        backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[1]
      },
    },
    headerWrapper: {
      display: 'flex',
      alignItems: 'center',
      height: '100%'
    },
    headerRightItems: {
      marginLeft: "auto"
    },
    appShell: {
      main: { backgroundColor: colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0] }
    },
    mediaQuery: {
      display: 'none'
    }
  }));

  const onNavLinkClick = e => {
    setMobileNavOpened(false);
  }

  const { classes } = useStyles();

  function getLanguageHeaders() {
    return Object.keys(translations).map((supportedLang, index) =>
      <>
        {
          lang === supportedLang ?
            <Text>{supportedLang.toUpperCase()}</Text> :
            <Anchor onClick={() => setLang(supportedLang)}>{supportedLang.toUpperCase()}</Anchor>
        }
        <Text>{index < Object.keys(translations).length - 1 && '|'}</Text>
      </>);
  }

  return (
    <MantineProvider theme={{ colorScheme: colorScheme, fontFamily: 'Open Sans, sans serif' }} withGlobalStyles >
      <MemoryRouter>
        <AppShell padding="md" navbarOffsetBreakpoint="sm" fixed
          navbar={
            <Navbar width={{ sm: 200 }} p="xs" hidden={!mobileNavOpened} hiddenBreakpoint="sm">
              {
                // TODO: https://github.com/greena13/react-hotkeys#hotkeys-components
                views.map((view, index) => {
                  return (<NavLink align="left" to={view.path} key={index} onClick={e => onNavLinkClick(e)}
                    className={({ isActive }) => classes.navLink + ' ' + (isActive ? classes.navLinkActive : classes.navLinkInactive)}>
                    {/* TODO: Icons */}
                    <Group><Text>{view.name ? view.name : view.name}</Text></Group>
                  </NavLink>)
                })
              }
            </Navbar>
          }
          header={
            <Header height={70} p="md">
              <div className={classes.headerWrapper}>
                <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
                  <Burger opened={mobileNavOpened} onClick={() => setMobileNavOpened(o => !o)}
                    size="sm" color={useMantineTheme().colors.gray[6]} mr="xl" />
                </MediaQuery>
                <Text>{HEADER_TITLE}</Text>
                <Group className={classes.headerRightItems}>
                  {getLanguageHeaders()}
                  <ActionIcon className={classes.actionIcon} variant="default" onClick={() => toggleColorScheme()} size={30}>{colorScheme === 'dark' ? <SunIcon /> : <MoonIcon />}</ActionIcon>
                </Group>
              </div>
            </Header>
          }
          className={classes.appShell}>
          <Routes>
            {views.map((view, index) => <Route key={index} exact={view.exact} path={view.path} element={<view.component />} />)}
          </Routes>
        </AppShell>
      </MemoryRouter>
    </MantineProvider>
  );
}

export default App;
