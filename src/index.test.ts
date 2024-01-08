import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock localStorage and sessionStorage
// global.localStorage = {
// getItem: vi.fn(),
// setItem: vi.fn(),
// removeItem: vi.fn(),
// };
// global.sessionStorage = {
// getItem: vi.fn(),
// setItem: vi.fn(),
// };

// Mock Date.now() and Math.random()
vi.spyOn(Date, "now").mockReturnValue(1000000000000);
// vi.spyOn(Math, 'random').mockReturnValue(0.5);

// Import the TabIdCoordinator class
import { TabIdCoordinator } from "./";

describe.sequential("TabIdCoordinator", () => {
  let coordinator;

  beforeEach(() => {
    coordinator = new TabIdCoordinator();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("correctly interacts with localStorage for getTabIDs and setTabIDs", () => {
    const ids = coordinator.getTabIDs();
    expect(Object.values(ids)[0].tabId).toEqual(1);

    const newIds = { uuid2: { lastUpdate: 1000000000000, tabId: 2 } };
    coordinator.setTabIDs(newIds);
    const ids2 = coordinator.getTabIDs();
    expect(ids2).toEqual(newIds);
  });

  it("finds the lowest available ID", () => {
    const ids = {
      uuid1: { lastUpdate: 1000000000000, tabId: 1 },
      uuid2: { lastUpdate: 1000000000000, tabId: 2 },
    };
    expect(coordinator.findLowestAvailableID(ids)).toBe(3);
  });

  it("cleans up old entries based on the inactivity threshold", () => {
    const ids = {
      uuid1: { lastUpdate: 1000000000000, tabId: 1 },
      uuid2: { lastUpdate: 950000000000, tabId: 2 }, // This should be removed
    };
    coordinator.setTabIDs(ids);
    coordinator.cleanup();
    const newIds = coordinator.getTabIDs();
    expect(newIds).toEqual({ uuid1: { lastUpdate: 1000000000000, tabId: 1 } });
  });

  it("determines if two sets of data are different", () => {
    const data1 = { uuid1: { tabId: 1 } };
    const data2 = { uuid1: { tabId: 1 }, uuid2: { tabId: 2 } };
    expect(coordinator.isDifferent(data1, data2)).toBe(true);
    expect(coordinator.isDifferent(data1, data1)).toBe(false);
  });
});

