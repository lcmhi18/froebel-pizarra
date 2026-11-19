import {defineConfig} from 'vite';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
const root=process.cwd(),fromApp=createRequire(resolve(root,'app-live/package.json'));
export default defineConfig({
 root:resolve(root,'app-live'),base:'/app-live/',envDir:root,publicDir:false,cacheDir:resolve(root,'node_modules/.vite-konva'),
 resolve:{alias:[
  {find:/^react$/,replacement:fromApp.resolve('react')},
  {find:/^react\/jsx-runtime$/,replacement:fromApp.resolve('react/jsx-runtime')},
  {find:/^react\/jsx-dev-runtime$/,replacement:fromApp.resolve('react/jsx-dev-runtime')},
  {find:/^react-dom\/client$/,replacement:fromApp.resolve('react-dom/client')},
  {find:'@shared',replacement:resolve(root,'src/shared')},
 ]},
 server:{host:'127.0.0.1',port:5175,strictPort:true,fs:{allow:[root]},proxy:{'/api':{target:'http://127.0.0.1:8787',ws:true},'/geometry-assets':{target:'http://127.0.0.1:5174'}}},
 build:{outDir:resolve(root,'dist/app-live'),emptyOutDir:true,rollupOptions:{input:resolve(root,'app-live/index.html')}},
});
