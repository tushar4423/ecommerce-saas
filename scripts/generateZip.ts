import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

async function zipDirectory(dirPath: string, zip: JSZip, rootDir: string) {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    if (
      item === 'node_modules' ||
      item === '.git' ||
      item === 'dist' ||
      item === '.aistudio' ||
      item.endsWith('.zip') ||
      item.endsWith('.tar.gz')
    ) {
      continue;
    }

    const fullPath = path.join(dirPath, item);
    const relPath = path.relative(rootDir, fullPath);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      await zipDirectory(fullPath, zip, rootDir);
    } else {
      const content = fs.readFileSync(fullPath);
      zip.file(relPath, content);
    }
  }
}

async function main() {
  console.log('Generating complete Vedaaya source code ZIP archive...');
  const zip = new JSZip();
  const rootDir = process.cwd();

  await zipDirectory(rootDir, zip, rootDir);

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const publicOut = path.join(rootDir, 'public', 'vedaaya_source_code.zip');
  fs.writeFileSync(publicOut, buffer);
  console.log(`Saved ZIP to ${publicOut} (${(buffer.length / 1024).toFixed(1)} KB)`);

  const rootOut = path.join(rootDir, 'vedaaya_source_code.zip');
  fs.writeFileSync(rootOut, buffer);
  console.log(`Saved ZIP to ${rootOut}`);

  const publicTar = path.join(rootDir, 'public', 'vedaaya_source_code.tar.gz');
  const rootTar = path.join(rootDir, 'vedaaya_source_code.tar.gz');
  if (fs.existsSync(publicTar)) {
    fs.copyFileSync(publicTar, rootTar);
  }

  console.log('Source code archive packaging completed successfully.');
}

main().catch(err => {
  console.error('Failed to create ZIP:', err);
  process.exit(1);
});
