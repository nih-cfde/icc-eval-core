import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import svgLoader from "vite-svg-loader";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    BUILT_ON: JSON.stringify(
      new Date().toLocaleString(undefined, { dateStyle: "medium" }),
    ),
  },
  plugins: [
    vue(),
    svgLoader({
      defaultImport: "component",
      svgoConfig: {
        plugins: [
          {
            name: "addAttributesToSVGElement",
            params: { attributes: [{ height: "1em" }] },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "~": fileURLToPath(new URL("../data/output", import.meta.url)),
    },
  },
});
