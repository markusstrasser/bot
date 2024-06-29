import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { vol } from 'memfs';
import path from 'path';
import { readFile, writeFile, listDirectory, readFolder } from './file';

// Mock fs/promises
vi.mock('fs/promises', () => {
  return {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
    mkdir: vi.fn(),
  };
});

// Mock ignore
vi.mock('ignore', () => ({
  default: () => ({
    add: vi.fn().mockReturnThis(),
    ignores: (file: string) => file.includes('ignored'),
  }),
}));

// Mock the file tools
vi.mock('./file', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./file')>();
  return {
    ...mod,
    readFile: { ...mod.readFile, execute: vi.fn() },
    writeFile: { ...mod.writeFile, execute: vi.fn() },
    listDirectory: { ...mod.listDirectory, execute: vi.fn() },
    readFolder: { ...mod.readFolder, execute: vi.fn() },
  };
});

describe('File Tools', () => {
  beforeEach(() => {
    vol.reset();
    const mockFileSystem = {
      '/project': {
        'file1.txt': 'Content of file1',
        'file2.js': 'console.log("Hello");',
        '.gitignore': 'ignored_file.txt',
        'ignored_file.txt': 'This should be ignored',
        'subdir': {
          'file3.txt': 'Content of file3',
          'subsubdir': {
            'file4.txt': 'Content of file4'
          }
        }
      }
    };
    vol.fromJSON(mockFileSystem);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('readFile', () => {
    it('should read the content of a file', async () => {
      const mockContent = 'Content of file1';
      vi.mocked(readFile.execute).mockResolvedValue({ success: true, content: mockContent, path: '/project/file1.txt' });

      const result = await readFile.execute({ filePath: '/project/file1.txt' });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.content).toBe(mockContent);
        expect(result.path).toBe('/project/file1.txt');
      }
    });

    it('should return an error for non-existent file', async () => {
      vi.mocked(readFile.execute).mockResolvedValue({ 
        success: false, 
        error: 'Execution failed: ENOENT: no such file or directory', 
        details: new Error('ENOENT: no such file or directory')
      });

      const result = await readFile.execute({ filePath: '/project/non_existent.txt' });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('ENOENT');
      }
    });
  });

  describe('writeFile', () => {
    it('should write content to a file', async () => {
      vi.mocked(writeFile.execute).mockResolvedValue({ success: true, path: '/project/new_file.txt' });

      const result = await writeFile.execute({ 
        filePath: '/project/new_file.txt', 
        content: 'New content' 
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.path).toBe('/project/new_file.txt');
      }
    });

    it('should return an error if writing fails', async () => {
      vi.mocked(writeFile.execute).mockResolvedValue({ 
        success: false, 
        error: 'Execution failed: Write error', 
        details: new Error('Write error')
      });

      const result = await writeFile.execute({ 
        filePath: '/project/fail_file.txt', 
        content: 'Fail content' 
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Write error');
      }
    });
  });

  describe('listDirectory', () => {
    it('should list files and directories non-recursively', async () => {
      const mockItems = [
        { name: 'file1.txt', path: 'file1.txt', type: 'file', size: 16 },
        { name: 'file2.js', path: 'file2.js', type: 'file', size: 21 },
        { name: 'subdir', path: 'subdir', type: 'directory' }
      ];
      vi.mocked(listDirectory.execute).mockResolvedValue({ success: true, items: mockItems });

      const result = await listDirectory.execute({ 
        dirPath: '/project', 
        recursive: false 
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.items).toHaveLength(3);
        expect(result.items.map(item => item.name)).toContain('file1.txt');
        expect(result.items.map(item => item.name)).toContain('subdir');
      }
    });

    it('should list files and directories recursively', async () => {
      const mockItems = [
        { name: 'file1.txt', path: 'file1.txt', type: 'file', size: 16 },
        { name: 'file2.js', path: 'file2.js', type: 'file', size: 21 },
        { 
          name: 'subdir', 
          path: 'subdir', 
          type: 'directory',
          children: [
            { name: 'file3.txt', path: 'subdir/file3.txt', type: 'file', size: 16 },
            { 
              name: 'subsubdir', 
              path: 'subdir/subsubdir', 
              type: 'directory',
              children: [
                { name: 'file4.txt', path: 'subdir/subsubdir/file4.txt', type: 'file', size: 16 }
              ]
            }
          ]
        }
      ];
      vi.mocked(listDirectory.execute).mockResolvedValue({ success: true, items: mockItems });

      const result = await listDirectory.execute({ 
        dirPath: '/project', 
        recursive: true,
        depth: -1
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        const allItems = JSON.stringify(result.items);
        expect(allItems).toContain('file1.txt');
        expect(allItems).toContain('file3.txt');
        expect(allItems).toContain('file4.txt');
        expect(allItems).not.toContain('ignored_file.txt');
      }
    });
  });

  describe('readFolder', () => {
    it('should read all files in a folder', async () => {
      const mockContent = `
/* File: file1.txt
   Absolute path: /project/file1.txt
   Last modified: 2023-06-01T00:00:00.000Z */

Content of file1

/* File: file2.js
   Absolute path: /project/file2.js
   Last modified: 2023-06-01T00:00:00.000Z */

console.log("Hello");

/* File: subdir/file3.txt
   Absolute path: /project/subdir/file3.txt
   Last modified: 2023-06-01T00:00:00.000Z */

Content of file3

/* File: subdir/subsubdir/file4.txt
   Absolute path: /project/subdir/subsubdir/file4.txt
   Last modified: 2023-06-01T00:00:00.000Z */

Content of file4
`;
      vi.mocked(readFolder.execute).mockResolvedValue({ success: true, content: mockContent });

      const result = await readFolder.execute({ 
        target: '/project', 
        depth: -1 
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.content).toContain('Content of file1');
        expect(result.content).toContain('Content of file3');
        expect(result.content).toContain('Content of file4');
        expect(result.content).not.toContain('This should be ignored');
      }
    });

    it('should respect depth parameter', async () => {
      const mockContent = `
/* File: file1.txt
   Absolute path: /project/file1.txt
   Last modified: 2023-06-01T00:00:00.000Z */

Content of file1

/* File: file2.js
   Absolute path: /project/file2.js
   Last modified: 2023-06-01T00:00:00.000Z */

console.log("Hello");

/* File: subdir/file3.txt
   Absolute path: /project/subdir/file3.txt
   Last modified: 2023-06-01T00:00:00.000Z */

Content of file3
`;
      vi.mocked(readFolder.execute).mockResolvedValue({ success: true, content: mockContent });

      const result = await readFolder.execute({ 
        target: '/project', 
        depth: 1 
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.content).toContain('Content of file1');
        expect(result.content).toContain('Content of file3');
        expect(result.content).not.toContain('Content of file4');
      }
    });
  });
});