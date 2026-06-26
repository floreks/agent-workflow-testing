import test from 'node:test';
import assert from 'node:assert/strict';

import { countToHundred } from '../src/count.js';

test('countToHundred returns numbers 1 through 100', () => {
  const numbers = countToHundred();

  assert.equal(numbers.length, 100);
  assert.deepEqual(numbers.slice(0, 5), [1, 2, 3, 4, 5]);
  assert.deepEqual(numbers.slice(-5), [96, 97, 98, 99, 100]);
  assert.equal(new Set(numbers).size, 100);
});
