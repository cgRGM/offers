import node from "@astrojs/node";
// @ts-check
import tailwindcss from "@tailwindcss/vite";
import varlockAstroIntegration from "@varlock/astro-integration";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  adapter: node({ mode: "standalone" }),
  integrations: [varlockAstroIntegration({ ssrInjectMode: "auto-load" })],
  output: "server",
  vite: {
    plugins: [tailwindcss()],
  },
});
