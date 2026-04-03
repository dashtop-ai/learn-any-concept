import { defineConfig } from "vite";
import { dashtopWidget } from "@dashtop/widget-sdk/vite";

export default defineConfig({
  plugins: [dashtopWidget()],
});
