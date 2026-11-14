import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  build: {
    // three.js is lazy-loaded in its own chunk (only fetched when a 3D scene mounts).
    // The examples (GLTF + meshopt loaders, RoomEnvironment) are only used by
    // the laptop intro, so they get a separate chunk the hero scene never needs.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/three/examples")) return "three-extras";
          if (id.includes("node_modules/three")) return "three";
          return undefined;
        },
      },
    },
  },
})
