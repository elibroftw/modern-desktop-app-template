import * as fs from '@tauri-apps/api/fs';
import * as tauriPath from '@tauri-apps/api/path';
import * as os from '@tauri-apps/api/os';
import { currentMonitor, getCurrent } from '@tauri-apps/api/window';
import Cookies from 'js-cookie';
import localforage from 'localforage';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
// tauri-store docs: https://github.com/tauri-apps/tauri-plugin-store/blob/dev/webview-src/index.ts
import { Store } from 'tauri-plugin-store-api';
import packageJson from '../package.json';
import tauriConfJson from '../src-tauri/tauri.conf.json';
export { localforage };

export const VERSION = packageJson.version;
export const APP_NAME = tauriConfJson.package.productName;
const EXTS = new Set(['.json']);
// save tauri store 1 second after last set
const SAVE_DELAY = 1000;
export const RUNNING_IN_TAURI = window.__TAURI__ !== undefined;

export function useCookie(key, defaultValue, { expires = 365000, sameSite = 'lax', path = '/' } = {}) {
    // cookie expires in a millenia
    // sameSite != 'strict' because the cookie is not read for sensitive actions
    // synchronous
    const cookieValue = Cookies.get(key);
    const [state, setState] = useState(cookieValue || defaultValue);
    useEffect(() => {
        Cookies.set(key, state, { expires, sameSite, path });
    }, [state]);
    return [state, setState];
}

export function trueTypeOf(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase()
    /*
        []              -> array
        {}              -> object
        ''              -> string
        new Date()      -> date
        1               -> number
        function () {}  -> function
        /test/i         -> regexp
        true            -> boolean
        null            -> null
        trueTypeOf()    -> undefined
    */
}

export function useMinWidth(minWidth) {
    if (RUNNING_IN_TAURI) {
        useEffect(() => {
            async function resizeWindow() {
                // to set a size consistently accrosss devices,
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
        entry.children === null ? yield entry.path : yield* fileSaveFiles(entry.children);
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

const stores = {};

function getTauriStore(filename) {
    if (!(filename in stores)) stores[filename] = new Store(filename);
    return stores[filename];
}

// uselocalForage on web and tauri-plugin-store in Tauri
export const useStorage = RUNNING_IN_TAURI ? useTauriStore : useLocalForage;

export function useTauriStore(key, defaultValue, storeName = 'data.dat') {
    // storeName is a path that is relative to AppData if not absolute
    const [state, setState] = useState(defaultValue);
    const [loading, setLoading] = useState(true);
    const store = getTauriStore(storeName);
    const timeoutRef = useRef(null);

    // useLayoutEffect will be called before DOM paintings and before useEffect
    useLayoutEffect(() => {
        let allow = true;
        store.get(key)
            .then(value => {
                if (value === null) throw '';
                if (allow) setState(value);
            }).catch(() => {
                store.set(key, defaultValue).then(() => {
                    timeoutRef.current = setTimeout(() => store.save(), SAVE_DELAY)
                });
            })
            .then(() => {
                if (allow) setLoading(false);
            });
        return () => allow = false;
    }, []);
    // useLayoutEffect does not like Promise return values.
    useEffect(() => {
        // do not allow setState to be called before data has even been loaded!
        // this prevents overwriting
        if (!loading) {
            clearTimeout(timeoutRef.current);
            store.set(key, state).then(() => {
                timeoutRef.current = setTimeout(() => store.save(), SAVE_DELAY)
            });
        }
    }, [state]);
    return [state, setState, loading];
}

// https://reactjs.org/docs/hooks-custom.html
export function useLocalForage(key, defaultValue) {
    // only supports primitives, arrays, and {} objects
    const [state, setState] = useState(defaultValue);
    const [loading, setLoading] = useState(true);

    // useLayoutEffect will be called before DOM paintings and before useEffect
    useLayoutEffect(() => {
        let allow = true;
        localforage.getItem(key)
            .then(value => {
                if (value === null) throw '';
                if (allow) setState(value);
            }).catch(() => localforage.setItem(key, defaultValue))
            .then(() => {
                if (allow) setLoading(false);
            });
        return () => allow = false;
    }, []);
    // useLayoutEffect does not like Promise return values.
    useEffect(() => {
        // do not allow setState to be called before data has even been loaded!
        // this prevents overwriting
        if (!loading) localforage.setItem(key, state);
    }, [state]);
    return [state, setState, loading];
}

// notification example (different from mantine notification)
export function notify(title, body) {
    new Notification(title, { body: body || "", });
}
