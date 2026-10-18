interface CacheOptions {
  ttlMs: number;
  storageKey?: string;
}

export interface CacheInstance<T> {
  get(): T | null;
  set(data: T): void;
  invalidate(): void;
  fetch(fn: () => Promise<T>, force?: boolean): Promise<T>;
}

export function createCache<T>(options: CacheOptions): CacheInstance<T> {
  let memoryData: T | null = null;
  let timestamp = 0;
  let inFlightPromise: Promise<T> | null = null;

  const isBrowser = typeof window !== "undefined" && typeof sessionStorage !== "undefined";

  return {
    get(): T | null {
      const now = Date.now();
      if (memoryData !== null && now - timestamp < options.ttlMs) {
        return memoryData;
      }

      if (options.storageKey && isBrowser) {
        try {
          const raw = sessionStorage.getItem(options.storageKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (now - parsed.timestamp < options.ttlMs) {
              memoryData = parsed.data;
              timestamp = parsed.timestamp;
              return memoryData;
            }
          }
        } catch {
          /* ignore parse or storage errors */
        }
      }

      return null;
    },

    set(data: T): void {
      memoryData = data;
      timestamp = Date.now();

      if (options.storageKey && isBrowser) {
        try {
          sessionStorage.setItem(
            options.storageKey,
            JSON.stringify({ data, timestamp }),
          );
        } catch {
          /* ignore storage quota or private browsing errors */
        }
      }
    },

    invalidate(): void {
      memoryData = null;
      timestamp = 0;
      inFlightPromise = null;

      if (options.storageKey && isBrowser) {
        try {
          sessionStorage.removeItem(options.storageKey);
        } catch {
          /* ignore storage errors */
        }
      }
    },

    async fetch(fn: () => Promise<T>, force = false): Promise<T> {
      if (!force) {
        const cached = this.get();
        if (cached !== null) {
          return cached;
        }
        if (inFlightPromise) {
          return inFlightPromise;
        }
      }

      inFlightPromise = fn()
        .then((res) => {
          this.set(res);
          inFlightPromise = null;
          return res;
        })
        .catch((err) => {
          inFlightPromise = null;
          throw err;
        });

      return inFlightPromise;
    },
  };
}

interface KeyedCacheOptions {
  ttlMs: number;
}

export interface KeyedCacheInstance<T> {
  get(key: string): T | null;
  set(key: string, data: T): void;
  invalidate(key?: string): void;
  fetch(key: string, fn: () => Promise<T>, force?: boolean): Promise<T>;
}

export function createKeyedCache<T>(options: KeyedCacheOptions): KeyedCacheInstance<T> {
  const memoryMap = new Map<string, { data: T; timestamp: number }>();
  const inFlightMap = new Map<string, Promise<T>>();

  return {
    get(key: string): T | null {
      const entry = memoryMap.get(key);
      if (entry && Date.now() - entry.timestamp < options.ttlMs) {
        return entry.data;
      }
      return null;
    },

    set(key: string, data: T): void {
      memoryMap.set(key, { data, timestamp: Date.now() });
    },

    invalidate(key?: string): void {
      if (key) {
        memoryMap.delete(key);
        inFlightMap.delete(key);
      } else {
        memoryMap.clear();
        inFlightMap.clear();
      }
    },

    async fetch(key: string, fn: () => Promise<T>, force = false): Promise<T> {
      if (!force) {
        const cached = this.get(key);
        if (cached !== null) {
          return cached;
        }
        const pending = inFlightMap.get(key);
        if (pending) {
          return pending;
        }
      }

      const promise = fn()
        .then((res) => {
          this.set(key, res);
          inFlightMap.delete(key);
          return res;
        })
        .catch((err) => {
          inFlightMap.delete(key);
          throw err;
        });

      inFlightMap.set(key, promise);
      return promise;
    },
  };
}

