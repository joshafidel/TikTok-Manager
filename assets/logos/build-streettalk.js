const { chromium } = require("playwright");
const fs = require("fs");

// A handheld interview mic: nothing else in the set has that silhouette, and it
// survives being 40px in a feed.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  <rect width="1000" height="1000" fill="#8A3A11"/>
  <circle cx="500" cy="500" r="344" fill="#72300D" opacity=".6"/>
  <g transform="rotate(-14 500 500)">
    <rect x="404" y="212" width="192" height="330" rx="96" fill="#F8F3EE"/>
    <rect x="404" y="330" width="192" height="26" fill="#8A3A11" opacity=".35"/>
    <rect x="404" y="404" width="192" height="26" fill="#8A3A11" opacity=".35"/>
    <path d="M338,486 a162,162 0 0 0 324,0" fill="none" stroke="#F8F3EE"
          stroke-width="44" stroke-linecap="round"/>
    <rect x="470" y="628" width="60" height="150" rx="30" fill="#F8F3EE"/>
    <rect x="426" y="762" width="148" height="52" rx="26" fill="#F2A65A"/>
  </g>
</svg>`.trim();

fs.mkdirSync("out", { recursive: true });
fs.writeFileSync("out/streettalk.svg", svg);

(async () => {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 } });
  await page.setContent(`<body style="margin:0"><div id="a" style="width:1000px;height:1000px">${svg}</div></body>`);
  await page.locator("#a").screenshot({ path: "out/streettalk.png" });

  const at = (px) => `<div style="width:${px}px;height:${px}px;border-radius:50%;overflow:hidden;flex:none">
      <div style="width:${px}px;height:${px}px">${svg.replace('width="1000" height="1000"', `width="${px}" height="${px}"`)}</div></div>`;
  await page.setContent(`<body style="margin:0;padding:30px;background:#fff;display:flex;align-items:center;gap:24px;width:560px">
      ${at(180)}${at(110)}${at(64)}${at(40)}
      <div style="font:600 14px system-ui;color:#333">Street Talk</div></body>`);
  await page.locator("body").screenshot({ path: "out/proof.png" });
  await browser.close();
  console.log("done");
})();
