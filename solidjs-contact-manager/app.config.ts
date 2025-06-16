import { defineConfig } from "@solidjs/start/config";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  vite: {
    plugins: [
      visualizer({
        filename: "bundle-analysis.html",
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
  },
});
