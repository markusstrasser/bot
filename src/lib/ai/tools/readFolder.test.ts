import assert from 'assert';
import path from 'path';
import fs from 'fs/promises';
import readFolderTool from './readFolder';

// Helper function to create a temporary directory structure for testing
async function createTempDirectory() {
  const tempDir = path.join(__dirname, 'temp_test_dir');
  await fs.mkdir(tempDir, { recursive: true });
  
  // Create some test files and directories
  await fs.writeFile(path.join(tempDir, 'file1.txt'), 'Content of file1');
  await fs.writeFile(path.join(tempDir, 'file2.js'), 'console.log("Hello");');
  await fs.mkdir(path.join(tempDir, 'subdir'));
  await fs.writeFile(path.join(tempDir, 'subdir', 'file3.txt'), 'Subdir file');
  await fs.writeFile(path.join(tempDir, '.gitignore'), 'ignored_file.txt\n*.log');
  await fs.writeFile(path.join(tempDir, 'ignored_file.txt'), 'This should be ignored');
  await fs.writeFile(path.join(tempDir, 'test.log'), 'This should also be ignored');
  await fs.mkdir(path.join(tempDir, 'node_modules'));
  await fs.writeFile(path.join(tempDir, 'node_modules', 'module.js'), 'This should be ignored');
  await fs.writeFile(path.join(tempDir, 'package-lock.json'), '{"name": "test"}');

  return tempDir;
}

// Helper function to clean up the temporary directory
async function cleanupTempDirectory(tempDir) {
  await fs.rm(tempDir, { recursive: true, force: true });
}

async function runTests() {
  const tempDir = await createTempDirectory();

  try {
    // Test 1: Basic functionality and depth
    const result1 = await readFolderTool.execute({ target: tempDir, depth: 0 });
    assert(result1.data.content.includes('file1.txt'), 'Should include file1.txt');
    assert(result1.data.content.includes('file2.js'), 'Should include file2.js');
    assert(!result1.data.content.includes('file3.txt'), 'Should not include file3.txt due to depth');

    // Test 2: Recursive functionality
    const result2 = await readFolderTool.execute({ target: tempDir, depth: -1 });
    assert(result2.data.content.includes('file3.txt'), 'Should include file3.txt when recursive');

    // Test 3: Gitignore respecting
    // assert(!result2.data.content.includes('ignored_file.txt'), 'Should not include ignored_file.txt');
    assert(!result2.data.content.includes('test.log'), 'Should not include test.log');

    // Test 4: Always ignore patterns
    assert(!result2.data.content.includes('node_modules'), 'Should not include node_modules directory');
    assert(!result2.data.content.includes('package-lock.json'), 'Should not include package-lock.json');

    console.log('All tests passed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await cleanupTempDirectory(tempDir);
  }
}

runTests();