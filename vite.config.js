import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'timmy.glb',  // Source path of the GLB file
          dest: ''           // Destination folder inside 'dist'
        }
      ]
    })
  ]
});
