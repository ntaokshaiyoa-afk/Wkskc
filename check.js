import { chromium } from 'playwright';
import fs from 'fs';
import crypto from 'crypto';

const sites = JSON.parse(fs.readFileSync('sites.json'));

const browser = await chromium.launch();

let changed = false;

for (const site of sites) {
  console.log(`Checking: ${site.name}`);

  const context = await browser.newContext(
    site.basicAuth
      ? {
          httpCredentials: {
            username: process.env[`LOGIN_${site.name}_USER`],
            password: process.env[`LOGIN_${site.name}_PASS`]
          }
        }
      : {}
  );

  const page = await context.newPage();

  await page.goto(site.url, { waitUntil: 'networkidle' });

  let content = await page.locator(site.selector).innerText();

  // 🔧 ノイズ除去（重要）
  content = content
    .replace(/\s+/g, ' ')   // 空白統一
    .replace(/\d{4}\/\d{2}\/\d{2}/g, '') // 日付削除（必要に応じて）
    .trim();

  // 🔐 ハッシュ化
  const hash = crypto.createHash('sha256').update(content).digest('hex');

  const file = `prev_${site.name}.hash`;
  let prev = '';

  if (fs.existsSync(file)) {
    prev = fs.readFileSync(file, 'utf-8');
  }

  if (prev !== hash) {
    console.log(`CHANGED: ${site.name}`);
    fs.writeFileSync(file, hash);
    changed = true;
  } else {
    console.log(`NO CHANGE: ${site.name}`);
  }

  await context.close();
}

await browser.close();

if (changed) process.exit(1);
