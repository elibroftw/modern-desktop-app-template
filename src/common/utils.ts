/** @file functions useful for all react projects */
import Cookies from 'js-cookie';
import localforage from 'localforage';
import { Dispatch, SetStateAction, useEffect, useLayoutEffect, useState } from 'react';
export { localforage };

export const IS_DEVELOPMENT = import.meta.env.MODE === 'development';
export const IS_PRODUCTION = !IS_DEVELOPMENT;

/**
 * `useState` persisted _synchronously_ to a cookie under `key`.
 *
 * The default options expire in a millennium, and use `sameSite: 'lax'` rather than
 * `'strict'` because the cookie is never read for sensitive actions.
 */
export function useCookie(key: string, defaultValue: string, options: Cookies.CookieAttributes = { expires: 365000, sameSite: 'lax', path: '/' }): [string, Dispatch<SetStateAction<string>>] {
	const cookieValue = Cookies.get(key);
	const [state, setState] = useState(cookieValue || defaultValue);
	useEffect(() => {
		Cookies.set(key, state, options);
	}, [state]);
	return [state, setState];
}

/**
 * Lowercase runtime type name, distinguishing the cases `typeof` lumps together.
 * @example
 * trueTypeOf([])                   // 'array'
 * trueTypeOf({})                   // 'object'
 * trueTypeOf('')                   // 'string'
 * trueTypeOf(new Date())           // 'date'
 * trueTypeOf(1)                    // 'number'
 * trueTypeOf(function () {})       // 'function'
 * trueTypeOf(async function () {}) // 'asyncfunction'
 * trueTypeOf(/test/i)              // 'regexp'
 * trueTypeOf(true)                 // 'boolean'
 * trueTypeOf(null)                 // 'null'
 * trueTypeOf()                     // 'undefined'
 */
export function trueTypeOf(obj: any) {
	return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase()
}

/**
 * useState persisted to localForage under `key`; the third element is true until
 * the stored value has been read. Only supports primitives, arrays, and `{}` objects.
 * @see https://reactjs.org/docs/hooks-custom.html
 */
export function useLocalForage<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>, boolean] {
	const [state, setState] = useState(defaultValue);
	const [loading, setLoading] = useState(true);

	// useLayoutEffect will be called before DOM paintings and before useEffect
	useLayoutEffect(() => {
		let allow = true;
		localforage.getItem(key)
			.then(value => {
				if (value === null) throw '';
				if (allow) setState(value as T);
			}).catch(() => localforage.setItem(key, defaultValue))
			.then(() => {
				if (allow) setLoading(false);
			});
		return () => { allow = false; }
	}, []);
	// useLayoutEffect does not like Promise return values.
	useEffect(() => {
		// do not allow setState to be called before data has even been loaded!
		// this prevents overwriting
		if (!loading) localforage.setItem(key, state);
	}, [state]);
	return [state, setState, loading];
}

/** Show a browser / native notification. */
export function notify(title: string, body: string) {
	new Notification(title, { body: body || "", });
}

/**
 * Catch clauses see `unknown`: JS throws Error instances, but tauri commands reject
 * with plain strings, and `JSON.stringify` on an Error yields `'{}'` (message/stack are
 * non-enumerable), so neither `String()` nor `stringify` alone covers both.
 * @param error anything caught or rejected with
 * @returns the message, with any Error `cause` chain appended
 */
export function fmtError(error: unknown): string {
	if (error instanceof Error) {
		// wrapped failures (fetch, tauri plugins) keep the real reason in `cause`
		return error.cause !== undefined ? `${error.message} (caused by: ${fmtError(error.cause)})` : error.message;
	}
	if (typeof error === 'string') return error;
	try {
		return JSON.stringify(error);
	} catch {
		return String(error);
	}
}

/** Resolves after `ms` milliseconds; `await sleep(500)` pauses an async function. */
export function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Triggers a browser download of `content` as a file named `filename`, by clicking
 * a temporary anchor pointing at an in-memory Blob.
 * @param filename the name the browser will save the file as
 * @param content the file body (string, ArrayBuffer, Blob, ...)
 * @param contentType the Blob's MIME type
 */
export function downloadFile(filename: string, content: BlobPart, contentType = 'text/plain') {
	const element = document.createElement('a');
	const file = new Blob([content], { type: contentType });
	element.href = URL.createObjectURL(file);
	element.download = filename;
	document.body.appendChild(element); // Required for this to work in FireFox
	element.click();
}


/**
 * Shallow, order-sensitive array equality: same length and `===` at every index.
 * `[1, 2]` and `[2, 1]` are not equal; sort copies of both first if order should
 * not matter. Elements are not compared deeply, so nested arrays/objects only
 * match by reference.
 */
export function arraysEqual<T>(a: T[], b: T[]) {
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (a.length !== b.length) return false;

	for (var i = 0; i < a.length; ++i) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

/**
 * Synchronously joins path segments with a specified separator
 * @param separator The separator to use between segments (e.g., '/', '\', '.')
 * @param segments The path segments to join
 * @returns The joined path string
 */
export function join(separator: string, ...segments: string[]): string | null {
	if (!segments || segments.length === 0) return '';
	if (segments.find(x => !(typeof x === 'string'))) return null;
	return segments.join(separator);
}
