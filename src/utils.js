import * as fs from '@tauri-apps/api/fs';
import * as os from '@tauri-apps/api/os';
import * as tauriPath from '@tauri-apps/api/path';
import { currentMonitor, getCurrent } from '@tauri-apps/api/window';
import Cookies from 'js-cookie';
import localforage from 'localforage';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Store } from 'tauri-plugin-store-api'; // tauri-store docs: https://github.com/tauri-apps/tauri-plugin-store/blob/dev/webview-src/index.ts
import packageJson from '../package.json';
import tauriConfJson from '../src-tauri/tauri.conf.json';
export { localforage };

export const HEADER_TITLE = 'HEADER_TITLE goes here';
export const FOOTER = 'FOOTER goes here';
export const APP_NAME = tauriConfJson.package.productName;
export const VERSION = packageJson.version;
export const WINDOW_TITLE = 'WINDOW_TITLE set in utils.js';
const EXTS = new Set(['.json']);
// save tauri store 500ms after last set
const SAVE_DELAY = 500;
export const RUNNING_IN_TAURI = window.__TAURI__ !== undefined;
export const IS_DEVELOPMENT = import.meta.env.MODE === 'development';
export const IS_PRODUCTION = !IS_DEVELOPMENT;

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
        async function () {}  -> asyncfunction
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
                timeoutRef.current = setTimeout(() => {
                    store.save();
                    console.log(state);
                }, SAVE_DELAY)
            });
        }
        // ensure data is saved by not clearing the timeout on unmount
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

// show browser / native notification
export function notify(title, body) {
    new Notification(title, { body: body || "", });
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function downloadFile(filename, content, contentType='text/plain') {
    const element = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
}

Math.clamp = (num, min, max) => Math.min(Math.max(num, min), max);


export function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.
    // Please note that calling sort on an array will modify that array.
    // you might want to clone your array first.

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}
