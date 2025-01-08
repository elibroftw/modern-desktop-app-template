// API for Tauri or web storage
import { LazyStore } from '@tauri-apps/plugin-store';
import localforage from 'localforage';
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { useTauriContext } from './TauriProvider';
// docs: https://github.com/tauri-apps/tauri-plugin-store/blob/dev/webview-src/index.ts

const RUNNING_IN_TAURI = window.__TAURI_INTERNALS__ !== undefined;
export const USE_STORE = false && RUNNING_IN_TAURI;
// save data after setState
// https://blog.seethis.link/scan-rate-estimator/
const SAVE_DELAY = 400;

const stores: Record<string, LazyStore> = {};

function getTauriStore(filename: string): LazyStore {
	// autosave is 100ms by default
	if (stores[filename] === undefined) stores[filename] = new LazyStore(filename);
	return stores[filename];
}

// returns an API to get a item, set an item from a specific category of data
// why? we don't to have loading variable for multiple values
export function createStorage(storeName: string) {
	let loading = useTauriContext().loading;
	const [data, setData] = useState<Record<string, any>>();
	loading = loading || data === undefined;
	const localDataRef = useRef(null);
	const fileStoreRef = useRef<LazyStore | null>(
		RUNNING_IN_TAURI ? getTauriStore(storeName) : null
	);
	const timeoutRef = useRef<number>(undefined);

	// load data
	useEffect(() => {
		if (RUNNING_IN_TAURI) {
			if (fileStoreRef.current === null) console.error('fileStoreRef is undefined');
			else {
				fileStoreRef.current.get('data').then(
					value => {
						if (value === undefined || value === null) {
							const newValue = {};
							fileStoreRef.current!.set('data', newValue)
								.then(() => setData(newValue));
						} else {
							console.log(`value is undefined? ${value === undefined}`);
							setData(value);
						}
					}
				)
			}

		} else {
			localforage.getItem(storeName, (err, value) => {
				// make store a {} again in catch
				if (err !== undefined && value === null || Array.isArray(value)) {
					localforage.setItem(storeName, {}, (err, val) => {
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
	}, [storeName]);

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
					// avoid spiking disk IO by saving every SAVE_DELAY
					fileStoreRef.current!.set('data', newData)
						.then(() => {
							timeoutRef.current = window.setTimeout(() => fileStoreRef.current!.save(), SAVE_DELAY)
						});
				} else {
					timeoutRef.current = window.setTimeout(() => localforage.setItem(storeName, newData), SAVE_DELAY);
				}
			}
			return newData;
		});
	}, [storeName, loading, fileStoreRef, localDataRef, timeoutRef]);

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
