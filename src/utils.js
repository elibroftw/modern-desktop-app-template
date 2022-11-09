import { currentMonitor, getCurrent } from '@tauri-apps/api/window';
import Cookies from 'js-cookie';
import localforage from 'localforage';
import { useEffect, useLayoutEffect, useState } from 'react';
export { localforage };

export const RUNNING_IN_TAURI = window.__TAURI__ !== undefined;

export function useCookie(key, defaultValue, { expires=365000, sameSite='lax', path='/'}={}) {
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

// https://reactjs.org/docs/hooks-custom.html
export function useLocalForage(key, defaultValue) {
    // only supports primitives, arrays, and {} objects
    const [state, setState] = useState(defaultValue);
    const [loading, setLoading] = useState(true);

    // useLayoutEffect will be called before DOM paintings and before useEffect
    useLayoutEffect(() => {
        let allow = true;
        localforage.getItem(key).then(value => {
            if (value === null) throw '';
            if (allow) setState(value);
        }).catch(() => localforage.setItem(key, defaultValue)).then(() => {
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
    new Notification(title, {
        body: body || "",
    });
}
