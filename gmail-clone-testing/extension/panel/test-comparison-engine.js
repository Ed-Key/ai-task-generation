/**
 * Test Suite for ComparisonEngine
 * Extracted to external file to comply with CSP
 */

import { ComparisonEngine } from './comparison-engine.js';

// Mock API clients
class MockRealApiClient {
  async executeRequest(endpoint, method, pathParams, queryParams, bodyParams) {
    return {
      status: 200,
      body: { id: 'real_123', name: 'Test', type: 'user' },
      error: null,
      responseTime: 100
    };
  }
}

class MockCloneApiClient {
  async executeRequest(endpoint, method, pathParams, queryParams, bodyParams) {
    return {
      status: 200,
      body: { id: 'clone_456', name: 'Test', type: 'user' },
      error: null,
      responseTime: 80
    };
  }
}

// Test runner
const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, status: 'pass', error: null });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.push({ name, status: 'fail', error: error.message });
    console.error(`✗ ${name}:`, error.message);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEquals(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// Initialize engine
const realClient = new MockRealApiClient();
const cloneClient = new MockCloneApiClient();
const engine = new ComparisonEngine(realClient, cloneClient);

// ===== TEST SUITE =====

// Test 1: Basic object comparison - identical objects
test('Identical objects should have no differences', () => {
  const real = { name: 'Test', value: 42 };
  const clone = { name: 'Test', value: 42 };
  const diff = engine.generateDiff(real, clone, []);
  assert(!diff.hasDifferences, 'Should have no differences');
  assertEquals(diff.summary.count, 0, 'Count should be 0');
});

// Test 2: Value mismatch
test('Different primitive values should be detected', () => {
  const real = { name: 'TestA' };
  const clone = { name: 'TestB' };
  const diff = engine.generateDiff(real, clone, []);
  assert(diff.hasDifferences, 'Should have differences');
  assertEquals(diff.summary.count, 1, 'Should have 1 difference');
  assertEquals(diff.details[0].type, 'value_mismatch', 'Should be value mismatch');
  assertEquals(diff.details[0].path, 'name', 'Path should be "name"');
});

// Test 3: Ignored fields
test('Ignored fields should not be compared', () => {
  const real = { id: 'real_123', name: 'Test' };
  const clone = { id: 'clone_456', name: 'Test' };
  const diff = engine.generateDiff(real, clone, ['id']);
  assert(!diff.hasDifferences, 'Should ignore id differences');
  assertEquals(diff.summary.count, 0, 'Count should be 0');
});

// Test 4: Missing key in clone
test('Missing keys should be detected', () => {
  const real = { name: 'Test', extra: 'value' };
  const clone = { name: 'Test' };
  const diff = engine.generateDiff(real, clone, []);
  assert(diff.hasDifferences, 'Should detect missing key');
  assertEquals(diff.summary.count, 1, 'Should have 1 difference');
  assertEquals(diff.details[0].type, 'missing_in_clone', 'Should be missing in clone');
});

// Test 5: Nested object comparison
test('Nested object differences should be detected', () => {
  const real = { user: { name: 'Alice', age: 30 } };
  const clone = { user: { name: 'Alice', age: 31 } };
  const diff = engine.generateDiff(real, clone, []);
  assert(diff.hasDifferences, 'Should detect nested difference');
  assertEquals(diff.details[0].path, 'user.age', 'Path should include nesting');
});

// Test 6: Array comparison - identical
test('Identical arrays should match', () => {
  const real = { items: ['a', 'b', 'c'] };
  const clone = { items: ['a', 'b', 'c'] };
  const diff = engine.generateDiff(real, clone, []);
  assert(!diff.hasDifferences, 'Arrays should match');
});

// Test 7: Array comparison - different elements
test('Array element differences should be detected', () => {
  const real = { items: ['a', 'b', 'c'] };
  const clone = { items: ['a', 'x', 'c'] };
  const diff = engine.generateDiff(real, clone, []);
  assert(diff.hasDifferences, 'Should detect array difference');
  assertEquals(diff.details[0].path, 'items[1]', 'Should identify element index');
});

// Test 8: Array length mismatch
test('Array length differences should be detected', () => {
  const real = { items: ['a', 'b'] };
  const clone = { items: ['a', 'b', 'c'] };
  const diff = engine.generateDiff(real, clone, []);
  assert(diff.hasDifferences, 'Should detect length difference');
  const lengthDiff = diff.details.find(d => d.type === 'array_length_mismatch');
  assert(lengthDiff, 'Should have length mismatch entry');
});

// Test 9: Array of objects
test('Array of objects should be compared deeply', () => {
  const real = { labels: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }] };
  const clone = { labels: [{ id: '3', name: 'A' }, { id: '4', name: 'B' }] };
  const diff = engine.generateDiff(real, clone, ['id']);
  assert(!diff.hasDifferences, 'Should ignore IDs in array objects');
});

// Test 10: Type mismatch
test('Type mismatches should be detected', () => {
  const real = { value: 42 };
  const clone = { value: '42' };
  const diff = engine.generateDiff(real, clone, []);
  assert(diff.hasDifferences, 'Should detect type mismatch');
  assertEquals(diff.details[0].type, 'type_mismatch', 'Should be type mismatch');
});

// Test 11: Null vs object
test('Null vs object should be type mismatch', () => {
  const real = { data: null };
  const clone = { data: {} };
  const diff = engine.generateDiff(real, clone, []);
  assert(diff.hasDifferences, 'Should detect null vs object');
});

// Test 12: executeDual method
test('executeDual should return both results', async () => {
  const result = await engine.executeDual('/test', 'GET', {}, {}, {});
  assert(result.real, 'Should have real result');
  assert(result.clone, 'Should have clone result');
  assert(result.dualDuration >= 0, 'Should have duration');
  assertEquals(result.real.status, 200, 'Real should be 200');
  assertEquals(result.clone.status, 200, 'Clone should be 200');
});

// Test 13: Complex nested structure
test('Complex nested structures should be compared correctly', () => {
  const real = {
    id: 'real_123',
    labels: [
      { id: 'L1', name: 'Work', visibility: 'show' },
      { id: 'L2', name: 'Personal', visibility: 'hide' }
    ],
    metadata: {
      created: '2024-01-01',
      modified: '2024-01-15'
    }
  };
  const clone = {
    id: 'clone_456',
    labels: [
      { id: 'L3', name: 'Work', visibility: 'show' },
      { id: 'L4', name: 'Personal', visibility: 'show' } // Different visibility!
    ],
    metadata: {
      created: '2024-01-01',
      modified: '2024-01-15'
    }
  };
  const diff = engine.generateDiff(real, clone, ['id']);
  assert(diff.hasDifferences, 'Should detect nested difference');
  const visibilityDiff = diff.details.find(d => d.path === 'labels[1].visibility');
  assert(visibilityDiff, 'Should find visibility difference in array');
});

// Test 14: Empty objects
test('Empty objects should match', () => {
  const diff = engine.generateDiff({}, {}, []);
  assert(!diff.hasDifferences, 'Empty objects should match');
});

// Test 15: Wildcard ignore patterns
test('Wildcard ignore patterns should work', () => {
  const real = {
    user: { id: '1', profile: { id: '10' } },
    item: { id: '2' }
  };
  const clone = {
    user: { id: '99', profile: { id: '88' } },
    item: { id: '77' }
  };
  const diff = engine.generateDiff(real, clone, ['*.id']);
  assert(!diff.hasDifferences, 'Should ignore all id fields with wildcard');
});

// ===== RENDER RESULTS =====

const container = document.getElementById('test-results');
const passCount = results.filter(r => r.status === 'pass').length;
const failCount = results.filter(r => r.status === 'fail').length;

container.innerHTML = `
  <div class="test-section ${failCount === 0 ? 'pass' : 'fail'}">
    <div class="test-title">
      Test Summary: ${passCount}/${results.length} Passed
    </div>
    <div class="test-result">
      <span class="pass">✓ Passed: ${passCount}</span> |
      <span class="fail">✗ Failed: ${failCount}</span>
    </div>
  </div>

  ${results.map(r => `
    <div class="test-section ${r.status}">
      <div class="test-title">
        ${r.status === 'pass' ? '✓' : '✗'} ${r.name}
      </div>
      ${r.error ? `<div class="test-result fail">Error: ${r.error}</div>` : ''}
    </div>
  `).join('')}
`;

console.log('\n===== TEST SUMMARY =====');
console.log(`Total: ${results.length}`);
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log('=======================\n');
