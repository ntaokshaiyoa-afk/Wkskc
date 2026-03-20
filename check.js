import { chromium } from 'playwright';
import fs from 'fs';

const URL = 'https://example.com';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(URL, { waitUntil: 'networkidle' });

  // ⭐ 必要な部分だけ取得（重要：差分が安定する）
  const content = await page.locator('body').innerText();

  const prevFile = 'prev.txt';
  let prev = '';

  if (fs.existsSync(prevFile)) {
    prev = fs.readFileSync(prevFile, 'utf-8');
  }

  if (prev !== content) {
    console.log('CHANGED');
    fs.writeFileSync(prevFile, content);
    process.exit(1); // ← 差分ありで失敗扱いにする（後続処理に使える）
  } else {
    console.log('NO CHANGE');
  }

  await browser.close();
})();
