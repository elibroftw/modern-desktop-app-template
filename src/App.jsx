import { AppShell, Navbar, Header, Footer, Text, MediaQuery, Burger, ActionIcon, Aside, Group, Anchor, Button, Space } from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import { IoSunnySharp } from 'react-icons/io5';
import { BsMoonStarsFill } from 'react-icons/bs';
import { ImCross } from 'react-icons/im';
import React, { useState, useEffect, Fragment, Suspense, useMemo, useRef } from 'react';
import { createStyles, useMantineTheme } from '@mantine/styles';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHotkeys } from '@mantine/hooks';
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater'
import { relaunch } from '@tauri-apps/api/process'
// talk to rust with
// import { invoke } from '@tauri-apps/api/tauri'

// local js files
import { RUNNING_IN_TAURI, useLocalForage } from './utils';

// fallback for React Suspense
import Fallback from './Views/Fallback';

// imported views need to be added to `views`
import ExampleView from './Views/ExampleView';
import { showNotification } from '@mantine/notifications';
// import Home from './Views/Home';
// import About from './Views/About';
// import CIFInfo from './Views/CIFInfo';
// if your views are large, you can use lazy loading to reduce the initial load time
// const Settings = lazy(() => import('./Views/Settings'));

// constants
const HEADER_TITLE = 'HEADER_TITLE goes here';
const FOOTER = 'FOOTER goes here';
const defualtFooterSeen = {};
// TODO: footer fetched from online source
function App() {
  const { t, i18n } = useTranslation();
  // left sidebar
  const views = [
    //     { component: () => <Home prop1={'stuff'} />, path: '/home', name: t('Home') },
    //     { component: CIFInfo, path: '/cif-info', name: 'CIF ' + t('Info') },
    //     { component: React.memo(About), path: '/about', name: t('About') }
    { component: ExampleView, path: '/example-view', name: t('ExampleView') },
  ];

  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  // opened is for mobile nav
  const [mobileNavOpened, setMobileNavOpened] = useState(false);
  // load preferences using localForage
  const [footersSeen, setFootersSeen, footersSeenLoading] = useLocalForage('footersSeen', defualtFooterSeen);
  const lang = i18n.resolvedLanguage;

  // getAppStyles defined below App()
  const { classes } = getAppStyles();
  const [navbarClearance, setNavbarClearance] = useState(0);
  const footerRef = useRef(null);
  useEffect(() => {
    if (footerRef.current) setNavbarClearance(footerRef.current.clientHeight);
  }, [footersSeen]);

  // Updater integration

  function startInstall(newVersion) {
    showNotification({ title: t('Installing update v{{ v }}', { v: newVersion }), message: t('Will relaunch afterwards'), autoClose: false });
    installUpdate().then(relaunch);
  }

  useEffect(() => {
    if (RUNNING_IN_TAURI) {
      checkUpdate().then(({ shouldUpdate, manifest }) => {
        if (shouldUpdate) {
          const { version: newVersion, body: releaseNotes } = manifest;
          const color = colorScheme === 'dark' ? 'teal' : 'teal.8';
          showNotification({
            title: t('Update v{{ v }} available', { v: newVersion }),
            color,
            message: <>
              <Text>{releaseNotes}</Text>
              <Button color={color} style={{ width: '100%' }} onClick={() => startInstall(newVersion)}>{t('Install update and relaunch')}</Button>
            </>,
            autoClose: false
          });
        }
      });
    }
  }, []);

  function LanguageHeaders() {
    const languages = Object.keys(i18n.options.resources);
    let nextLangIdx = 0;

    function cycleLang() {
      if (nextLangIdx == languages.length) nextLangIdx = 0;
      i18n.changeLanguage(languages[nextLangIdx])
    }

    const header = languages.map((supportedLang, index) => {
      const selectedLang = lang === supportedLang;
      if (selectedLang) nextLangIdx = index + 1;
      return <Fragment key={index}>
        {/* language code is a link if not the current language */}
        {selectedLang ?
          <Text>{supportedLang.toUpperCase()}</Text> :
          <Anchor onClick={() => i18n.changeLanguage(supportedLang)}>{supportedLang.toUpperCase()}</Anchor>}
        <Text>{index < languages.length - 1 && '|'}</Text>
      </Fragment>
    });
    useHotkeys([['mod+Shift+L', cycleLang]]);
    return header;
  }

  function NavLinks() {
    // TODO: useHotkeys and abstract this
    return views.map((view, index) =>
      <NavLink align='left' to={view.path} key={index} end={view.exact} onClick={() => setMobileNavOpened(false)}
        className={({ isActive }) => classes.navLink + ' ' + (isActive ? classes.navLinkActive : classes.navLinkInactive)}>
        {/* TODO: Icons */}
        <Group><Text>{view.name ? view.name : view.name}</Text></Group>
      </NavLink>
    );
  }

  function shouldShowFooter() { return FOOTER && !footersSeenLoading && !(FOOTER in footersSeen); }

  function FooterText() {
    // footer output logic goes here
    // example: parse JSON output from online source
    return t(FOOTER);
  }

  return <>
    <AppShell padding="md" navbarOffsetBreakpoint="sm"
      navbar={
        <Navbar height='100%' width={{ sm: 200 }} p="xs" hidden={!mobileNavOpened} hiddenBreakpoint="sm">
          <Navbar.Section grow><NavLinks /></Navbar.Section>
          <Navbar.Section>
            {/* Bottom of Navbar Example: https://github.com/mantinedev/mantine/blob/master/src/mantine-demos/src/demos/core/AppShell/_user.tsx */}
            <Space h={navbarClearance} /> {/* Acount for footer */}
          </Navbar.Section>
        </Navbar>
      }
      header={
        <Header height={70} p="md" className={classes.header}>
          <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
            <Burger opened={mobileNavOpened} onClick={() => setMobileNavOpened(o => !o)}
              size="sm" mr="xl" color={useMantineTheme().colors.gray[6]} />
          </MediaQuery>
          <Text>{HEADER_TITLE}</Text>
          <Group className={classes.headerRightItems}>
            <LanguageHeaders />
            <ActionIcon title='Ctrl + J' className={classes.actionIcon} variant="default" onClick={() => toggleColorScheme()} size={30}>
              {/* icon to show based on colorScheme */}
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
        shouldShowFooter() &&
        <Footer height={'fit-content'} p="xs" className={classes.footer}>
          <FooterText />
          <Button variant="subtle" size="xs" onClick={() => setFootersSeen(prev => ({ ...prev, [FOOTER]: '' }))}>
            <ImCross />
          </Button>
        </Footer>
      }
      className={classes.appShell}>
      <Routes>
        <Route exact path='/' element={<Navigate to={views[0].path} />} />
        {views.map((view, index) => <Route key={index} exact={view.exact}
          path={view.path} element={
            <React.Suspense fallback={<Fallback />}><view.component /></React.Suspense>
          } />)}
      </Routes>
    </AppShell>
  </>;
}

// this can exported in styles.js
const getAppStyles = createStyles(theme => ({
  navLink: {
    display: 'block',
    width: '100%',
    padding: theme.spacing.xs,
    borderRadius: theme.radius.md,
    color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
    textDecoration: 'none',
    willChange: 'transform',

    '&:hover:active': {
      transform: 'translateY(2px)',
    },
  },
  navLinkActive: {
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2],
  },
  navLinkInactive: {
    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[1]
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
    main: { backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0] }
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

export default App;
