/**
 * @deprecated Returns a greeting message.
 * @returns A string greeting "Hello, world!"
 */
export function helloWorld() {
  return "Hello, world!";
}

/**
 * Asserts that a value is defined (not null or undefined).
 * This function is useful for narrowing types in TypeScript.
 *
 * @param value - The value to check
 * @returns Asserts that the value is defined (not null or undefined)
 */
export function assertIsDefined<T>(value: T): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(`${value} is not defined`);
  }
}
