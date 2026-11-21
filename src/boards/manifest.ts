import {BOARD_PERMISSIONS} from '../shared/permissions';
/** Closed list of independently implemented board pages. */
export const BOARD_MANIFEST = [
  { id: 'prueba', title: 'Pizarra de prueba', path: '/boards/prueba/', engine: 'svg-js',
    localKeys: ['tool', 'color', 'selection', 'magnet', 'largeBoard', 'hideOptions', 'tab'], fieldKeys: [] },
  { id: '_plantilla', title: 'Pizarra en blanco', path: '/boards/_plantilla/', engine: 'svg-js',
    localKeys: ['tool', 'color', 'selection', 'magnet', 'largeBoard', 'hideOptions', 'tab'], fieldKeys: [] },
  { id: 'geometria', title: 'Geometría completa', path: '/boards/geometria/', engine: 'svg-js',
    localKeys: ['tool','col','sel','sd','snap','tab','hide','ang','largeBoard','hideOptions'], fieldKeys: ['protractor'] },
  { id: 'konva', title: 'Geometría de Primaria', path: '/app-live/', engine: 'konva',
    localKeys: ['tool','col','sel','sd','snap','tab','hide','ang','largeBoard','hideOptions'], fieldKeys: ['protractor'] },
  { id:'aritmetica',title:'Aritmética de Primaria',path:'/boards/aritmetica/',engine:'svg-js',localKeys:['tool','selection','color','tab','view','hold','snap','largeBoard','hideUpper','hideLower'],fieldKeys:['regions'] },
  {id:'recta-numerica',title:'Recta numérica · Álgebra de Primaria',path:'/boards/recta-numerica/',engine:'svg-js',localKeys:['sg','dg','msg','drag','hot','nc'],fieldKeys:['a','b','note','fs'],permissions:BOARD_PERMISSIONS['recta-numerica']},
  {id:'operaciones-combinadas',title:'Operaciones combinadas · Álgebra de Primaria',path:'/boards/operaciones-combinadas/',engine:'svg-js',localKeys:['tool','color','theme'],fieldKeys:['lesson'],permissions:BOARD_PERMISSIONS['operaciones-combinadas']},
  {id:'intervalos',title:'Intervalos en ℤ · Álgebra de Primaria',path:'/boards/intervalos/',engine:'svg-js',localKeys:['tool','color','hideUpper','hideLower','largeBoard'],fieldKeys:['lesson'],permissions:BOARD_PERMISSIONS.intervalos},
  {id:'fracciones',title:'Fracciones · Aritmética de Primaria',path:'/boards/fracciones/',engine:'svg-js',localKeys:['tool','color','theme','exam'],fieldKeys:['lesson','drawing'],permissions:BOARD_PERMISSIONS.fracciones},
] as const;
