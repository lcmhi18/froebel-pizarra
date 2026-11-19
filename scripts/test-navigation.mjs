import {compileLiveTests} from './compile-live-tests.mjs';
compileLiveTests();
await import('../tests/e6/navigation.test.mjs');
