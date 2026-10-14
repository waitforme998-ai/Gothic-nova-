const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const fontPath = path.resolve('assets/fonts/Antonio-Bold.woff2').replace(/\\/g, '/');

// 1. Create HTML for 1200x630 OpenGraph Banner
const ogHtmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: 'Antonio';
    src: url('file:///${fontPath}') format('woff2');
    font-weight: 700;
    font-style: normal;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px;
    height: 630px;
    background-color: #000000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'Antonio', sans-serif;
    color: #ffffff;
    overflow: hidden;
    position: relative;
  }
  .border-box {
    position: absolute;
    top: 36px;
    bottom: 36px;
    left: 48px;
    right: 48px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    pointer-events: none;
  }
  .corner {
    position: absolute;
    width: 14px;
    height: 14px;
    border-color: #ffffff;
    border-style: solid;
  }
  .c-tl { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
  .c-tr { top: -1px; right: -1px; border-width: 2px 2px 0 0; }
  .c-bl { bottom: -1px; left: -1px; border-width: 0 0 2px 2px; }
  .c-br { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

  .brand-title {
    font-size: 118px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #ffffff;
    line-height: 1;
    text-align: center;
    text-shadow: 0 0 40px rgba(255, 255, 255, 0.25);
  }
  .tagline {
    margin-top: 24px;
    font-size: 20px;
    letter-spacing: 0.45em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.75);
    font-family: 'Inter', sans-serif;
    font-weight: 500;
  }
</style>
</head>
<body>
  <div class="border-box">
    <div class="corner c-tl"></div>
    <div class="corner c-tr"></div>
    <div class="corner c-bl"></div>
    <div class="corner c-br"></div>
  </div>
  <div class="brand-title">GOTHIC NOVA</div>
  <div class="tagline">CYBER-GOTH &amp; ALTERNATIVE JEWELRY</div>
</body>
</html>`;

// 2. Create HTML for 512x512 Favicon / App Icon (Stacked GOTHIC NOVA for bold square legibility)
const faviconHtmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: 'Antonio';
    src: url('file:///${fontPath}') format('woff2');
    font-weight: 700;
    font-style: normal;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 512px;
    height: 512px;
    background-color: #000000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'Antonio', sans-serif;
    color: #ffffff;
    overflow: hidden;
  }
  .brand-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    line-height: 0.92;
    text-align: center;
  }
  .word-gothic {
    font-size: 114px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #ffffff;
    text-transform: uppercase;
  }
  .word-nova {
    font-size: 126px;
    font-weight: 700;
    letter-spacing: 0.16em;
    color: #ffffff;
    text-transform: uppercase;
    margin-top: 10px;
  }
</style>
</head>
<body>
  <div class="brand-wrap">
    <div class="word-gothic">GOTHIC</div>
    <div class="word-nova">NOVA</div>
  </div>
</body>
</html>`;

const tempOgHtml = path.resolve('temp_og.html');
const tempFaviconHtml = path.resolve('temp_favicon.html');

fs.writeFileSync(tempOgHtml, ogHtmlContent);
fs.writeFileSync(tempFaviconHtml, faviconHtmlContent);

const ogPngPath = path.resolve('assets/gothic_nova_brand_og.png');
const faviconPngPath = path.resolve('assets/gothic_nova_favicon.png');

console.log('Rendering 1200x630 OG banner via Edge...');
execSync(`"${edgePath}" --headless --disable-gpu --screenshot="${ogPngPath}" --window-size=1200,630 "file:///${tempOgHtml.replace(/\\/g, '/')}"`);

console.log('Rendering 512x512 Favicon via Edge...');
execSync(`"${edgePath}" --headless --disable-gpu --screenshot="${faviconPngPath}" --window-size=512,512 "file:///${tempFaviconHtml.replace(/\\/g, '/')}"`);

fs.unlinkSync(tempOgHtml);
fs.unlinkSync(tempFaviconHtml);

// 3. Create SVG Favicon as well
const svgFaviconContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" fill="#000000"/>
  <style>
    @font-face {
      font-family: 'Antonio';
      src: url('fonts/Antonio-Bold.woff2') format('woff2');
      font-weight: 700;
    }
    .text-gothic {
      font-family: 'Antonio', 'Arial Black', sans-serif;
      font-size: 110px;
      font-weight: 700;
      fill: #ffffff;
      letter-spacing: 6px;
      text-anchor: middle;
    }
    .text-nova {
      font-family: 'Antonio', 'Arial Black', sans-serif;
      font-size: 122px;
      font-weight: 700;
      fill: #ffffff;
      letter-spacing: 14px;
      text-anchor: middle;
    }
  </style>
  <text x="256" y="235" class="text-gothic">GOTHIC</text>
  <text x="260" y="345" class="text-nova">NOVA</text>
</svg>`;

fs.writeFileSync(path.resolve('assets/favicon.svg'), svgFaviconContent);
console.log('Created assets/favicon.svg');
console.log('All brand assets successfully generated!');
