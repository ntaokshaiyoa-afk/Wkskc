import { chromium } from 'playwright';
import fs from 'fs';

const sites = JSON.parse(fs.readFileSync('sites.json'));

let changed = false;

for (const site of sites) {
  console.log(`Checking: ${site.name}`);

  let context;

  // 🔐 Basic認証対応
  if (site.basicAuth) {
    context = await chromium.launch().then(browser =>
      browser.newContext({
        httpCredentials: {
          username: process.env[`LOGIN_${site.name}_USER`],
          password: process.env[`LOGIN_${site.name}_PASS`]
        }
      })
    );
  } else {
    const browser = await chromium.launch();
    context = await browser.newContext();
  }

  const page = await context.newPage();

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

  await context.close();
}

if (changed) process.exit(1);
