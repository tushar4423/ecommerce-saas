import fs from 'fs';
import path from 'path';
import { buildVedaayaFeaturesPdf } from '../src/utils/generatePdfDocument';

async function main() {
  console.log('Generating Vedaaya Ethnic & Kurti Studio Features PDF Specification...');

  const doc = buildVedaayaFeaturesPdf();
  const pdfArrayBuffer = doc.output('arraybuffer');
  const buffer = Buffer.from(pdfArrayBuffer);

  // Ensure directories exist
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const distDir = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const publicOutPath = path.join(publicDir, 'vedaaya_features_specification.pdf');
  fs.writeFileSync(publicOutPath, buffer);
  console.log(`Saved PDF to: ${publicOutPath} (${(buffer.length / 1024).toFixed(1)} KB)`);

  const distOutPath = path.join(distDir, 'vedaaya_features_specification.pdf');
  fs.writeFileSync(distOutPath, buffer);
  console.log(`Saved PDF to: ${distOutPath}`);

  console.log('PDF generation complete!');
}

main().catch(err => {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
});
