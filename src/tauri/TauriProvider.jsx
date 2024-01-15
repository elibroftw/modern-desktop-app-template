import { useInterval } from '@mantine/hooks';
import * as fs from '@tauri-apps/api/fs';
import * as os from '@tauri-apps/api/os';
import * as tauriPath from '@tauri-apps/api/path';
import { appWindow, currentMonitor, getCurrent } from '@tauri-apps/api/window';
import React, { useContext, useEffect, useState } from 'react';
import tauriConfJson from '../../src-tauri/tauri.conf.json';

const WIN32_CUSTOM_TITLEBAR = true;
export const APP_NAME = tauriConfJson.package.productName;
export const RUNNING_IN_TAURI = window.__TAURI__ !== undefined;
const EXTS = new Set(['.json']);

// NOTE: Add memoized Tauri calls in this file
//   that you want to use synchronously across components in your app

// defaults are only for auto-complete
const TauriContext = React.createContext({
  loading: true,
  downloads: undefined,
  documents: undefined,
  appDocuments: undefined,
  osType: undefined,
  fileSep: '/',
  isFullScreen: false,
  usingCustomTitleBar: false,
});

export const useTauriContext = () => useContext(TauriContext);

export function TauriProvider({ children }) {

  const [loading, setLoading] = useState(true);
  const [downloads, setDownloadDir] = useState();
  const [documents, setDocumentDir] = useState();
  const [osType, setOsType] = useState();
  const [fileSep, setFileSep] = useState('/');
  const [appDocuments, setAppDocuments] = useState();
  const [isFullScreen, setFullscreen] = useState(false);
  // false because might be running in web
  const [usingCustomTitleBar, setUsingCustomTitleBar] = useState(false);

  if (RUNNING_IN_TAURI) {
    const tauriInterval = useInterval(() => {
      appWindow.isFullscreen().then(setFullscreen);
    }, 200);

    useEffect(() => {
      tauriInterval.start();
      return tauriInterval.stop;
    }, []);

    useEffect(() => {
      if (osType === 'Windows_NT') {
        appWindow.setDecorations(!WIN32_CUSTOM_TITLEBAR);
        if (WIN32_CUSTOM_TITLEBAR) {
          root.style.setProperty('--titlebar-height', '28px');
        }
      }
    }, [osType]);

    useEffect(() => {
      // hide titlebar when: in fullscreen, not on Windows, and explicitly allowing custom titlebar
      setUsingCustomTitleBar(!isFullScreen && osType === 'Windows_NT' && WIN32_CUSTOM_TITLEBAR);
    }, [isFullScreen, osType]);

    useEffect(() => {
      // if you want to listen for event listeners, use mountID trick to call unlisten on old listeners
      const callTauriAPIs = async () => {
        setDownloadDir(await tauriPath.downloadDir());
        const _documents = await tauriPath.documentDir();
        setDocumentDir(_documents);
        const _osType = await os.type();
        setOsType(_osType);
        const _fileSep = _osType === 'Windows_NT' ? '\\' : '/';
        setFileSep(_fileSep);
        await fs.createDir(APP_NAME, { dir: fs.BaseDirectory.Document, recursive: true });
        setAppDocuments(`${_documents}${APP_NAME}`);
        setLoading(false);
        // if you aren't using the window-state plugin,
        //  you need to manually show the window (uncomment code)
        // import { invoke } from '@tauri-apps/api';
        // invoke('show_main_window');
        // Why? The default background color of webview is white
        //  so we should show the window when the react app loads
        // See: https://github.com/tauri-apps/tauri/issues/1564
      }
      callTauriAPIs().catch(console.error);
    }, []);
  }

  return <TauriContext.Provider value={{ loading, fileSep, downloads, documents, osType, appDocuments, isFullScreen, usingCustomTitleBar }}>
    {children}
  </TauriContext.Provider>;
}

export async function getUserAppFiles() {
  // returns an array of files from $DOCUMENT/$APP_NAME/* with extension that is in EXTS
  //  implying that the app (tauri-plugin-store) can parse the files
  // returns [] if $DOCUMENT/$APP_NAME is a file
  const documents = await tauriPath.documentDir();
  const saveFiles = [];
  await fs.createDir(APP_NAME, { dir: fs.BaseDirectory.Document, recursive: true });
  const entries = await fs.readDir(APP_NAME, { dir: fs.BaseDirectory.AppData, recursive: true });
  if (entries !== null) {
    const osType = await os.type();
    const sep = osType === 'Windows_NT' ? '\\' : '/'
    const appFolder = `${documents}${sep}${APP_NAME}`;
    for (const { path } of flattenFiles(entries)) {
      const friendlyName = path.substring(appFolder.length + 1, path.length);
      if (EXTS.has(getExtension(path).toLowerCase())) saveFiles.push({ path, name: friendlyName });
    }
  }
  return saveFiles;
}

export function useMinWidth(minWidth) {
  if (RUNNING_IN_TAURI) {
    useEffect(() => {
      async function resizeWindow() {
        // to set a size consistently across devices,
        //  one must use LogicalSize (Physical cannot be relied upon)
        const physicalSize = await getCurrent().innerSize();
        // Since innerSize returns Physical size, we need
        //   to get the current monitor scale factor
        //   to convert the physical size into a logical size
        const monitor = await currentMonitor();
        const scaleFactor = monitor.scaleFactor;
        const logicalSize = physicalSize.toLogical(scaleFactor);
        if (logicalSize.width < minWidth) {
          logicalSize.width = minWidth;
          await getCurrent().setSize(logicalSize);
        }
      }
      resizeWindow().catch(console.error);
    }, []); // [] to ensure on first render
  }
}

function* flattenFiles(entries) {
  for (const entry of entries) {
    entry.children === null ? yield entry.path : yield* flattenFiles(entry.children);
  }
}

// const getExtensionTests = ['/.test/.ext', './asdf.mz', '/asdf/qwer.maz', 'asdf.mm', 'sdf/qwer.ww', './.asdf.mz', '/asdf/.qwer.maz', '.asdf.mm', 'sdf/.qwer.ww', './asdf', '/adsf/qwer', 'asdf', 'sdf/qewr', './.asdf', '/adsf/.qwer', '.asdf', 'sdf/.qewr']

function getExtension(path) {
  // Modified from https://stackoverflow.com/a/12900504/7732434
  // get filename from full path that uses '\\' or '/' for seperators
  var basename = path.split(/[\\/]/).pop(),
    pos = basename.lastIndexOf('.');
  // if `.` is not in the basename
  if (pos < 0) return '';
  // extract extension including `.`
  return basename.slice(pos);
}
