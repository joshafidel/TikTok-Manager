const fs = require("fs");

const S = 1000; // master size

/* ---------- 1. AI, with receipts ----------------------------------------
   The channel's promise is proof, not hype — so the mark is a literal
   receipt: a paper slip with a torn edge, ending in a check. Nothing else
   on TikTok has a receipt silhouette. */
function receipts() {
  const L = 348, R = 652, TOP = 236;
  const base = 664, tooth = 38, depth = 40;

  let zig = "";
  let x = R, down = true;
  while (x > L) {
    const nx = Math.max(L, x - tooth);
    zig += ` L${nx},${down ? base + depth : base}`;
    x = nx;
    down = !down;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <rect width="${S}" height="${S}" fill="#12365C"/>
  <circle cx="500" cy="470" r="330" fill="#0D2A48" opacity=".55"/>
  <g transform="rotate(-6 500 500)">
    <path d="M${L},${TOP} L${R},${TOP} L${R},${base}${zig} Z"
          fill="#F7F4ED"/>
    <g fill="#163A5E">
      <rect x="396" y="316" width="208" height="30" rx="15"/>
      <rect x="396" y="382" width="150" height="30" rx="15"/>
      <rect x="396" y="448" width="184" height="30" rx="15"/>
    </g>
    <path d="M400,556 L455,611 L604,462" fill="none" stroke="#E9A33C"
          stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`.trim();
}

/* ---------- 2. Reactions -------------------------------------------------
   The product is the recoil, not the clip. Two wide eyes with shrunken
   pupils plus radiating shock lines — legible as pure silhouette. */
function reactions() {
  // Round eyes ringed by rays read as a friendly bug, which is the wrong
  // tone entirely. Pupils cut hard to one side plus a wavy grimace read as
  // recoil — the actual product of this channel.
  const mouth =
    "M330,676 q46,-58 92,0 t92,0 t92,0 t92,0";

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <rect width="${S}" height="${S}" fill="#5B2D91"/>
  <circle cx="500" cy="500" r="352" fill="#48216F" opacity=".55"/>
  <g>
    <ellipse cx="366" cy="416" rx="126" ry="156" fill="#FBF8FF"/>
    <ellipse cx="648" cy="440" rx="142" ry="176" fill="#FBF8FF"/>
    <circle cx="408" cy="370" r="47" fill="#231039"/>
    <circle cx="692" cy="394" r="53" fill="#231039"/>
  </g>
  <path d="${mouth}" fill="none" stroke="#FBF8FF" stroke-width="46"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`.trim();
}

/* ---------- 3. Tally -----------------------------------------------------
   The name is the mark. Four strokes and a cross — counting, votes, and
   the most recognisable shape in the set. */
function tally() {
  const xs = [356, 452, 548, 644];
  const bars = xs
    .map((x) => `<line x1="${x}" y1="316" x2="${x}" y2="684"/>`)
    .join("\n    ");

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <rect width="${S}" height="${S}" fill="#0F5540"/>
  <circle cx="500" cy="500" r="340" fill="#0A4433" opacity=".6"/>
  <g stroke="#F4F8F5" stroke-width="44" stroke-linecap="round">
    ${bars}
  </g>
  <line x1="318" y1="700" x2="682" y2="300" stroke="#F5C542"
        stroke-width="44" stroke-linecap="round"/>
</svg>`.trim();
}

const set = [
  ["ai-with-receipts", receipts()],
  ["reactions", reactions()],
  ["tally", tally()],
];

fs.mkdirSync("out", { recursive: true });
for (const [name, svg] of set) fs.writeFileSync(`out/${name}.svg`, svg);
console.log("wrote " + set.map(([n]) => n + ".svg").join(", "));
