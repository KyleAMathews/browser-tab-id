declare function acquireLock(): boolean;
declare function releaseLock(): void;
declare function runWithLock(fn: Function): void;
interface TabIdEntry {
    lastUpdate: number;
    tabId: number;
}
declare class TabIdCoordinator {
    heartbeatInterval: number;
    inactivityThreshold: number;
    tabIDsKey: string;
    tabId: number;
    uuid: string;
    sessionIDKey: string;
    constructor();
    generateUUID(): string;
    retrieveSessionId(): number;
    storeSessionID(tabId: number): void;
    getTabIDs(): Record<string, TabIdEntry>;
    setTabIDs(ids: Record<string, TabIdEntry>): void;
    updateHeartbeat(): void;
    findLowestAvailableID(ids: Record<string, TabIdEntry>): number;
    handleStorageChange(event: StorageEvent): void;
    isDifferent(newData: Record<string, TabIdEntry>, currentData: Record<string, TabIdEntry>): boolean;
    cleanup(): void;
    assignTabId(): void;
}

export { TabIdCoordinator, acquireLock, releaseLock, runWithLock };
