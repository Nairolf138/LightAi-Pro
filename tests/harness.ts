import assert from 'node:assert/strict';

type TestCase = {
  name: string;
  fn: () => void | Promise<void>;
};

const testCases: TestCase[] = [];

export const test = (name: string, fn: () => void | Promise<void>): void => {
  testCases.push({ name, fn });
};

export { assert };

export const run = async (): Promise<void> => {
  const failures: Array<{ name: string; error: unknown }> = [];

  for (const testCase of testCases) {
    try {
      await testCase.fn();
      console.log(`✓ ${testCase.name}`);
    } catch (error) {
      failures.push({ name: testCase.name, error });
      console.error(`✗ ${testCase.name}`);
      console.error(error);
    }
  }

  if (failures.length > 0) {
    throw new Error(`${failures.length} test(s) failed`);
  }

  console.log(`\n${testCases.length} test(s) passed.`);
};
