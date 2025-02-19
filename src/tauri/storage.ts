// API for Tauri or web storage
import { isTauri } from '@tauri-apps/api/core';
import { Store } from '@tauri-apps/plugin-store';
import localforage from 'localforage';
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { useMutative } from 'use-mutative';
// docs: https://github.com/tauri-apps/tauri-plugin-store/blob/dev/webview-src/index.ts

export const USE_STORE = false && isTauri();
// save data after setState
// https://blog.seethis.link/scan-rate-estimator/
const SAVE_DELAY = 100;

// returns an API to get a item, set an item from a specific category of data
// why? we don't to have loading variable for multiple values
export function createStorage(storePath: string | null) {
	const [data, setData] = useMutative<Record<string, any> | undefined>(undefined);
	const [loading, setLoading] = useState(true);
	const localDataRef = useRef(null);
	const fileStoreRef = useRef<Store | null>(null);
	const timeoutRef = useRef<number>(undefined);

	// load data
	useEffect(() => {
		if (storePath === null) return;
		if (isTauri()) {
			(async () => {
				try {
					const store = await Store.load(storePath);
					if (store === null) throw new Error(`invalid path ${storePath} for store`);
					fileStoreRef.current = store;
					const value = await fileStoreRef.current.get<Record<string, any>>('data');
					if (value === undefined) {
						const newObj = {};
						await fileStoreRef.current!.set('data', newObj);
						setData(newObj);
					} else {
						console.log(`value is undefined? ${JSON.stringify(value)}`);
						setData(value);
					}
					setLoading(false);
				} catch (e) {
					console.error(e);
				}
			})();
		} else {
			localforage.getItem(storePath, (err, value) => {
				// make store a {} again in catch
				if (err !== undefined && value === null || Array.isArray(value)) {
					localforage.setItem(storePath, {}, (err, val) => {
						if (err !== null && err !== undefined) {
							return alert('cannot store data, application will not work as intended');
						}
						setData(val);
					});
				} else {
					setData(value as any);
				}
				setLoading(false);
			});
		}
	}, [storePath]);

	const setItem = useCallback((key: string, newValueOrHandler: Dispatch<SetStateAction<any>>) => {
		if (loading) return;
		window.clearTimeout(timeoutRef.current);
		setData(data => {
			if (loading || data === undefined) return;
			const prev = data[key];
			let value: any = newValueOrHandler;
			try {
				value = newValueOrHandler(prev);
			} catch { }
			data[key] = value;
			if (value !== prev) {
				if (isTauri()) {
					fileStoreRef.current!.set('data', data);
				} else {
					timeoutRef.current = window.setTimeout(() => localforage.setItem(storePath, data), SAVE_DELAY);
				}
			}
		});
	}, [storePath, loading, fileStoreRef, localDataRef, timeoutRef]);

	const getItem = useCallback((key: string, defaultValue: object) => {
		if (loading || data === undefined) return defaultValue;
		const value = data[key];
		if (value === undefined && defaultValue !== undefined) {
			setData(data => {
				if (data !== undefined) data[key] = defaultValue;
			});
			return defaultValue;
		}
		return value;
	}, [loading, data]);

	const useItem = useCallback((key: string, defaultValue: any) => {
		const value = getItem(key, defaultValue);
		return [value, (newValue: any) => setItem(key, newValue)];
	}, [getItem, setItem]);

	return {
		get: getItem,
		set: setItem,
		use: useItem,
		data,
		loading
	};
}
