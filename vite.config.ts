import { defineConfig } from 'vite';
export default defineConfig({server:{host:'127.0.0.1',port:5174,proxy:{'/api':{target:'http://127.0.0.1:8787',ws:true}}},build:{rollupOptions:{input:{home:'index.html',profesor:'src/pages/profesor/index.html',alumno:'src/pages/alumno/index.html',prueba:'src/boards/prueba/index.html'}}}});
