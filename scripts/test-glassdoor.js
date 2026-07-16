const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
chromium.use(stealth());

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url = 'https://www.glassdoor.com.au/Job/sydney-react-native-jobs-SRCH_IL.0,6_IC2248873_KO7,19.htm';
  console.log('Fetching:', url);

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  console.log('Title:', await page.title());
  console.log('URL:', page.url());

  // 잡 카드 셀렉터 탐색
  const selectors = [
    'li[data-test="jobListing"]',
    '[data-test="job-list"] li',
    '.JobsList_jobListItem__JBBUV',
    'li.react-job-listing',
    '[class*="jobListing"]',
    '[class*="JobCard"]',
  ];
  for (const sel of selectors) {
    const count = await page.$$eval(sel, els => els.length).catch(() => 0);
    if (count > 0) console.log(`✅ ${sel}: ${count}개`);
  }

  // 바디 텍스트 500자
  const body = await page.$eval('body', el => el.innerText.substring(0, 300));
  console.log('\nBody:', body);
})().catch(console.error);
