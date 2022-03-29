// optional App.css
import './App.css';
import { AppShell, Navbar, Header, Footer, Aside, Text, MediaQuery, Burger, ActionIcon, Group, Anchor, Button } from '@mantine/core';
import { MantineProvider } from '@mantine/core';
import { IoSunnySharp } from 'react-icons/io5';
import { BsMoonStarsFill } from 'react-icons/bs';
import { ImCross } from 'react-icons/im';
import { useState, useEffect, Fragment } from 'react';
import { createStyles, useMantineTheme } from '@mantine/styles';
import { MemoryRouter, NavLink, Route, Routes } from 'react-router-dom';
import localforage from 'localforage';
import { useTranslation } from 'react-i18next';
import { useHotkeys, useColorScheme } from '@mantine/hooks';

// talk to rust with
// import { invoke } from '@tauri-apps/api/tauri'

// import components to be used in views
// import Home from './Home';
// import Settings from './Settings';
// import CIFInfo from './CIFInfo';
// import About from './About';
import { defaultLng, translations } from './i18n';

// call stateSetter with value in storage given by key
function getItem(key, stateSetter, defaultValue) {
  localforage.getItem(key).then(value => {
    if (value === null) throw 'keyNotFound';
    stateSetter(value);
  }).catch(_ => {
    stateSetter(defaultValue);
    localforage.setItem(key, defaultValue);
  });
}

// notification example (different from mantine notification)
function notify(title, body) {
  new Notification(title, {
    body: body || "",
  });
}

// TODO: export this in constants.js
const HEADER_TITLE = 'HEADER_TITLE';
const FOOTER = 'FOOTER';

// TODO: footer can be fetched from online source
function App() {
  const { t, i18n } = useTranslation();
  // opened is for mobile nav
  const preferredColorScheme = useColorScheme();
  const [mobileNavOpened, setMobileNavOpened] = useState(false);
  const [colorScheme, setColorScheme] = useState(preferredColorScheme);
  const [lang, setLang] = useState(i18n.resolvedLanguage);
  const [footersSeen, setFootersSeen] = useState(new Set());

  // load preferences using localForage
  useEffect(() => {
    getItem('colorScheme', setColorScheme, preferredColorScheme);
    getItem('lang', setLang, defaultLng);
    getItem('footersSeen', setFootersSeen, new Set());
  }, []);
  // look for language preference
  useEffect(() => {
    localforage.setItem('lang', lang);
    i18n.changeLanguage(lang);
  }, [lang]);
  useEffect(() => localforage.setItem('footersSeen', footersSeen), [footersSeen]);

  const views = [
//     { component: Home, path: '/', exact: true, name: t('Home') },
//     { component: Settings, path: '/settings', name: t('Settings') },
//     { component: About, path: '/about', name: t('About') }
  ];

  function toggleColorScheme(value) {
    const newValue = value || (colorScheme === 'dark' ? 'light' : 'dark');
    setColorScheme(newValue);
    localforage.setItem('colorScheme', newValue);
  }

  useHotkeys([['mod+J', () => toggleColorScheme()]]);

  const onNavLinkClick = e => setMobileNavOpened(false);

  // todo: check if this can be abstracted
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
    header: {
      display: 'flex',
      alignItems: 'center',
      height: '100%'
    },
    headerRightItems: {
      marginLeft: 'auto',
    },
    appShell: {
      main: { backgroundColor: colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0] }
    },
    mediaQuery: {
      display: 'none'
    },
    footer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }
  }));

  const { classes } = useStyles();

  function LanguageHeaders() {
    return (Object.keys(translations).map((supportedLang, index) =>
      <Fragment key={index}>
        {
          lang === supportedLang ?
            <Text key={supportedLang} >{supportedLang.toUpperCase()}</Text> :
            <Anchor key={supportedLang} onClick={() => setLang(supportedLang)}>{supportedLang.toUpperCase()}</Anchor>
        }
        <Text key={`|-${index}`}>{index < Object.keys(translations).length - 1 && '|'}</Text>
      </Fragment>));
  }

  function NavLinks() {
    // TODO: useHotkeys + abstract this
    return (views.map((view, index) => {
      return (<NavLink align="left" to={view.path} key={index} onClick={e => onNavLinkClick(e)}
        className={({ isActive }) => classes.navLink + ' ' + (isActive ? classes.navLinkActive : classes.navLinkInactive)}>
        {/* TODO: Icons */}
        <Group><Text>{view.name ? view.name : view.name}</Text></Group>
      </NavLink>)
    }));
  }

  return (
    <MantineProvider theme={{ colorScheme, fontFamily: 'Open Sans, sans serif' }} withGlobalStyles >
      <MemoryRouter>
        <AppShell padding="md" navbarOffsetBreakpoint="sm" fixed
          navbar={
            <Navbar width={{ sm: 200 }} p="xs" hidden={!mobileNavOpened} hiddenBreakpoint="sm">
              <NavLinks />
            </Navbar>
          }
          header={
            <Header height={70} p="md" className={classes.header}>
              <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
                <Burger opened={mobileNavOpened} onClick={() => setMobileNavOpened(o => !o)}
                  size="sm" color={useMantineTheme().colors.gray[6]} mr="xl" />
              </MediaQuery>
              <Text>{HEADER_TITLE}</Text>
              <Group className={classes.headerRightItems}>
                <LanguageHeaders />
                <ActionIcon title='Ctrl + J' className={classes.actionIcon} variant="default" onClick={() => toggleColorScheme()} size={30}>
                  {colorScheme === 'dark' ? <IoSunnySharp size={'1.5em'} /> : <BsMoonStarsFill />}
                </ActionIcon>
              </Group>
            </Header>
          }
          // aside={
          //   <MediaQuery smallerThan="sm" styles={{ display: 'none' }}>
          //     <Aside p="md" hiddenBreakpoint="sm" width={{ sm: 200, lg: 300 }}>
          //       <Text>Right Side. Use for help or support menu?</Text>
          //     </Aside>
          //   </MediaQuery>
          // }
          footer={
            !footersSeen.has(FOOTER) &&
            <Footer height={40} p="xs" className={classes.footer}>
              {t(FOOTER)}
              <Button variant="subtle" size="xs" onClick={() => setFootersSeen(prev => new Set([...prev, FOOTER]))}>
                <ImCross />
              </Button>
            </Footer>
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
