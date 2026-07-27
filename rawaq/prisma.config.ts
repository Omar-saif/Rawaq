import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: "prisma/schema.prisma",
  seed: async () => {
    const { execSync } = await import("child_process");
    execSync("tsx prisma/seed.ts", { stdio: "inherit" });
  },
});
