import { compileLiveTests } from './compile-live-tests.mjs';
compileLiveTests();
await import('../tests/e4/engine.test.mjs');
