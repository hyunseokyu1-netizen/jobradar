const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth');

chromium.use(stealth());

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://au.indeed.com/jobs?q=react+native&l=Sydney%2C+NSW&fromage=7', {
    waitUntil: 'domcontentloaded', timeout: 30000
  });
  await page.waitForTimeout(3000);

  const title = await page.title();
  console.log('Page title:', title);

  const jobs = await page.evaluate(() => {
    const cards = document.querySelectorAll('div.job_seen_beacon');
    return Array.from(cards).slice(0, 3).map(card => {
      const titleEl = card.querySelector('h2.jobTitle a span');
      const companyEl = card.querySelector('[data-testid="company-name"]');
      const locationEl = card.querySelector('[data-testid="text-location"]');
      const linkEl = card.querySelector('h2.jobTitle a[data-jk]');
      const jobKey = linkEl ? linkEl.getAttribute('data-jk') : null;
      return {
        title: titleEl?.textContent.trim(),
        company: companyEl?.textContent.trim(),
        location: locationEl?.textContent.trim(),
        url: jobKey ? `https://au.indeed.com/viewjob?jk=${jobKey}` : null,
      };
    });
  });

  console.log('Jobs:', JSON.stringify(jobs, null, 2));

  // JD 상세 테스트
  if (jobs[0]?.url) {
    await page.goto(jobs[0].url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const blocked = await page.title();
    console.log('\nDetail page title:', blocked);
    const jd = await page.$eval('#jobDescriptionText', el => el.textContent.trim().substring(0, 200)).catch(() => 'NOT FOUND');
    console.log('JD:', jd);
  }

  await browser.close();
})().catch(console.error);
