import { useInterval } from '@mantine/hooks';
import { listen } from '@tauri-apps/api/event';
import * as fs from '@tauri-apps/api/fs';
import * as os from '@tauri-apps/api/os';
import * as tauriPath from '@tauri-apps/api/path';
import { appWindow } from '@tauri-apps/api/window';
import React, { useContext, useEffect, useState } from 'react';
import { TitleBar } from './Components/TitleBar';
import { APP_NAME, RUNNING_IN_TAURI } from './utils';

const WIN32_CUSTOM_TITLEBAR = true;
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
        // Handle additional app launches (url, etc.)
        await listen('newInstance', ({ payload, ...eventObj }) => {
          appWindow.unminimize().then(() => appWindow.setFocus(true));
          let args = payload?.args;
          let cwd = payload?.cwd;
          if (args?.length > 1) { }
        });
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
    {usingCustomTitleBar && <TitleBar />}
    {children}
  </TauriContext.Provider>;
}
