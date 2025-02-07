// API for Tauri or web storage
import { getStore, Store } from '@tauri-apps/plugin-store';
import localforage from 'localforage';
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { useTauriContext } from './TauriProvider';
// docs: https://github.com/tauri-apps/tauri-plugin-store/blob/dev/webview-src/index.ts

const RUNNING_IN_TAURI = window.isTauri === true;
export const USE_STORE = false && RUNNING_IN_TAURI;
// save data after setState
// https://blog.seethis.link/scan-rate-estimator/
const SAVE_DELAY = 100;

// returns an API to get a item, set an item from a specific category of data
// why? we don't to have loading variable for multiple values
export function createStorage(storePath: string) {
	let loading = useTauriContext().loading;
	const [data, setData] = useState<Record<string, any>>();
	loading = loading || data === undefined;
	const localDataRef = useRef(null);
	const fileStoreRef = useRef<Store | null>(null);
	const timeoutRef = useRef<number>(undefined);

	// load data
	useEffect(() => {
		if (RUNNING_IN_TAURI) {
			(async () => {
				try {
					const store = await Store.load(storePath);
					if (store === null) throw new Error(`invalid path ${storePath} for store`);
					fileStoreRef.current = store;
					const value = await fileStoreRef.current.get<Record<string, any>>('data');
					if (value === undefined) {
						const newValue = {};
						await fileStoreRef.current!.set('data', newValue);
						setData(newValue);
					} else {
						console.log(`value is undefined? ${JSON.stringify(value)}`);
						setData(value);
					}
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
			});
		}
	}, [storePath]);

	const setItem = useCallback((key: string, newValueOrHandler: Dispatch<SetStateAction<any>>) => {
		if (loading) return;
		window.clearTimeout(timeoutRef.current);
		setData(data => {
			if (loading || data === undefined) return data;
			const prev = data[key];
			let newData = data;
			try {
				newData = { ...data, [key]: newValueOrHandler(prev) };
			} catch (TypeError) {
				newData = { ...data, [key]: newValueOrHandler };
			}
			if (newData !== data) {
				if (RUNNING_IN_TAURI) {
					fileStoreRef.current!.set('data', newData);
				} else {
					timeoutRef.current = window.setTimeout(() => localforage.setItem(storePath, newData), SAVE_DELAY);
				}
			}
			return newData;
		});
	}, [storePath, loading, fileStoreRef, localDataRef, timeoutRef]);

	const getItem = useCallback((key: string, defaultValue: object) => {
		if (loading || data === undefined) return defaultValue;
		const value = data[key];
		if (value === undefined && defaultValue !== undefined) {
			setData(data => ({ ...data, [key]: defaultValue }));
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
