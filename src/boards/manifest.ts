/** Closed list of implemented, live-enabled pages. */
export const BOARD_MANIFEST = [
  { id: 'prueba', title: 'Pizarra de prueba', path: '/boards/prueba/', engine: 'svg-js',
    localKeys: ['tool', 'color', 'selection', 'magnet', 'largeBoard', 'hideOptions', 'tab'], fieldKeys: [] },
  { id: '_plantilla', title: 'Pizarra en blanco', path: '/boards/_plantilla/', engine: 'svg-js',
    localKeys: ['tool', 'color', 'selection', 'magnet', 'largeBoard', 'hideOptions', 'tab'], fieldKeys: [] },
] as const;
