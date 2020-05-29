const puppeteer = require('puppeteer');

function delay(t, val) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve(val);
    }, t);
  });
}

const getScreenshot = async () => {
  //const browser = await puppeteer.launch()
  const browser = await puppeteer.launch({ headless: false }); //pour voir directement la page s'afficher
  const page = await browser.newPage();
  await page.goto('http://localhost:8080');
  //await delay(50000)
  await page.screenshot({ path: 'screenshot.png' });
  await browser.close();
};

getScreenshot();
