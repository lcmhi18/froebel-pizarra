import { compileLiveTests } from './compile-live-tests.mjs';
compileLiveTests();
await import('../tests/e5/connection.test.mjs');
