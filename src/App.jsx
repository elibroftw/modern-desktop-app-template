// import './App.css';
import { AppShell, Navbar, Header, Footer, Aside, Text, MediaQuery, Burger, ActionIcon, Group, Anchor, Button, Checkbox } from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import { IoSunnySharp } from 'react-icons/io5';
import { BsMoonStarsFill } from 'react-icons/bs';
import { ImCross } from 'react-icons/im';
import React, { useState, useEffect, Fragment, Suspense, useMemo } from 'react';
import { createStyles, useMantineTheme } from '@mantine/styles';
import { MemoryRouter, NavLink, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHotkeys } from '@mantine/hooks';
// talk to rust with
// import { invoke } from '@tauri-apps/api/tauri'

// local js files
import { useLocalForage } from './utils';
import { translations } from './i18n';

// imported views need to be added to `views`
import Home from './Views/Home';
import Settings from './Views/Settings';
import CIFInfo from './Views/CIFInfo';
import About from './Views/About';

// constants
const HEADER_TITLE = 'R2-T2: Modern T2 Corporate Internet Filing';
const FOOTER = 'All changes are saved automatically! No save files required! Portability features will be coming soon.';
const defualtFooterSeen = {};
// TODO: footer fetched from online source
function App() {
  const { t, i18n } = useTranslation();
  // left sidebar
  // todo: add Example for template
  const views = [
//     { component: Home, path: '/', exact: true, name: t('Home') },
//     { component: Settings, path: '/settings', name: t('Settings') },
//     { component: CIFInfo, path: '/cif-info', name: 'CIF ' + t('Info') },
//     { component: About, path: '/about', name: t('About') }
  ];

  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  // opened is for mobile nav
  const [mobileNavOpened, setMobileNavOpened] = useState(false);
  // load preferences using localForage
  const [footersSeen, setFootersSeen, footersSeenLoading] = useLocalForage('footersSeen', defualtFooterSeen);
  const [lang, setLang] = useLocalForage('lang', i18n.resolvedLanguage);
  // catch language changes
  useEffect(() => i18n.changeLanguage(lang), [lang]);

  // getStyles defined below App()
  const classes = getAppStyles();

  function LanguageHeaders() {
    return Object.keys(translations).map((supportedLang, index) =>
      <Fragment key={index}>
        {
          lang === supportedLang ?
            <Text key={supportedLang} >{supportedLang.toUpperCase()}</Text> :
            <Anchor key={supportedLang} onClick={() => setLang(supportedLang)}>{supportedLang.toUpperCase()}</Anchor>
        }
        <Text key={`|-${index}`}>{index < Object.keys(translations).length - 1 && '|'}</Text>
      </Fragment>
    );
  }

  function NavLinks() {
    // TODO: useHotkeys and abstract this
    return views.map((view, index) =>
      <NavLink align="left" to={view.path} key={index} onClick={_ => setMobileNavOpened(false)}
        className={({ isActive }) => classes.navLink + ' ' + (isActive ? classes.navLinkActive : classes.navLinkInactive)}>
        {/* TODO: Icons */}
        <Group><Text>{view.name ? view.name : view.name}</Text></Group>
      </NavLink>
    );
  }

  return (
    <MemoryRouter>
      <AppShell padding="md" navbarOffsetBreakpoint="sm" fixed
        navbar={
          <Navbar height='100%' width={{ sm: 200 }} p="xs" hidden={!mobileNavOpened} hiddenBreakpoint="sm">
            <NavLinks />
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
          !footersSeenLoading && !(FOOTER in footersSeen) &&
            <Footer height={'fit-content'} p="xs" className={classes.footer}>
              {t(FOOTER)}
              <Button variant="subtle" size="xs" onClick={() => setFootersSeen(prev => ({ ...prev, [FOOTER]: '' }))}>
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
  );
}

// this can exported in styles.js
// this needs to be memoized
function getAppStyles() {
  const { classes } = createStyles(theme => ({
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
  }))();
  return classes;
}



export default App;
