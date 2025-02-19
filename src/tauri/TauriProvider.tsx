import { useInterval } from '@mantine/hooks';
import { isTauri } from '@tauri-apps/api/core';
import * as tauriPath from '@tauri-apps/api/path';
import { getCurrentWebviewWindow, WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { currentMonitor } from '@tauri-apps/api/window';
import * as fs from '@tauri-apps/plugin-fs';
import * as os from '@tauri-apps/plugin-os';
import React, { PropsWithChildren, useContext, useEffect, useState } from 'react';
import tauriConfJson from '../../src-tauri/tauri.conf.json';

const WIN32_CUSTOM_TITLEBAR = false;
export const APP_NAME = tauriConfJson.productName;
export const IS_MOBILE = navigator.maxTouchPoints > 0;


const EXTS = new Set(['.json']);

// NOTE: Add memoized Tauri calls in this file
//   that you want to use synchronously across components in your app

// defaults are only for auto-complete

interface SystemProvideContext {
	loading: boolean,
	downloads?: string,
	documents?: string,
	appDocuments?: string,
	osType?: os.OsType,
	fileSep: string,
	isFullScreen: boolean,
	usingCustomTitleBar: boolean
	scaleFactor: number
}

const TauriContext = React.createContext<SystemProvideContext>({
	loading: true,
	downloads: undefined,
	documents: undefined,
	appDocuments: undefined,
	osType: undefined,
	fileSep: '/',
	isFullScreen: false,
	usingCustomTitleBar: false,
	scaleFactor: 1
});

export const useTauriContext = () => useContext(TauriContext);

var root: HTMLElement;

export function TauriProvider({ children }: PropsWithChildren) {

	const [loading, setLoading] = useState(true);
	const [downloads, setDownloadDir] = useState<string>();
	const [documents, setDocumentDir] = useState<string>();
	const [osType, setOsType] = useState<os.OsType>();
	const [fileSep, setFileSep] = useState('/');
	const [appDocuments, setAppDocuments] = useState<string>();
	const [isFullScreen, setFullscreen] = useState(false);
	// false because might be running in web
	const [usingCustomTitleBar, setUsingCustomTitleBar] = useState(false);
	const [scaleFactor, setScaleFactor] = useState(1);
	const [containerSize, setContainerSize] = useState('100%');

	if (isTauri()) {
		const appWindow = getCurrentWebviewWindow();

		const tauriInterval = useInterval(async () => {
			setFullscreen(await appWindow.isFullscreen());

			const monitor = await currentMonitor();
			if (monitor !== null) {
				const scaleFactor = monitor.scaleFactor;
				if (osType === 'linux') setContainerSize(`${100 / scaleFactor}%`);
			}

			setScaleFactor(scaleFactor);
		}, 200);

		useEffect(() => {
			tauriInterval.start();
			return tauriInterval.stop;
		}, []);

		useEffect(() => {
			if (osType === 'windows') {
				appWindow.setDecorations(!WIN32_CUSTOM_TITLEBAR);
				if (WIN32_CUSTOM_TITLEBAR) {
					document.documentElement.style.setProperty('--titlebar-height', '28px');
				}
			}
		}, [osType]);

		useEffect(() => {
			// hide titlebar when: in fullscreen, not on Windows, and explicitly allowing custom titlebar
			setUsingCustomTitleBar(!isFullScreen && osType === 'windows' && WIN32_CUSTOM_TITLEBAR);
		}, [isFullScreen, osType]);

		useEffect(() => {
			// if you want to listen for event listeners, use mountID trick to call unlisten on old listeners
			const callTauriAPIs = async () => {
				setDownloadDir(await tauriPath.downloadDir());
				const _documents = await tauriPath.documentDir();
				setDocumentDir(_documents);
				const _osType = os.type();
				setOsType(_osType);
				const _fileSep = _osType === 'windows' ? '\\' : '/';
				setFileSep(_fileSep);
				await fs.mkdir(APP_NAME, { baseDir: fs.BaseDirectory.Document, recursive: true });
				setAppDocuments(`${_documents}${APP_NAME}`);
				setLoading(false);
				// if you aren't using the window-state plugin, you need to import the following
				// import { Webview } from '@tauri-apps/api/webview';
				// and uncomment the following
				// const mainWebview = await Webview.getByLabel('main')!;
				// mainWebview?.show();
				// Why do we need to do this? The default background color of webviews is white
				//  so we should show the window after the react has mounted
				// See: https://github.com/tauri-apps/tauri/issues/1564
			}
			callTauriAPIs().catch(console.error);
		}, []);
	}

	return <TauriContext.Provider value={{ loading, fileSep, downloads, documents, osType, appDocuments, isFullScreen, usingCustomTitleBar, scaleFactor }}>
		{children}
	</TauriContext.Provider>;
}

export async function getUserAppFiles() {
	// returns an array of files from $DOCUMENT/$APP_NAME/* with extension that is in EXTS
	//  implying that the app (tauri-plugin-store) can parse the files
	// returns [] if $DOCUMENT/$APP_NAME is a file
	const documents = await tauriPath.documentDir();
	const saveFiles = [];
	await fs.mkdir(APP_NAME, { baseDir: fs.BaseDirectory.Document, recursive: true });
	const entries = await fs.readDir(APP_NAME, { baseDir: fs.BaseDirectory.AppData });

	const osType = os.type();
	const sep = osType === 'windows' ? '\\' : '/'
	const appFolder = `${documents}${sep}${APP_NAME}`;
	for (const path of await readDirRecursively(APP_NAME, fs.BaseDirectory.AppData)) {
		const friendlyName = path.substring(appFolder.length + 1, path.length);
		if (EXTS.has(getExtension(path).toLowerCase())) saveFiles.push({ path, name: friendlyName });
	}
	if (entries !== null) {

	}
	return saveFiles;
}

export function useMinWidth(minWidth: number) {
	if (isTauri()) {
		useEffect(() => {
			async function resizeWindow() {
				// to set a size consistently across devices,
				//  one must use LogicalSize (Physical cannot be relied upon)

				const physicalSize = await WebviewWindow.getCurrent().innerSize();
				// Since innerSize returns Physical size, we need
				//   to get the current monitor scale factor
				//   to convert the physical size into a logical size
				const monitor = await currentMonitor();
				if (monitor !== null) {
					const scaleFactor = monitor.scaleFactor;
					const logicalSize = physicalSize.toLogical(scaleFactor);
					if (logicalSize.width < minWidth) {
						logicalSize.width = minWidth;
						await getCurrentWebviewWindow().setSize(logicalSize);
					}
				}
			}
			resizeWindow().catch(console.error);
		}, []); // [] to ensure on first render
	}
}

// TODO: turn into generator?
async function readDirRecursively(path: string, baseDir: fs.BaseDirectory): Promise<string[]> {
	const files = [];
	const entries = await fs.readDir(path, { baseDir });
	// TODO:
	for (const entry of entries) {
		if (entry.isDirectory) {
			files.push(...await readDirRecursively(await tauriPath.join(path, entry.name), baseDir));
		} else if (entry.isFile) {
			files.push(entry.name);
		}
	}
	return files;
}

// const getExtensionTests = ['/.test/.ext', './asdf.mz', '/asdf/qwer.maz', 'asdf.mm', 'sdf/qwer.ww', './.asdf.mz', '/asdf/.qwer.maz', '.asdf.mm', 'sdf/.qwer.ww', './asdf', '/adsf/qwer', 'asdf', 'sdf/qewr', './.asdf', '/adsf/.qwer', '.asdf', 'sdf/.qewr']

function getExtension(path: string) {
	// Modified from https://stackoverflow.com/a/12900504/7732434
	// get filename from full path that uses '\\' or '/' for seperators
	const basename = path.split(/[\\/]/).pop();
	if (basename === undefined) return '';
	const pos = basename.lastIndexOf('.');
	// if `.` is not in the basename
	if (pos < 0) return '';
	// extract extension including `.`
	return basename!.slice(pos);
}
