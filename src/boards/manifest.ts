/** Live-enabled boards only. The standalone _plantilla skeleton is registered in E6. */
export const BOARD_MANIFEST = [
  { id: 'prueba', title: 'Pizarra de prueba', path: '/boards/prueba/', engine: 'svg-js',
    localKeys: ['tool', 'color', 'selection', 'magnet', 'largeBoard', 'hideOptions', 'tab'], fieldKeys: [] },
] as const;
