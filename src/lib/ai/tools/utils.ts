import fs from 'fs/promises';
import path from 'path';
import ignore from 'ignore';
import { findUpSync } from 'find-up';

export const IGNORE_PATTERNS = [
  // Directories
  "**/node_modules/**",
  "**/out.txt",
  "**/.npmrc",
  "**/.prettierrc",
  "**/.prettierignore",
  "**/.svelte-kit/**",
  "**/.git/**",
  "**/build/**",
  "**/dist/**",
  "**/.vscode/**",

  // Config files
  "**/svelte.config.js",
  "**/tailwind.config.js",
  "**/postcss.config.js",
  "**/.eslintrc.*",
  "**/eslint.config.js",

  // Package manager files
  "**/package-lock.json",
  "**/yarn.lock",
  "**/pnpm-lock.yaml",

  // Misc files
  "**/.DS_Store",
  "**/*.log",
  "**/*.lock",
  "**/*.sh",
  "**/*.env*",
  "!**/.env.example",

  // Binary files
  "**/*.png",
  "**/*.jpg",
  "**/*.gif",
  "**/*.svg",

  // Temporary files
  "**/*.tmp",
  "**/*.temp",
  "**/*.cache",

  // Specific to your project
  "**/copy_to_clipboard.sh",
  "**/fix_packages_to_knowledgecutoff.sh",
  "**/setup_tailwind.sh",

  //? Included for AI SWE bot
  // "**/tsconfig.json",
  // "**/vite.config.ts",
  // "**/playwright.config.ts",
  // "**/*.test.ts",
  // "**/*.spec.ts",
  // "**/tests/**",
];

export const getProjectRoot = () => {
  const packageJsonPath = findUpSync('package.json');
  if (!packageJsonPath)
    throw new Error('Unable to find project root');
  return path.dirname(packageJsonPath);
};

export async function walkDir(baseDir: string, currentDir: string, ig: ReturnType<typeof ignore>, depth: number): Promise<string[]> {
  const list = await fs.readdir(currentDir);
  const results = await Promise.all(list.map(async (file) => {
    const filePath = path.join(currentDir, file);
    const relativePath = path.relative(baseDir, filePath);
    if (ig.ignores(relativePath))
      return [];
    const stat = await fs.stat(filePath);
    return stat.isDirectory() && depth !== 0
      ? walkDir(baseDir, filePath, ig, depth > 0 ? depth - 1 : -1)
      : [filePath];
  }));
  return results.flat();
}

export const resolveProjectPath = (...segments: string[]) => path.join(getProjectRoot(), ...segments);
export const createIgnore = async (dir: string) => {
  const gitignorePath = path.join(dir, '.gitignore');
  const gitignorePatterns = await fs.readFile(gitignorePath, 'utf-8')
    .then(content => content.split('\n').filter(line => line.trim() && !line.startsWith('#')))
    .catch(() => []);
  return ignore().add([...IGNORE_PATTERNS, ...gitignorePatterns]);
};
