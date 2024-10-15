import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'public',  // This specifies the output directory for the build
    emptyOutDir: true  // Optional: Clears the output directory before each build
  }
});
