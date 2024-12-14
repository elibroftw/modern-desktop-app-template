// API for Tauri or web storage
import localforage from 'localforage';
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { Store } from 'tauri-plugin-store-api';
import { useTauriContext } from './TauriProvider';
// docs: https://github.com/tauri-apps/tauri-plugin-store/blob/dev/webview-src/index.ts

const RUNNING_IN_TAURI = window.__TAURI__ !== undefined;
export const USE_STORE = false && RUNNING_IN_TAURI;
// save data after setState
// https://blog.seethis.link/scan-rate-estimator/
const SAVE_DELAY = 400;

const stores: Record<string, Store> = {};

function keyInObj(obj: object, key: string) {
  return Object.hasOwnProperty.call(obj, key);
}

function getTauriStore(filename: string): Store {
  if (stores[filename] === undefined) stores[filename] = new Store(filename);
  return stores[filename];
}

export async function testStore() {
  const x = new Store('test.json');
  const val = await x.get('DNE');
  await x.set('Exists', 'sad');
  await x.save();
}

// returns an API to get a item, set an item from a specific category of data
// why? we don't to have loading variable for multiple values
export function createStorage(storeName: string) {
  let loading = useTauriContext().loading;
  const [data, setData] = useState<Record<string, any>>();
  loading = loading || storeName === undefined || data === undefined;

  const localDataRef = useRef(null);
  const fileStoreRef = useRef<Store | null>(
    RUNNING_IN_TAURI ? getTauriStore(storeName) : null
  );
  const timeoutRef = useRef<number>(undefined);

  // load data
  useEffect(() => {
    if (storeName === undefined)
      return;

    if (RUNNING_IN_TAURI) {
      fileStoreRef.current!.get('data').then(
        value => {
          if (value === null) {
            const newValue = {};
            fileStoreRef.current!.set('data', newValue)
              .then(() => setData(newValue));
          } else {
            setData(value);
          }
        }
      )
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
          console.log('err === null?', err === null);
          setData(value as any);
        }
      });
    }
  }, [storeName]);

  const setItem = useCallback((key: string, newValueOrHandler: Dispatch<SetStateAction<any>>) => {
    if (loading) return;
    console.log(newValueOrHandler);
    window.clearTimeout(timeoutRef.current);
    setData(data => {
      if (loading || data === undefined) return data;
      const prev = data[key];
      let newData = data;
      try {
        newData = { ...data, [key]: newValueOrHandler(prev) };
        console.log(JSON.stringify(newData));
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
