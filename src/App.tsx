import { ActionIcon, AppShell, AppShellAside, AppShellFooter, AppShellHeader, AppShellMain, AppShellNavbar, AppShellSection, Burger, Button, Group, Space, Text, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { useDisclosure, useHotkeys } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import * as tauriEvent from '@tauri-apps/api/event';
import { relaunch } from '@tauri-apps/api/process';
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater';
import { appWindow } from '@tauri-apps/api/window';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BsMoonStarsFill } from 'react-icons/bs';
import { ImCross } from 'react-icons/im';
import { IoSunnySharp } from 'react-icons/io5';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';

import classes from './App.module.css';
import { FOOTER, HEADER_TITLE, useCookie, useLocalForage } from './common/utils';
import LanguageHeaders from './components/LanguageHeaders';
import { ScrollToTop } from './components/ScrollToTop';
import { RUNNING_IN_TAURI, useTauriContext } from './tauri/TauriProvider';
import ExampleView from './views/ExampleView';
import { TitleBar } from './tauri/TitleBar';
// fallback for React Suspense
// import Home from './Views/Home';
// import About from './Views/About';
// import CIFInfo from './Views/CIFInfo';
// if your views are large, you can use lazy loading to reduce the initial load time
// const Settings = lazy(() => import('./Views/Settings'));

// imported views need to be added to the `views` list variable
interface View {
  component: () => ReactNode,
  path: string,
  exact?: boolean,
  name: string
}

export default function () {
  const { t } = useTranslation();
  // check if using custom titlebar to adjust other components
  const { usingCustomTitleBar } = useTauriContext();

  // left sidebar
  const views: View[] = [
    //     { component: () => <Home prop1={'stuff'} />, path: '/home', name: t('Home') },
    //     { component: CIFInfo, path: '/cif-info', name: 'CIF ' + t('Info') },
    //     { component: React.memo(About), path: '/about', name: t('About') },
    // Suspense example when a component was lazy loaded
    //     { component: () => <React.Suspense fallback={<Fallback />}><Setting /></React.Suspense>, path: '/settings', name: t('Settings') },
    { component: ExampleView, path: '/example-view', name: t('ExampleView') },
  ];

  const { toggleColorScheme } = useMantineColorScheme();
  const colorScheme = useComputedColorScheme();
  useHotkeys([['ctrl+J', toggleColorScheme]]);

  // opened is for mobile nav
  const [mobileNavOpened, { toggle: toggleMobileNav }] = useDisclosure();

  const [desktopNavOpenedCookie, setDesktopNavOpenedCookie] = useCookie('desktop-nav-opened', 'true');
  const desktopNavOpened = desktopNavOpenedCookie === 'true';
  const toggleDesktopNav = () => setDesktopNavOpenedCookie(o => o === 'true' ? 'false' : 'true');

  const [scroller, setScroller] = useState<HTMLElement | null>(null);
  // load preferences using localForage
  const [footersSeen, setFootersSeen, footersSeenLoading] = useLocalForage('footersSeen', {});

  const [navbarClearance, setNavbarClearance] = useState(0);
  const footerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (footerRef.current) setNavbarClearance(footerRef.current.clientHeight);
  }, [footersSeen]);

  // Updater integration

  function startInstall(newVersion: string) {
    notifications.show({ title: t('installingUpdate', { v: newVersion }), message: t('relaunchMsg'), autoClose: false });
    installUpdate().then(relaunch);
  }

  // Tauri event listeners (run on mount)
  if (RUNNING_IN_TAURI) {
    useEffect(() => {
      const promise = tauriEvent.listen('longRunningThread', ({ payload }: { payload: any }) => {
        console.log(payload.message);
      });
      return () => { promise.then(unlisten => unlisten()) };
    }, []);
    // system tray events
    useEffect(() => {
      const promise = tauriEvent.listen('systemTray', ({ payload, ...eventObj }: { payload: { message: string } }) => {
        console.log(payload.message);
        // for debugging purposes only
        notifications.show({
          title: '[DEBUG] System Tray Event',
          message: payload.message
        });
      });
      return () => { promise.then(unlisten => unlisten()) };
    }, []);

    // update checker
    useEffect(() => {
      checkUpdate().then(({ shouldUpdate, manifest }) => {
        if (shouldUpdate && manifest !== undefined) {
          const { version: newVersion, body: releaseNotes } = manifest;
          const color = colorScheme === 'dark' ? 'teal' : 'teal.8';
          notifications.show({
            title: t('updateAvailable', { v: newVersion }),
            color,
            message: <>
              <Text>{releaseNotes}</Text>
              <Button color={color} style={{ width: '100%' }} onClick={() => startInstall(newVersion)}>{t('installAndRelaunch')}</Button>
            </>,
            autoClose: false
          });
        }
      });
    }, []);

    // Handle additional app launches (url, etc.)
    useEffect(() => {
      const promise = tauriEvent.listen('newInstance', async ({ payload, ...eventObj }: { payload: { args: string[], cwd: string } }) => {
        if (!(await appWindow.isVisible())) await appWindow.show();

        if (await appWindow.isMinimized()) {
          await appWindow.unminimize();
          await appWindow.setFocus();
        }

        let args = payload?.args;
        let cwd = payload?.cwd;
        if (args?.length > 1) {

        }
      });
      return () => { promise.then(unlisten => unlisten()) };
    }, []);
  }

  function NavLinks() {
    // TODO: useHotkeys and abstract this
    return views.map((view, index) =>
      <NavLink to={view.path} key={index} end={view.exact} onClick={() => toggleMobileNav()}
        className={({ isActive }) => classes.navLink + ' ' + (isActive ? classes.navLinkActive : classes.navLinkInactive)}>
        {/* TODO: Icons */}
        <Group><Text>{view.name ? view.name : view.name}</Text></Group>
      </NavLink>
    );
  }

  const showFooter = FOOTER && !footersSeenLoading && !(FOOTER in footersSeen);
  // assume key is always available
  const footerText = t(FOOTER);

  // hack for global styling the vertical simplebar based on state
  useEffect(() => {
    const el = document.getElementsByClassName('simplebar-vertical')[0];
    if (el instanceof HTMLElement) {
      el.style.marginTop = usingCustomTitleBar ? '100px' : '70px';
      el.style.marginBottom = showFooter ? '50px' : '0px';
    }
  }, [usingCustomTitleBar, showFooter]);

  return <>
    {usingCustomTitleBar && <TitleBar />}
    <AppShell padding='md'
      header={{ height: 60 }}
      footer={showFooter ? { height: 60 } : undefined}
      navbar={{ width: 200, breakpoint: 'sm', collapsed: { mobile: !mobileNavOpened, desktop: !desktopNavOpened } }}
      aside={{ width: 200, breakpoint: 'sm', collapsed: { desktop: false, mobile: true } }}
      className={classes.appShell}>
      <AppShellMain>
        {usingCustomTitleBar && <Space h='xl' />}
        <SimpleBar scrollableNodeProps={{ ref: setScroller }} autoHide={false} className={classes.simpleBar}>
          <Routes>
            {views[0] !== undefined && <Route path='/' element={<Navigate to={views[0].path} />} />}
            {views.map((view, index) => <Route key={index} path={view.path} element={<view.component />} />)}
          </Routes>
          {/* prevent the footer from covering bottom text of a route view */}
          <Space h={showFooter ? 70 : 50} />
          <ScrollToTop scroller={scroller} bottom={showFooter ? 70 : 20} />
        </SimpleBar>
      </AppShellMain>
      <AppShellHeader data-tauri-drag-region p='md' className={classes.header}>
        <Group h='100%'>
          <Burger hiddenFrom='sm' opened={mobileNavOpened} onClick={toggleMobileNav} size='sm' />
          <Burger visibleFrom='sm' opened={desktopNavOpened} onClick={toggleDesktopNav} size='sm' />
          <Text>{HEADER_TITLE}</Text>
        </Group>
        <Group className={classes.headerRightItems} h='110%'>
          <LanguageHeaders />
          <ActionIcon id='toggle-theme' title='Ctrl + J' variant='default' onClick={toggleColorScheme} size={30}>
            {/* icon to show based on colorScheme */}
            {colorScheme === 'dark' ? <IoSunnySharp size={'1.5em'} /> : <BsMoonStarsFill />}
          </ActionIcon>
        </Group>
      </AppShellHeader>

      <AppShellNavbar className={classes.titleBarAdjustedHeight} h='100%' w={{ sm: 200 }} p='xs' hidden={!mobileNavOpened}>
        <AppShellSection grow><NavLinks /></AppShellSection>
        <AppShellSection>
          {/* Bottom of Navbar Example: https://github.com/mantinedev/mantine/blob/master/src/mantine-demos/src/demos/core/AppShell/_user.tsx */}
          <Space h={navbarClearance} /> {/* Account for footer */}
        </AppShellSection>
      </AppShellNavbar>

      <AppShellAside className={classes.titleBarAdjustedHeight} p='md' w={{ sm: 200, lg: 300 }}>
        <Text>Right Side. Use for help, support, quick action menu? For example, if we were building a trading app, we could use the aside for the trade parameters while leaving the main UI with the data</Text>
      </AppShellAside>

      {showFooter &&
        <AppShellFooter ref={footerRef} p='md' className={classes.footer}>
          {footerText}
          <Button variant='subtle' size='xs' onClick={() => setFootersSeen(prev => ({ ...prev, [FOOTER]: '' }))}>
            <ImCross />
          </Button>
        </AppShellFooter>}
    </AppShell>

  </>;
}
