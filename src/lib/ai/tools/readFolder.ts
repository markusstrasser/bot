import { z } from "zod";
import fs from 'fs/promises';
import path from 'path';
import ignore from 'ignore';
import createTool from "./createTool";

const ALWAYS_IGNORE = [
  "node_modules",
  ".svelte-kit",
  "build",
  ".DS_Store",
  "*.log",
  "*.lock",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "ignored_file.txt",
  "*.env*",
  "!.env.example"
];

const getGitignorePatterns = async (dir: string) => {
  try {
    const gitignorePath = path.join(dir, '.gitignore');
    const gitignore = await fs.readFile(gitignorePath, 'utf-8');
    return gitignore.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  } catch {
    console.warn("No .gitignore file found. Using default ignore patterns.");
    return [];
  }
};

const walkDir = async (baseDir: string, currentDir: string, ig: ReturnType<typeof ignore>, depth: number): Promise<string[]> => {
  const list = await fs.readdir(currentDir);
  const results = await Promise.all(list.map(async file => {
    const filePath = path.join(currentDir, file);
    const relativePath = path.relative(baseDir, filePath);
    if (ig.ignores(relativePath)) return [];
    
    const stat = await fs.stat(filePath);
    if (stat.isDirectory() && depth !== 0) {
      return walkDir(baseDir, filePath, ig, depth > 0 ? depth - 1 : -1);
    }
    return [filePath];
  }));
  return results.flat();
};

const readFolder = async (target: string, depth: number): Promise<string> => {
  const absoluteTarget = path.resolve(target);
  const gitignorePatterns = await getGitignorePatterns(absoluteTarget);
  const ig = ignore().add([...ALWAYS_IGNORE, ...gitignorePatterns]);
  const files = await walkDir(absoluteTarget, absoluteTarget, ig, depth);

  const content = await Promise.all(files.map(async file => {
    const stat = await fs.stat(file);
    const relativePath = path.relative(absoluteTarget, file);
    const lastModified = stat.mtime.toISOString();
    const header = `\n/* File: ${relativePath}\n   Absolute path: ${file}\n   Last modified: ${lastModified} */\n\n`;
    return header + (stat.isDirectory() ? `// Directory: ${relativePath}\n` : await fs.readFile(file, 'utf-8'));
  }));

  return content.join('\n');
};

export default createTool({
  description: `Reads project files and folders from a specified directory with a specified depth of recursion.
  Respects .gitignore patterns and additional project-specific ignore patterns.
  Returns a string containing the contents of all read files, with metadata comments.`,
  schema: z.object({
    content: z.string().describe("The content of the folder")
  }),
  params: z.object({
    target: z.string().default('.').describe("The target directory to read files from"),
    depth: z.number().int().min(-1).default(-1).describe("The depth of recursion. 0 means just the folder contents, -1 means until the end")
  }),
  execute: async ({ target, depth }) => ({ content: await readFolder(target, depth) })
});