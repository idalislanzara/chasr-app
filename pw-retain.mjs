import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';

const B = 'https://chasr-app-1.onrender.com';
const EMAIL = `retain-${Date.now()}@chasr.local`;
const PASS = 'Test1234!';
writeFileSync('/tmp/retain-email.txt', EMAIL);

// 1) Register via API (real server)
const reg = await fetch(B + '/api/auth/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASS }),
}).then(r => r.json());
const token = reg.token;
console.log('registered:', !!token, EMAIL);

// 2) Put ONLY the cookie into a fresh browser context (no localStorage)
const ctx = await (await chromium.launch()).newContext({ viewport: { width: 390, height: 844 } });
await ctx.addCookies([{
  name: 'chasr_token', value: token,
  domain: 'chasr-app-1.onrender.com', path: '/', httpOnly: true, sameSite: 'Lax', secure: true,
}]);
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto(B + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
const ageGate = await page.evaluate(() => document.body.innerText.includes('Age Verification Required'));
const loggedIn = await page.evaluate(() => document.body.innerText.includes('Nearby') || document.body.innerText.includes('Right Now'));
console.log('reopen with cookie only: ageGate=' + ageGate, 'loggedIn=' + loggedIn, 'url=' + page.url());
await page.screenshot({ path: '/tmp/pw-retain.png' });

// 3) DELETE account via API
const del = await fetch(B + '/api/auth/me', { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
console.log('cleanup delete:', del.status, '| page errors:', errs.length ? errs.join(' | ') : '(none)');
await ctx.close();
