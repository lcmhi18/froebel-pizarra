import {compileLiveTests} from './compile-live-tests.mjs';
compileLiveTests();
await import('../tests/recta/model.test.mjs');
await import('../tests/recta/ui.test.mjs');
await import('../tests/recta/adapter.test.mjs');
await import('../tests/recta/transport.test.mjs');
