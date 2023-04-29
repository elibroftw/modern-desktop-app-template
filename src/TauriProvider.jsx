import React, { useState, useEffect, useContext } from 'react';
import * as tauriPath from '@tauri-apps/api/path';
import * as fs from '@tauri-apps/api/fs';
import * as os from '@tauri-apps/api/os';
import { APP_NAME, RUNNING_IN_TAURI } from './utils';
import { invoke } from '@tauri-apps/api';
import { listen } from '@tauri-apps/api/event';
import { appWindow } from '@tauri-apps/api/window';

// NOTE: Add cacheable Tauri calls in this file
//   that you want to use synchronously across components in your app

// defaults are only for auto-complete
const TauriContext = React.createContext({
    loading: true,
    downloads: undefined,
    documents: undefined,
    appDocuments: undefined,
    osType: undefined,
    fileSep: '/',
});

export const useTauriContext = () => useContext(TauriContext);
export function TauriProvider({ children }) {

    const [loading, setLoading] = useState(true);
    const [downloads, setDownloadDir] = useState();
    const [documents, setDocumentDir] = useState();
    const [osType, setOsType] = useState();
    const [fileSep, setFileSep] = useState('/');
    const [appDocuments, setAppDocuments] = useState();

    useEffect(() => {
        // if you want to listen for event listeners, use mountID trick to call unlisten on old listeners
        if (RUNNING_IN_TAURI) {
            const callTauriAPIs = async () => {
                // Handle additional app launches (url, etc.)
                await listen('new-instance',
                    ({ payload, ...eventObj }) => {
                        appWindow.unminimize().then(() => appWindow.setFocus(true));
                        let args = payload?.args;
                        let cwd = payload?.cwd;
                        if (args?.length > 1) { }
                    }
                );
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
                // show window if not using the window state plugin
                // https://github.com/tauri-apps/tauri/issues/1564
                invoke('show_main_window');
            }
            callTauriAPIs().catch(console.error);
        }
    }, []);

    return <TauriContext.Provider value={{ loading, fileSep, downloads, documents, osType, appDocuments }}>
        {children}
    </TauriContext.Provider>;
}
