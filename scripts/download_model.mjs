import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/models/coco-ssd');
fs.mkdirSync(outDir, { recursive: true });

const BASE = 'https://storage.googleapis.com/tfjs-models/savedmodel/ssdlite_mobilenet_v2/';
const files = [
  'model.json',
  'group1-shard1of5',
  'group1-shard2of5',
  'group1-shard3of5',
  'group1-shard4of5',
  'group1-shard5of5'
];

async function download() {
  for (const f of files) {
    const dest = path.join(outDir, f);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`Already exists: ${f} (${(fs.statSync(dest).size / 1024 / 1024).toFixed(2)} MB)`);
      continue;
    }
    console.log(`Downloading ${f}...`);
    const res = await fetch(BASE + f);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${f}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log(`Saved ${f} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
  }
  console.log('ALL COCO-SSD MODEL FILES READY LOCALLY!');
}

download().catch(err => {
  console.error('Download failed:', err);
  process.exit(1);
});
