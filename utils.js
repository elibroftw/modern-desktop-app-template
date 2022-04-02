import localforage from 'localforage';
import { useState, useEffect, useLayoutEffect } from 'react';
export { localforage };

// only supports primitives, arrays, and {} objects
// https://reactjs.org/docs/hooks-custom.html

export function useLocalForage(key, defaultValue) {
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
        return () => { allow = false; }
    }, []);
    // useLayoutEffect doesn't work if a promise is returned!
    useLayoutEffect(() => { localforage.setItem(key, state); }, [state]);
    return [state, setState, loading];
}

// notification example (different from mantine notification)
export function notify(title, body) {
    new Notification(title, {
        body: body || "",
    });
}
