import fs from 'fs/promises';
import {createIgnore, getProjectRoot, walkDir} from "./utils"
import { execSync } from 'child_process';
import { dirname } from 'path';
import path from 'path';

export function readProjectTree(): string {
  const root = getProjectRoot();
  return execSync(`tree -L 3 -I 'node_modules|.git|.svelte-kit|build|dist' ${root}`, { encoding: 'utf-8' });
}
export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}
export const makeDirectory = (path: string) => fs.mkdir(path, { recursive: true });
export const remove = async (path: string): Promise<void> => {
  await fs.rm(path, { recursive: true, force: true });
};
export async function writeFile(filePath: string, content: string): Promise<void> {
  await makeDirectory(dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function readFolderContents(target: string, depth: number): Promise<string> {
    const absoluteTarget = path.resolve(target);
    const ig = await createIgnore(absoluteTarget);
    const files = await walkDir(absoluteTarget, absoluteTarget, ig, depth);

    const content = await Promise.all(files.map(async file => {
      const stat = await fs.stat(file);
      const relativePath = path.relative(absoluteTarget, file);
      const lastModified = stat.mtime.toISOString();
      const header = `\n/* File: ${relativePath}\n   Absolute path: ${file}\n   Last modified: ${lastModified} */\n\n`;
    return header + (stat.isDirectory() ? `// Directory: ${relativePath}\n` : await fs.readFile(file, 'utf-8'));
  }))
  return content.join('\n');
}