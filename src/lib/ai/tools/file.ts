import { z } from "zod";
import fs from 'fs/promises';
import path from 'path';
import ignore from 'ignore';
import { findUpSync } from 'find-up';
import createTool from "./createTool";

const IGNORE_PATTERNS = [
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

const FileItem = z.object({
  name: z.string(),
  path: z.string(),
  type: z.enum(["file", "directory"]),
  size: z.number().optional(),
});

const DirectoryItem = FileItem.extend({
  children: z.lazy(() => z.array(FileItem.or(DirectoryItem))).optional(),
});

export const getProjectRoot = () => {
  const packageJsonPath = findUpSync('package.json');
  if (!packageJsonPath) throw new Error('Unable to find project root');
  return path.dirname(packageJsonPath);
};

export const resolveProjectPath = (...segments: string[]) => path.join(getProjectRoot(), ...segments);

const createIgnore = async (dir: string) => {
  const gitignorePath = path.join(dir, '.gitignore');
  const gitignorePatterns = await fs.readFile(gitignorePath, 'utf-8')
    .then(content => content.split('\n').filter(line => line.trim() && !line.startsWith('#')))
    .catch(() => []);
  return ignore().add([...IGNORE_PATTERNS, ...gitignorePatterns]);
};

const walkDir = async (baseDir: string, currentDir: string, ig: ReturnType<typeof ignore>, depth: number): Promise<string[]> => {
  const list = await fs.readdir(currentDir);
  const results = await Promise.all(list.map(async file => {
    const filePath = path.join(currentDir, file);
    const relativePath = path.relative(baseDir, filePath);
    if (ig.ignores(relativePath)) return [];
    const stat = await fs.stat(filePath);
    return stat.isDirectory() && depth !== 0
      ? walkDir(baseDir, filePath, ig, depth > 0 ? depth - 1 : -1)
      : [filePath];
  }));
  return results.flat();
};

const listDir = async (dirPath: string, currentPath: string, ig: ReturnType<typeof ignore>, recursive: boolean, depth: number, currentDepth: number): Promise<Array<z.infer<typeof FileItem> | z.infer<typeof DirectoryItem>>> => {
  const entries = await fs.readdir(currentPath, { withFileTypes: true });
  const items = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(dirPath, fullPath);
      if (ig.ignores(relativePath)) return null;
      const stats = await fs.stat(fullPath);
      const item: z.infer<typeof FileItem> | z.infer<typeof DirectoryItem> = {
        name: entry.name,
        path: relativePath,
        type: entry.isDirectory() ? "directory" : "file",
        size: entry.isFile() ? stats.size : undefined,
      };
      if (entry.isDirectory() && recursive && (depth === -1 || currentDepth < depth)) {
        (item as z.infer<typeof DirectoryItem>).children = await listDir(dirPath, fullPath, ig, recursive, depth, currentDepth + 1);
      }
      return item;
    })
  );
  return items.filter(Boolean);
};

const readProjectTree = createTool({
  name: "readProjectTree",
  description: "Generates a simple string tree representation of the entire project structure",
  schema: z.object({ tree: z.string() }),
  params: z.object({}),
  execute: async () => {
    const root = getProjectRoot();
    const ig = ignore().add(["**/node_modules", "**/.git", "**/.svelte-kit", "**/build", "**/dist", "**/*.lock", "**/.DS_Store"]);
    const generateTree = async (dir: string, prefix = ''): Promise<string> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      return (await Promise.all(entries.map(async entry => {
        const relativePath = path.relative(root, path.join(dir, entry.name));
        if (ig.ignores(relativePath)) return '';
        const icon = entry.isDirectory() ? '📁' : '📄';
        const subTree = entry.isDirectory() ? await generateTree(path.join(dir, entry.name), `${prefix}  `) : '';
        return `${prefix}${icon} ${entry.name}\n${subTree}`;
      }))).join('');
    };
    return { tree: await generateTree(root) };
  }
});

const readFile = createTool({
  name: "readFile",
  description: "Reads the content of a specified file",
  schema: z.object({ content: z.string(), path: z.string() }),
  params: z.object({ filePath: z.string().describe("The path to the file to be read") }),
  execute: async ({ filePath }) => ({ content: await fs.readFile(filePath, 'utf-8'), path: filePath })
});

const writeFile = createTool({
  name: "writeFile",
  description: "Writes content to a specified file, creating it if it doesn't exist",
  schema: z.object({ path: z.string() }),
  params: z.object({
    filePath: z.string().describe("The path to the file to be written"),
    content: z.string().describe("The content to write to the file"),
  }),
  execute: async ({ filePath, content }) => {
    await fs.writeFile(filePath, content, 'utf-8');
    return { path: filePath };
  }
});

const listDirectory = createTool({
  name: "listDirectory",
  description: "Lists files and directories in a specified path, with optional recursive listing",
  schema: z.object({ items: z.array(FileItem.or(DirectoryItem)) }),
  params: z.object({
    dirPath: z.string().describe("The path to the directory to list"),
    recursive: z.boolean().default(false).describe("Whether to list subdirectories recursively"),
    depth: z.number().int().min(-1).default(-1).describe("The depth of recursion. 0 means just the top level, -1 means unlimited"),
  }),
  execute: async ({ dirPath, recursive, depth }) => {
    const ig = await createIgnore(dirPath);
    const items = await listDir(dirPath, dirPath, ig, recursive, depth, 0);
    return { items };
  }
});

const readFolder = createTool({
  name: "readFolder",
  description: "Reads project files and folders from a specified directory with a specified depth of recursion. Respects .gitignore patterns and additional project-specific ignore patterns.",
  schema: z.object({ content: z.string().describe("The content of the folder") }),
  params: z.object({
    target: z.string().default('.').describe("The target directory to read files from"),
    depth: z.number().int().min(-1).default(-1).describe("The depth of recursion. 0 means just the folder contents, -1 means until the end"),
  }),
  execute: async ({ target, depth }) => {
    const absoluteTarget = path.resolve(target);
    const ig = await createIgnore(absoluteTarget);
    const files = await walkDir(absoluteTarget, absoluteTarget, ig, depth);

    const content = await Promise.all(files.map(async file => {
      const stat = await fs.stat(file);
      const relativePath = path.relative(absoluteTarget, file);
      const lastModified = stat.mtime.toISOString();
      const header = `\n/* File: ${relativePath}\n   Absolute path: ${file}\n   Last modified: ${lastModified} */\n\n`;
      return header + (stat.isDirectory() ? `// Directory: ${relativePath}\n` : await fs.readFile(file, 'utf-8'));
    }));

    return { content: content.join('\n') };
  }
});

export {
  readFile,
  writeFile,
  listDirectory,
  readFolder,
  readProjectTree
};