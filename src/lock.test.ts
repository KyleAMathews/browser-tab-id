import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runWithLock } from "./";

describe("runWithLock", () => {
  // assign the spy instance to a const
  const setItemSpy = vi.spyOn(localStorage, "setItem");
  const getItemSpy = vi.spyOn(localStorage, "getItem");
  vi.useFakeTimers();

  afterEach(() => {
    setItemSpy.mockClear(); // clear call history
    localStorage.clear();
  });
  it("acquires the lock when it is available", () => {
    localStorage.getItem.mockReturnValue(null); // Simulate lock is not held

    const fn = vi.fn();
    runWithLock(fn);

    expect(fn).toHaveBeenCalled(); // Function should be executed
    expect(setItemSpy).toHaveBeenCalledWith("mutexLock", expect.any(String)); // Lock should be set
  });

  it("waits and retries when lock is already taken", () => {
    const lockValue = `${Date.now()}|someTabId`; // Simulate lock is held
    getItemSpy.mockReturnValue(lockValue);
    getItemSpy.mockReturnValueOnce(lockValue).mockReturnValueOnce(null); // First call: lock is held, second call: lock is released

    const fn = vi.fn();
    runWithLock(fn);

    vi.runAllTimers(); // Fast-forward timer to simulate delay

    expect(fn).toHaveBeenCalledTimes(1); // Function should be executed once
    expect(localStorage.setItem).toHaveBeenCalledTimes(2); // Two calls: first fails, second succeeds
  });

  it("acquires the lock when the previous lock has timed out", () => {
    const oldTimestamp = Date.now() - 200; // Simulate an old lock that should be timed out
    const lockValue = `${oldTimestamp}|someTabId`;
    localStorage.getItem.mockReturnValue(lockValue);

    const fn = vi.fn();
    runWithLock(fn);

    expect(fn).toHaveBeenCalled();
    expect(setItemSpy).toHaveBeenCalledWith(
      "mutexLock",
      expect.any(String)
    );
  });
});
