const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateIcon(svgPath, outputPath, size) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Render at 4x size for better quality, then downscale
  const renderSize = size * 4;
  await page.setViewport({ width: renderSize, height: renderSize });

  const svgContent = fs.readFileSync(svgPath, 'utf8');
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; background: white; }
        svg { width: ${renderSize}px; height: ${renderSize}px; display: block; }
      </style>
    </head>
    <body>${svgContent}</body>
    </html>
  `;

  await page.setContent(html);
  const screenshot = await page.screenshot({ omitBackground: true });
  await browser.close();

  // Use ImageMagick to downscale for smooth anti-aliasing
  const { exec } = require('child_process');
  const tempPath = outputPath.replace('.png', '-temp.png');
  fs.writeFileSync(tempPath, screenshot);

  await new Promise((resolve, reject) => {
    exec(`magick ${tempPath} -resize ${size}x${size} ${outputPath}`, (error) => {
      fs.unlinkSync(tempPath);
      if (error) reject(error);
      else resolve();
    });
  });

  console.log(`Generated ${outputPath}`);
}

async function main() {
  const svgPath = path.join(__dirname, 'src/icons/icon.svg');
  const svg16Path = path.join(__dirname, 'src/icons/icon16.svg');
  const iconsDir = path.join(__dirname, 'src/icons');

  // Use simpler icon16.svg for 16px version
  await generateIcon(svg16Path, path.join(iconsDir, 'icon16.png'), 16);
  await generateIcon(svgPath, path.join(iconsDir, 'icon48.png'), 48);
  await generateIcon(svgPath, path.join(iconsDir, 'icon128.png'), 128);

  console.log('All icons generated successfully!');
}

main().catch(console.error);
