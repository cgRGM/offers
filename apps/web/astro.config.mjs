// @ts-check
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import varlockAstroIntegration from "@varlock/astro-integration";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  adapter: vercel(),
  integrations: [varlockAstroIntegration({ ssrInjectMode: "auto-load" })],
  output: "server",
  vite: {
    plugins: [tailwindcss()],
  },
});
