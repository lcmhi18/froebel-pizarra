import {compileLiveTests} from './compile-live-tests.mjs';
compileLiveTests();
await import('../tests/e9/geometry.test.mjs');
await import('../tests/e9/primary.test.mjs');
