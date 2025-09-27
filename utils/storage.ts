
export type StorageSchemaVersion = 'v1';

export interface PersistOptions<T> {
  key: string;
  version: StorageSchemaVersion;
  migrate?: (oldData: unknown) => T; // TODO: Implement migration logic if schema changes
}

/**
 * Safely reads and parses a JSON value from localStorage.
 * @param opts - Persistence options including key and version.
 * @param fallback - The default value to return on failure.
 * @returns The parsed data or the fallback value.
 */
export function readJSON<T>(opts: PersistOptions<T>, fallback: T): T {
  try {
    const item = window.localStorage.getItem(opts.key);
    if (item === null) {
      return fallback;
    }
    // TODO: In a future version, we could check a version property
    // inside the stored object to trigger migration logic via opts.migrate.
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Error reading localStorage key “${opts.key}”:`, error);
    // Potentially clear the corrupted item
    // window.localStorage.removeItem(opts.key);
    return fallback;
  }
}

/**
 * Safely stringifies and writes a value to localStorage.
 * @param opts - Persistence options including key and version.
 * @param value - The value to store.
 */
export function writeJSON<T>(opts: PersistOptions<T>, value: T): void {
  try {
    const toStore = JSON.stringify(value);
    window.localStorage.setItem(opts.key, toStore);
  } catch (error) {
    console.warn(`Error writing to localStorage key “${opts.key}”:`, error);
  }
}

/**
 * Sets up a listener for 'storage' events on a specific key.
 * Useful for syncing state between tabs.
 * @param key - The localStorage key to listen to.
 * @param cb - The callback function to execute on change.
 * @returns A cleanup function to remove the event listener.
 */
export function onStorageChange(key: string, cb: (event: StorageEvent) => void): () => void {
  const listener = (event: StorageEvent) => {
    if (event.storageArea === window.localStorage && event.key === key) {
      cb(event);
    }
  };
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener('storage', listener);
  };
}

/**
 * Triggers a browser download for a given Blob.
 * @param blob - The Blob object to download.
 * @param filename - The desired name for the downloaded file.
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
