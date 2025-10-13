import { ActionIcon, AppShell, Burger, Button, Group, Space, Text, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { useDisclosure, useHotkeys } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { isTauri } from '@tauri-apps/api/core';
import * as tauriEvent from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import * as tauriLogger from '@tauri-apps/plugin-log';
import { relaunch } from '@tauri-apps/plugin-process';
import * as tauriUpdater from '@tauri-apps/plugin-updater';
import { JSX, lazy, LazyExoticComponent, Suspense, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { BsMoonStarsFill } from 'react-icons/bs';
import { ImCross } from 'react-icons/im';
import { IoSunnySharp } from 'react-icons/io5';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import classes from './App.module.css';
import { useCookie, useLocalForage } from './common/utils';
import LanguageHeaders from './components/LanguageHeaders';
import { ScrollToTop } from './components/ScrollToTop';
import { useTauriContext } from './tauri/TauriProvider';
import { TitleBar } from './tauri/TitleBar';
import ExampleView from './views/ExampleView';
import FallbackAppRender from './views/FallbackErrorBoundary';
import FallbackSuspense from './views/FallbackSuspense';
// if some views are large, you can use lazy loading to reduce the initial app load time
const LazyView = lazy(() => import('./views/LazyView'));

// imported views need to be added to the `views` list variable
interface View {
	component: (() => JSX.Element) | LazyExoticComponent<() => JSX.Element>,
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
		{ component: ExampleView, path: '/example-view', name: t('ExampleView') },
		{ component: () => <Text>Woo, routing works</Text>, path: '/example-view-2', name: 'Test Routing' },
		{ component: LazyView, path: '/lazy-view', name: 'Lazy Load' }
		// Other ways to add views to this array:
		//     { component: () => <Home prop1={'stuff'} />, path: '/home', name: t('Home') },
		//     { component: React.memo(About), path: '/about', name: t('About') },
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


	// Tauri event listeners (run on mount)
	if (isTauri()) {
		useEffect(() => {
			const promise = tauriEvent.listen('longRunningThread', ({ payload }: { payload: any }) => {
				tauriLogger.info(payload.message);
			});
			return () => { promise.then(unlisten => unlisten()) };
		}, []);
		// system tray events
		useEffect(() => {
			const promise = tauriEvent.listen('systemTray', ({ payload, ...eventObj }: { payload: { message: string } }) => {
				tauriLogger.info(payload.message);
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
			(async () => {
				const update = await tauriUpdater.check();
				if (update) {
					const color = colorScheme === 'dark' ? 'teal' : 'teal.8';
					notifications.show({
						id: 'UPDATE_NOTIF',
						title: t('updateAvailable', { v: update.version }),
						color,
						message: <>
							<Text>{update.body}</Text>
							<Button color={color} style={{ width: '100%' }} onClick={() => update.downloadAndInstall(event => {
								switch (event.event) {
									case 'Started':
										notifications.show({ title: t('installingUpdate', { v: update.version }), message: t('relaunchMsg'), autoClose: false });
										// contentLength = event.data.contentLength;
										// tauriLogger.info(`started downloading ${event.data.contentLength} bytes`);
										break;
									case 'Progress':
										// downloaded += event.data.chunkLength;
										// tauriLogger.info(`downloaded ${downloaded} from ${contentLength}`);
										break;
									case 'Finished':
										// tauriLogger.info('download finished');
										break;
								}
							}).then(relaunch)}>{t('installAndRelaunch')}</Button>
						</>,
						autoClose: false
					});
				}
			})()
		}, []);

		// Handle additional app launches (url, etc.)
		useEffect(() => {
			const promise = tauriEvent.listen('newInstance', async ({ payload, ...eventObj }: { payload: { args: string[], cwd: string } }) => {
				const appWindow = getCurrentWebviewWindow();
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

	const FOOTER_KEY = 'footer[0]';
	const showFooter = FOOTER_KEY && !footersSeenLoading && !(FOOTER_KEY in footersSeen);
	// assume key is always available
	const footerText = t(FOOTER_KEY);

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
			aside={{ width: 300, breakpoint: 'md', collapsed: { desktop: false, mobile: true } }}
			className={classes.appShell}>
			<AppShell.Main>
				{usingCustomTitleBar && <Space h='xl' />}
				<SimpleBar scrollableNodeProps={{ ref: setScroller }} autoHide={false} className={classes.simpleBar}>
					<ErrorBoundary FallbackComponent={FallbackAppRender} /*onReset={_details => resetState()} */ onError={(e: Error) => tauriLogger.error(e.message)}>
						<Routes>
							{views[0] !== undefined && <Route path='/' element={<Navigate to={views[0].path} />} />}
							{views.map((view, index) => <Route key={index} path={view.path} element={<Suspense fallback={<FallbackSuspense />}><view.component /></Suspense>} />)}
						</Routes>
					</ErrorBoundary>
					{/* prevent the footer from covering bottom text of a route view */}
					<Space h={showFooter ? 70 : 50} />
					<ScrollToTop scroller={scroller} bottom={showFooter ? 70 : 20} />
				</SimpleBar>
			</AppShell.Main>
			<AppShell.Header data-tauri-drag-region p='md' className={classes.header}>
				<Group h='100%'>
					<Burger hiddenFrom='sm' opened={mobileNavOpened} onClick={toggleMobileNav} size='sm' />
					<Burger visibleFrom='sm' opened={desktopNavOpened} onClick={toggleDesktopNav} size='sm' />
					<Text>HEADER_TITLE</Text>
				</Group>
				<Group className={classes.headerRightItems} h='110%'>
					<LanguageHeaders />
					<ActionIcon id='toggle-theme' title='Ctrl + J' variant='default' onClick={toggleColorScheme} size={30}>
						{/* icon to show based on colorScheme */}
						{colorScheme === 'dark' ? <IoSunnySharp size={'1.5em'} /> : <BsMoonStarsFill />}
					</ActionIcon>
				</Group>
			</AppShell.Header>

			<AppShell.Navbar className={classes.titleBarAdjustedHeight} h='100%' w={{ sm: 200 }} p='xs' hidden={!mobileNavOpened}>
				<AppShell.Section grow><NavLinks /></AppShell.Section>
				<AppShell.Section>
					{/* Bottom of Navbar Example: https://github.com/mantinedev/mantine/blob/master/src/mantine-demos/src/demos/core/AppShell/_user.tsx */}
					<Space h={navbarClearance} /> {/* Account for footer */}
				</AppShell.Section>
			</AppShell.Navbar >

			<AppShell.Aside className={classes.titleBarAdjustedHeight} p='md'>
				<Text>Right Side. Use for help, support, quick action menu? For example, if we were building a trading app, we could use the aside for the trade parameters while leaving the main UI with the data</Text>
			</AppShell.Aside >

			{showFooter &&
				<AppShell.Footer ref={footerRef} p='md' className={classes.footer}>
					{footerText}
					<Button variant='subtle' size='xs' onClick={() => setFootersSeen(prev => ({ ...prev, [FOOTER_KEY]: '' }))}>
						<ImCross />
					</Button>
				</AppShell.Footer>}
		</AppShell>

	</>;
}
