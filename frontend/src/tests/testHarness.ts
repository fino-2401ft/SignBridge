/**
 * Lightweight test assertion framework for TypeScript validation and standalone unit test execution.
 */

export function describe(suiteName: string, fn: () => void): void {
  try {
    fn();
  } catch (err) {
    // console.error(`[Test Suite Failed] ${suiteName}:`, err);
    throw err;
  }
}

export function test(caseName: string, fn: () => void): void {
  try {
    fn();
  } catch (err) {
    // console.error(`[Test Case Failed] ${caseName}:`, err);
    throw err;
  }
}

export interface AssertionMatchers<T> {
  toBe(expected: T): void;
  toEqual(expected: T): void;
  toContain(item: any): void;
  toBeGreaterThan(val: number): void;
  toBeLessThan(val: number): void;
  toBeGreaterThanOrEqual(val: number): void;
  toBeLessThanOrEqual(val: number): void;
  toBeNull(): void;
  not: {
    toBe(expected: T): void;
    toContain(item: any): void;
    toBeNull(): void;
  };
}

export function expect<T>(actual: T): AssertionMatchers<T> {
  return {
    toBe(expected: T) {
      if (actual !== expected) {
        throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
      }
    },
    toEqual(expected: T) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected deep equality: ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
      }
    },
    toContain(item: any) {
      if (Array.isArray(actual)) {
        if (!actual.includes(item)) {
          throw new Error(`Array did not contain ${String(item)}`);
        }
      } else if (typeof actual === "string") {
        if (!actual.includes(item)) {
          throw new Error(`String did not contain substring ${String(item)}`);
        }
      }
    },
    toBeGreaterThan(val: number) {
      if (typeof actual !== "number" || actual <= val) {
        throw new Error(`Expected ${String(actual)} to be greater than ${val}`);
      }
    },
    toBeLessThan(val: number) {
      if (typeof actual !== "number" || actual >= val) {
        throw new Error(`Expected ${String(actual)} to be less than ${val}`);
      }
    },
    toBeGreaterThanOrEqual(val: number) {
      if (typeof actual !== "number" || actual < val) {
        throw new Error(`Expected ${String(actual)} to be >= ${val}`);
      }
    },
    toBeLessThanOrEqual(val: number) {
      if (typeof actual !== "number" || actual > val) {
        throw new Error(`Expected ${String(actual)} to be <= ${val}`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected null, received ${String(actual)}`);
      }
    },
    not: {
      toBe(expected: T) {
        if (actual === expected) {
          throw new Error(`Expected value NOT to be ${String(expected)}`);
        }
      },
      toContain(item: any) {
        if (Array.isArray(actual) && actual.includes(item)) {
          throw new Error(`Array unexpectedly contained ${String(item)}`);
        }
      },
      toBeNull() {
        if (actual === null) {
          throw new Error(`Expected value NOT to be null`);
        }
      },
    },
  };
}
