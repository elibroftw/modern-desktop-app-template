import { isTauri } from '@tauri-apps/api/core';
import { sep } from '@tauri-apps/api/path';

/**
 * OS path separator. Tauri injects it into the webview before any page script runs
 * (`window.__TAURI_INTERNALS__.plugins.path.sep`), so it is a synchronous constant;
 * in a plain browser there is no OS path, so `'/'`.
 */
export const PATH_SEP = isTauri() ? sep() : '/';

/**
 * Synchronously joins path segments with the OS separator ({@link PATH_SEP}).
 * @returns the joined path, `''` for no segments, `null` if any segment is not a string
 */
export function joinPath(...segments: string[]): string {
	if (segments.length === 0) return '';
	return segments.join(PATH_SEP);
}
