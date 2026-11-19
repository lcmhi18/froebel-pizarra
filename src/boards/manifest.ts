/** Closed list of implemented, live-enabled pages. */
export const BOARD_MANIFEST = [
  { id: 'prueba', title: 'Pizarra de prueba', path: '/boards/prueba/', engine: 'svg-js',
    localKeys: ['tool', 'color', 'selection', 'magnet', 'largeBoard', 'hideOptions', 'tab'], fieldKeys: [] },
  { id: '_plantilla', title: 'Pizarra en blanco', path: '/boards/_plantilla/', engine: 'svg-js',
    localKeys: ['tool', 'color', 'selection', 'magnet', 'largeBoard', 'hideOptions', 'tab'], fieldKeys: [] },
  { id: 'geometria', title: 'Geometría completa', path: '/boards/geometria/', engine: 'svg-js',
    localKeys: ['tool','col','sel','sd','snap','tab','hide','ang','largeBoard','hideOptions'], fieldKeys: ['protractor'] },
  { id: 'konva', title: 'Geometría Konva', path: '/app-live/', engine: 'konva',
    localKeys: ['tool','col','sel','sd','snap','tab','hide','ang','largeBoard','hideOptions'], fieldKeys: ['protractor'] },
] as const;
