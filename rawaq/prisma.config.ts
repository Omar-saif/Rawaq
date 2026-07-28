import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  seed: async () => {
    const { execSync } = await import("child_process");
    execSync("tsx prisma/seed.ts", { stdio: "inherit" });
  },
});

