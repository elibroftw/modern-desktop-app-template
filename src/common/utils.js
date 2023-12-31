
import Cookies from 'js-cookie';
import localforage from 'localforage';
import { useEffect, useLayoutEffect, useState } from 'react';
import packageJson from '../../package.json';
export { localforage };

export const HEADER_TITLE = 'HEADER_TITLE goes here';
export const FOOTER = 'FOOTER goes here';
export const VERSION = packageJson.version;

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
