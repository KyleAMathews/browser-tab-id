const LOCK_KEY = `mutexLock`;
const LOCK_TIMEOUT = 100; // 100 milliseconds

export function acquireLock() {
  const now = Date.now();
  const lockValue = localStorage.getItem(LOCK_KEY);

  if (lockValue) {
    const [lockTime, lockTab] = lockValue.split(`|`);

    // If we already have a lock, just continue.
    if (lockTab === getTabId()) {
      return true;
    }
    // Check if the lock has timed out
    if (now - parseInt(lockTime, 10) < LOCK_TIMEOUT) {
      return false; // Lock is still valid
    }
  }

  // Set or update the lock
  localStorage.setItem(LOCK_KEY, `${now}|${getTabId()}`);
  return true;
}

export function releaseLock() {
  localStorage.removeItem(LOCK_KEY);
}

function getTabId() {
  // Generate a unique identifier for the tab
  if (!localStorage.getItem(`tabId`)) {
    localStorage.setItem(`tabId`, Date.now() + Math.random().toString());
  }
  return localStorage.getItem(`tabId`);
}

export function runWithLock(fn: Function) {
  const maxDelay = 300; // maximum delay in milliseconds
  const delay = Math.random() * maxDelay; // random delay between 0 to 300 ms

  const attemptLock = () => {
    if (acquireLock()) {
      fn();

      releaseLock();
    } else {
      console.log(`Retrying to acquire lock`);
      setTimeout(attemptLock, delay);
    }
  };

  attemptLock();
}

interface TabIdEntry {
  lastUpdate: number;
  tabId: number;
}

export class TabIdCoordinator {
  heartbeatInterval: number;
  inactivityThreshold: number;
  tabIDsKey: string;
  tabId: number;
  uuid: string;
  sessionIDKey: string;

  constructor() {
    this.heartbeatInterval = 5000; // 5 seconds
    this.inactivityThreshold = 10000; // 10 seconds
    this.tabIDsKey = `tab_ids`;
    this.sessionIDKey = `tab_coordinator_id`; // Key for storing ID in sessionStorage
    this.uuid = this.generateUUID();
    window.addEventListener(`storage`, this.handleStorageChange.bind(this));
    this.tabId = this.retrieveSessionId(); // Attempt to retrieve tabId from sessionStorage
    runWithLock(() => {
      this.cleanup(); // Clean up before assigning tabId
      this.assignTabId();
      this.updateHeartbeat();
    });
    setInterval(() => this.updateHeartbeat(), this.heartbeatInterval);
  }

  generateUUID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  retrieveSessionId() {
    // Retrieve the existing tabId from sessionStorage if it exists
    return parseInt(sessionStorage.getItem(this.sessionIDKey) || ``, 10);
  }

  storeSessionID(tabId: number) {
    // Store the assigned ID in sessionStorage
    sessionStorage.setItem(this.sessionIDKey, tabId.toString());
  }

  getTabIDs(): Record<string, TabIdEntry> {
    return JSON.parse(localStorage.getItem(this.tabIDsKey) || "{}");
  }

  setTabIDs(ids: Record<string, TabIdEntry>) {
    localStorage.setItem(this.tabIDsKey, JSON.stringify(ids));
  }

  updateHeartbeat() {
    runWithLock(() => {
      this.cleanup(); // Clean up on each heartbeat
      const ids = this.getTabIDs();
      ids[this.uuid] = {
        lastUpdate: Date.now(),
        tabId: ids[this.uuid]?.tabId || this.findLowestAvailableID(ids),
      };
      this.setTabIDs(ids);
    });
  }

  findLowestAvailableID(ids: Record<string, TabIdEntry>) {
    const usedIds = Object.values(ids).map((entry) => entry.tabId);
    let tabId = 1;
    while (usedIds.includes(tabId)) {
      tabId++;
    }
    return tabId;
  }

  handleStorageChange(event: StorageEvent) {
    if (event.key === this.tabIDsKey) {
      runWithLock(() => {
        const newTabIDs = JSON.parse(event.newValue || ``);
        const currentTabIDs = this.getTabIDs();

        // Check if the data in localStorage has changed
        if (this.isDifferent(newTabIDs, currentTabIDs)) {
          this.cleanup();
          this.assignTabId();
        }
      });
    }
  }

  isDifferent(
    newData: Record<string, TabIdEntry>,
    currentData: Record<string, TabIdEntry>
  ) {
    // Compare the new data with the current data to see if there's any difference
    const newEntries = Object.entries(newData);
    if (newEntries.length !== Object.entries(currentData).length) {
      return true;
    }

    for (const [uuid, data] of newEntries) {
      if (!currentData[uuid] || currentData[uuid].tabId !== data.tabId) {
        return true;
      }
    }
    return false;
  }

  cleanup() {
    const ids = this.getTabIDs();
    const now = Date.now();
    for (const [uuid, data] of Object.entries(ids)) {
      if (now - data.lastUpdate > this.inactivityThreshold) {
        delete ids[uuid];
      }
    }
    this.setTabIDs(ids);
  }

  assignTabId() {
    const ids = this.getTabIDs();
    if (this.tabId) {
      // If the tab has an ID from sessionStorage, reuse it
      ids[this.uuid] = { lastUpdate: Date.now(), tabId: this.tabId };
    } else {
      // If no ID in sessionStorage, find a new ID
      this.tabId = this.findLowestAvailableID(ids);
      ids[this.uuid] = { lastUpdate: Date.now(), tabId: this.tabId };
      this.storeSessionID(this.tabId); // Store the new tabId in sessionStorage
    }
    this.setTabIDs(ids);
  }
}
