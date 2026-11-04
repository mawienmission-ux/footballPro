import { promises as fs } from 'node:fs';
import path from 'node:path';

const resourcesDir = path.resolve('resources');
await fs.mkdir(resourcesDir, { recursive: true });

const svgFiles = [
  { input: 'icon.svg', output: 'icon.png', width: 1024, height: 1024 },
  { input: 'splash.svg', output: 'splash.png', width: 2732, height: 2732 },
];

for (const file of svgFiles) {
  const inputPath = path.join(resourcesDir, file.input);
  const outputPath = path.join(resourcesDir, file.output);
  const sharp = (await import('sharp')).default;
  await sharp(inputPath)
    .resize(file.width, file.height, { fit: 'contain' })
    .png()
    .toFile(outputPath);
  console.log(`Generated ${outputPath}`);
}
