import React, { useState, useEffect, useContext } from 'react';
import * as tauriPath from '@tauri-apps/api/path';
import * as fs from '@tauri-apps/api/fs';
import * as os from '@tauri-apps/api/os';
import { APP_NAME, RUNNING_IN_TAURI } from './utils';

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
        if (RUNNING_IN_TAURI) {
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
            }
            callTauriAPIs().catch(console.error);
        }
    }, []);

    return <TauriContext.Provider value={{ loading, fileSep, downloads, documents, osType, appDocuments }}>
        {children}
    </TauriContext.Provider>;
}
