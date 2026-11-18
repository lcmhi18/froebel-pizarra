/** Only implemented boards are listed. Add _plantilla when it exists in E5. */
export const BOARD_MANIFEST = [
  { id: 'prueba', title: 'Pizarra de prueba', path: '/boards/prueba/', engine: 'svg-js',
    localKeys: ['tool', 'color', 'selection', 'magnet', 'largeBoard', 'hideOptions', 'tab'], fieldKeys: [] },
] as const;
