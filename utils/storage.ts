class SafeStorage {
    private memoryStore = new Map<string, string>();

    getItem(key: string): string | null {
        try {
            return window.localStorage.getItem(key);
        } catch (e) {
            return this.memoryStore.get(key) || null;
        }
    }

    setItem(key: string, value: string): void {
        try {
            window.localStorage.setItem(key, value);
        } catch (e) {
            this.memoryStore.set(key, value);
        }
    }

    removeItem(key: string): void {
        try {
            window.localStorage.removeItem(key);
        } catch (e) {
            this.memoryStore.delete(key);
        }
    }

    clear(): void {
        try {
            window.localStorage.clear();
        } catch (e) {
            this.memoryStore.clear();
        }
    }
}

class SafeSessionStorage {
    private memoryStore = new Map<string, string>();

    getItem(key: string): string | null {
        try {
            return window.sessionStorage.getItem(key);
        } catch (e) {
            return this.memoryStore.get(key) || null;
        }
    }

    setItem(key: string, value: string): void {
        try {
            window.sessionStorage.setItem(key, value);
        } catch (e) {
            this.memoryStore.set(key, value);
        }
    }

    removeItem(key: string): void {
        try {
            window.sessionStorage.removeItem(key);
        } catch (e) {
            this.memoryStore.delete(key);
        }
    }

    clear(): void {
        try {
            window.sessionStorage.clear();
        } catch (e) {
            this.memoryStore.clear();
        }
    }
}

export const storage = new SafeStorage();
export const safeSessionStorage = new SafeSessionStorage();
