import path from "node:path";

export function loadProjectEnv(projectDir) {
  try {
    process.loadEnvFile(path.join(projectDir, ".env.local"));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
