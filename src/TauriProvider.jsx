import React, { useState, useEffect, useContext } from 'react';
import * as tauriPath from '@tauri-apps/api/path';
import * as fs from '@tauri-apps/api/fs';
import * as os from '@tauri-apps/api/os';
import { RUNNING_IN_TAURI } from './utils';

// NOTE: Add cacheable Tauri calls in this file
//   that you want to use synchronously across components in your app

// defaults are only for auto-complete
const TauriContext = React.createContext({
    loading: true,
    downloads: undefined,
    documents: undefined,
    osType: undefined,
    fileSep: '/'
});

export const useTauriContext = () => useContext(TauriContext);
export function TauriProvider({ children }) {

    const [downloads, setDownloadDir] = useState();
    const [documents, setDocumentDir] = useState();
    const [osType, setOsType] = useState();
    const [loading, setLoading] = useState(true);
    const [fileSep, setFileSep] = useState('/');

    useEffect(() => {
        if (RUNNING_IN_TAURI) {
            const callTauriAPIs = async () => {
                setDownloadDir(await tauriPath.downloadDir());
                setDocumentDir(await tauriPath.documentDir());
                const _osType = await os.type();
                setOsType(_osType);
                setFileSep(_osType === 'Windows_NT' ? '\\' : '/');
                setLoading(false);
            }
            callTauriAPIs().catch(console.error);
        }
    }, []);

    return <TauriContext.Provider value={{ loading, fileSep, downloads, documents, osType }}>
        {children}
    </TauriContext.Provider>;
}
