import { defineConfig } from "vite";
export default defineConfig({
  base: "/kiosk/",
  server: { proxy: { "/vending": "http://localhost:3000" } },
});
