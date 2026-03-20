import { chromium } from 'playwright';
import fs from 'fs';

const sites = JSON.parse(fs.readFileSync('sites.json'));

const browser = await chromium.launch();
const page = await browser.newPage();

let changed = false;

for (const site of sites) {
  console.log(`Checking: ${site.name}`);

  // 🔐 ログイン処理
  if (site.login) {
    const user = process.env[`LOGIN_${site.name}_USER`];
    const pass = process.env[`LOGIN_${site.name}_PASS`];

    if (!user || !pass) {
      console.log(`Skip login: ${site.name} (no credentials)`);
      continue;
    }

    await page.goto(site.loginUrl);
    await page.fill(site.usernameSelector, user);
    await page.fill(site.passwordSelector, pass);
    await page.click(site.submitSelector);
    await page.waitForLoadState('networkidle');
  }

  // 🌐 本ページ取得
  await page.goto(site.url, { waitUntil: 'networkidle' });

  const content = await page.locator(site.selector).innerText();

  const file = `prev_${site.name}.txt`;
  let prev = '';

  if (fs.existsSync(file)) {
    prev = fs.readFileSync(file, 'utf-8');
  }

  if (prev !== content) {
    console.log(`CHANGED: ${site.name}`);
    fs.writeFileSync(file, content);
    changed = true;
  } else {
    console.log(`NO CHANGE: ${site.name}`);
  }
}

await browser.close();

if (changed) process.exit(1);
