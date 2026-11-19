import {compileLiveTests} from './compile-live-tests.mjs';
compileLiveTests();
await import('../tests/e10/equivalence.test.mjs');
await import('../tests/e10/robustness.test.mjs');
